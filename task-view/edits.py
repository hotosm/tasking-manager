import psycopg2


def rows_to_dict(rows, columns):
    out = []
    for row in rows:
        r = {columns[idx]:row[idx] for idx in xrange(len(columns))}
        out.append(r)

    return out


def get_project_name(cur, project_id):
    query = """
        select project_name from junderwood.all_task_stats where project_id=%s limit 1;
    """
    cur.execute(query, (project_id,))
    rows = cur.fetchall()
    return rows[0]


def get_projects(cur):
    return get_single_result(cur, """
        SELECT row_to_json(fc)
        FROM (
            SELECT
                'FeatureCollection' as type,
                array_to_json(array_agg(f)) as features
            FROM (
                SELECT
                    'Feature' as type,
                    ST_AsGeoJSON(a.geometry)::json as geometry,
                    row_to_json((SELECT l from (
                        SELECT
                            p.id as project_id,
                            pt.name as name
                        ) as l)) as properties
                FROM project p
                JOIN areas a
                    ON p.area_id=a.id
                JOIN project_translation pt
                    ON pt.id = p.id AND pt.locale='en'
                WHERE pt.name ilike '%thailand%'
            ) as f
        ) as fc
    """)


def get_project_geometry(cur, project_id):
    query = """
        SELECT row_to_json(fc)
        FROM (
            SELECT
                'FeatureCollection' as type,
                array_to_json(array_agg(f)) as features
            FROM (
                SELECT
                    'Feature' as type,
                    ST_AsGeoJSON(t.geometry)::json as geometry,
                    row_to_json((SELECT l from (
                        SELECT
                            t.id as task_id,
                            t.project_id as project_id,
                            round(extract(epoch from ts.total_time)) as total_time,
                            ts.new_ways_count,
                            ts.difficulty,
                            t.extra_properties::json ->> 'task_osm' as xml_path
                        ) as l)) as properties
                    FROM task t
                    JOIN junderwood.all_task_stats ts
                        ON ts.task_id=t.id and ts.project_id=t.project_id
                    WHERE t.project_id=%s AND ts.task_type='Editing'
            ) as f
        ) as fc
    """
    cur.execute(query, (project_id,))
    rows = cur.fetchall()
    return rows[0]


def get_single_result(cur, query):
    cur.execute(query)
    row = cur.fetchone()
    if len(row) == 1:
        return row[0]

    return row


def get_priority_areas(cur):
    return get_single_result(cur, """
        SELECT row_to_json(fc)
        FROM (
            SELECT
                'FeatureCollection' as type,
                array_to_json(array_agg(f)) as features
            FROM (
                SELECT
                    'Feature' as type,
                    ST_AsGeoJSON(pa.geometry)::json as geometry,
                    row_to_json((SELECT l from (
                        SELECT
                            pa.id as id
                        ) as l)) as properties
                    FROM priority_area pa
            ) as f
        ) as fc
    """)


def get_all_tasks(cur):
    return get_single_result(cur, """
        SELECT row_to_json(fc)
        FROM (
            SELECT
                'FeatureCollection' as type,
                array_to_json(array_agg(f)) as features
            FROM (
                SELECT
                    'Feature' as type,
                    ST_AsGeoJSON(t.geometry)::json as geometry,
                    row_to_json((SELECT l from (
                        SELECT
                            t.id as task_id,
                            t.project_id as project_id,
                            t.id || ':' || t.project_id as unique_key,
                            round(extract(epoch from ts.total_time)) as total_time,
                            ts.new_ways_count,
                            ts.difficulty,
                            t.extra_properties::json ->> 'task_osm' as xml_path
                        ) as l)) as properties
                    FROM task t
                    JOIN junderwood.all_task_stats ts
                        ON ts.task_id=t.id AND ts.project_id=t.project_id
                    JOIN project_translation p
                        ON t.project_id=p.id AND p.locale='en'
                    WHERE
                        --- t.project_id in (SELECT DISTINCT(project_id) from task where task.date > now() - interval '20 days') AND
                        ts.task_type='Editing' AND
                        p.name ilike '%thailand%'
            ) as f
        ) as fc
    """)


def get_longest_edits(cur):
    query = """
        with ranked as (
            select
                t.task_id,
                t.project_id,
                t.name,
                t.project_name,
                t.task_type,
                t.total_time,
                date(t.date),
                t.difficulty,
                task.extra_properties::json ->> 'task_osm' as osm,
                row_number() over (
                    PARTITION BY split_part(t.project_name, '_', 1)
                    ORDER BY t.total_time DESC
                )
            from junderwood.all_task_stats t
            JOIN task
                ON t.task_id=task.id and t.project_id=task.project_id
            WHERE
                t.project_name like '%prod%' AND
                t.task_type like 'Editing' AND
                t.date > now() - interval '1 week' AND
                t.total_time < '4 hour'
        )
        SELECT * from ranked WHERE row_number < 8
    """
    cur.execute(query)
    rows = cur.fetchall()

    return rows_to_dict(rows, [
        'task_id',
        'project_id',
        'user',
        'project_name',
        'task_type',
        'total_time',
        'date',
        'difficulty',
        'task_osm'
    ])


def get_latest_xml(cur, base_xml):
    ''' retrieves xml of latest edit'''
    out = []
    cur.execute("""
        SELECT
            upload_id,
            upload_time,
            split_part(permalink, '/', 1),
            data
        from osm_xml_uploads
        where permalink like %s AND
        split_part(permalink, '/', 1) like 'editor'
        order by upload_time desc
        limit 1
    """, ('%' + base_xml,))
    rows = cur.fetchall()
    for row in rows:
        out.append({
            'upload_id': row[0],
            'upload_time': row[1],
            'role': row[2],
            'data': row[3]
        })

    return out


def get_edits(cur, base_xml, only_role_changes=False, include_data=False):
    '''retrieves all map edits from the xml that share the same xml base path

    returns the edits asceding time order

    note: this is not the same as listing all the edits and is a better view
    into when each role is actually modifying the graph
    '''

    edits_query = """
        select
            upload_id,
            upload_time,
            permalink
        from osm_xml_uploads
        where permalink like %s
        order by upload_id asc
    """
    cur.execute(edits_query, ('%' + base_xml,))
    rows = cur.fetchall()

    # turn it all into dictionaries
    edits = []
    for (upload_id, upload_time, permalink) in rows:
        edits.append({
            'upload_id': upload_id,
            'upload_time': upload_time,
            'permalink': permalink,
            'role': permalink.split('/')[0]
        })

    grouped_edits = {}

    # from the first three edits, pickout the machine edit
    for edit in edits[:3]:
        if edit['role'] == 'machine':
            grouped_edits[edit['upload_time']] = edit
    if not grouped_edits:
        # just dump something in there
        first_edit = edits[0]
        grouped_edits[first_edit['upload_time']] = first_edit

    for edit in edits[3:]:
        key = edit['upload_time']
        if key not in grouped_edits:
            grouped_edits[key] = edit
        elif edit['role'] == 'machine':
            grouped_edits[key] = edit
        elif edit['role'] == 'editor' and not grouped_edits[key]['role'] == 'machine':
            grouped_edits[key] = edit

    edits = [grouped_edits[k] for k in sorted(grouped_edits.keys())]

    if only_role_changes:
        edits = extract_last_edits(edits)

    if include_data:
        edits = get_xmls([e['upload_id'] for e in edits], cur)

    return edits


def extract_last_edits(edits):
    '''the edit right before each role change'''
    out = []
    last_edit = edits[0]

    for edit in edits[1:]:
        if edit['role'] != last_edit['role']:
            out.append(last_edit)
        last_edit = edit

    out.append(last_edit)

    return out


def print_edits(edits):
    for edit in edits:
        print '{}\t{}\t{}'.format(
            edit['upload_id'], edit['upload_time'].isoformat(), edit['role'])


def get_xmls(upload_ids, cur):
    out = []
    cur.execute("""
        SELECT upload_id, upload_time, split_part(permalink, '/', 1), data
        from osm_xml_uploads where upload_id IN %s
    """, (tuple(upload_ids),))
    rows = cur.fetchall()
    for row in rows:
        out.append({
            'upload_id': row[0],
            'upload_time': row[1],
            'role': row[2],
            'data': row[3]
        })

    return out


def write_xmls(upload_ids, cur):
    for upload_id in upload_ids:
        cur.execute("""
            SELECT upload_time, permalink, data
            from osm_xml_uploads where upload_id=%s
        """, (upload_id,))
        rows = cur.fetchall()

        (upload_time, permalink, data) = rows[0]
        permalink = permalink.replace('/', '-')

        filename = upload_time.strftime('%Y-%m-%dT%H-%M-%S') + '_' + permalink

        print 'writing out', filename
        with open(filename, 'w') as f:
            f.write(data)


def list_states(base_xml, cur):
    cur.execute("""
        SELECT
            ts.state, ts.user_id, ts.date
        from junderwood.task_state ts
        JOIN task t
        ON t.id=ts.task_id AND t.project_id=ts.project_id
        WHERE
        t.extra_properties::json->>'task_osm' LIKE %s
        ORDER BY ts.date desc
    """, (base_xml,))
    rows = cur.fetchall()
    STATES = [
        'init',
        'rejected',
        'editing done',
        'reviewed',
        'published'
    ]

    for (state, user_id, date) in rows:
        print '{}\t{}\t{}'.format(date.isoformat(), user_id, STATES[state])


def get_task_osm_xml(task_id, project_id, cur):
    cur.execute("""
        SELECT extra_properties::json->>'task_osm'
        from task where
        id=%s AND project_id=%s
    """, (task_id, project_id,))
    rows = cur.fetchall()
    osm_xml = rows[0][0]

    return osm_xml


def get_task_id(base_xml, cur):
    cur.execute("""
        SELECT id, project_id from task where
        extra_properties::json->>'task_osm' like %s
    """, (base_xml,))
    rows = cur.fetchall()
    (id, project_id) = rows[0]

    return (id, project_id)


def get_task_details(base_xml, cur):
    cur.execute("""
        SELECT
            t.id as task_id,
            t.project_id,
            ST_AsGEOJSON(t.geometry) as geometry,
            ts.difficulty
        FROM task t
        LEFT JOIN junderwood.all_task_stats ts
            ON t.id=ts.task_id AND t.project_id=ts.project_id
        WHERE
        extra_properties::json->>'task_osm' like %s
    """, (base_xml,))
    rows = cur.fetchall()
    return {
        'task_id': rows[0][0],
        'project_id': rows[0][1],
        'geometry': rows[0][2],
        'difficulty': rows[0][3]
    }


def get_task(base_xml, cur):
    (id, project_id) = get_task_id(base_xml, cur)
    return 'https://tm.nsosm.com/project/{}#task/{}'.format(project_id, id)
