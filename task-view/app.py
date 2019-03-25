import os
import psycopg2

from flask import Flask, jsonify, render_template, g

from datetime import datetime
from edits import (
    get_edits, extract_last_edits, get_xmls, get_longest_edits,
    get_task_id, get_task_osm_xml, get_task_details, get_latest_xml,
    get_project_geometry, get_project_name, get_all_tasks, get_priority_areas,
    get_projects
)

app = Flask(__name__, static_url_path='/static')
northstar_db_password = os.getenv('NORTHSTAR_DB_PASSWORD', None)
osmtm_db_password = os.getenv('OSMTM_DB_PASSWORD', None)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        if os.environ['FLASK_ENV'] == 'production':
            db = g._database = psycopg2.connect("""
                dbname='northstar'
                user='northstar'
                host='northstar-pg-west-1.cwzginpfnhup.us-west-1.rds.amazonaws.com'
                password={}}
            """.format(northstar_db_password))
        else:
            db = g._database = psycopg2.connect("""
                dbname='northstar'
                user='northstar'
                host='127.0.0.1'
                port='5433'
                password={}
            """.format(northstar_db_password))

    return db


def get_server_prefix():
    if os.environ['FLASK_ENV'] == 'production':
        return '/osm-xml-webapp/taskview'
    return ''


def get_tm_db():
    db = getattr(g, '_tm_database', None)
    if db is None:
        if os.environ['FLASK_ENV'] == 'production':
            db = g._tm_database = psycopg2.connect("""
                dbname='osmtm'
                user='postgres'
            """)
        else:
            db = g._database = psycopg2.connect("""
                dbname='osmtm'
                user='taskview'
                host='127.0.0.1'
                port='5434'
                password={}
            """.format(osmtm_db_password))
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()
    tm_db = getattr(g, '_tm_database', None)
    if tm_db is not None:
        tm_db.close()


@app.route('/')
def home():
    db = get_tm_db().cursor()
    rows = get_longest_edits(db)
    return render_template(
        'index.html',
        rows=rows,
        SERVER_PREFIX=get_server_prefix())


@app.route('/project/<int:project_id>/geometry')
def project_geom(project_id):
    tm_db = get_tm_db().cursor()
    geom = get_project_geometry(tm_db, project_id)
    project_name = get_project_name(tm_db, project_id)
    return jsonify({
            "project_id": project_id,
            "project_name": project_name,
            "geometry": geom
            })

#
@app.route('/tasks')
def tasks():
    tm_db = get_tm_db().cursor()
    return jsonify(get_all_tasks(tm_db))


@app.route('/priority-areas')
def priority_areas():
    tm_db = get_tm_db().cursor()
    return jsonify(get_priority_areas(tm_db))


@app.route('/projects')
def projects():
    tm_db = get_tm_db().cursor()
    return jsonify(get_projects(tm_db))


@app.route('/project-overview/')
def project_overview():
    return render_template(
        'project_overview.html',
        SERVER_PREFIX=get_server_prefix())



@app.route('/project/<int:project_id>/task/<int:task_id>/json')
def task_json(project_id, task_id):
    # returns information about the task and all the edits
    db = get_db().cursor()
    tm_db = get_tm_db().cursor()
    xml = get_task_osm_xml(task_id, project_id, tm_db)
    # edits = get_edits(db, xml, True, True)
    last_edit = get_latest_xml(db, xml)
    return jsonify({
        'project_id': project_id,
        'task_id': task_id,
        'stats': {
            'edit_time': 0,
            'review_time': 0,
            'difficulty': 2
        },
        'last_editor_edit': last_edit
    })


@app.route('/edit/<int:edit_id>')
def edit_json(edit_id):
    return 'this the xml file endpoint'



def mock_data():
    with open('static/data/v1.xml') as f:
        v1 = f.read()
    with open('static/data/v2.xml') as f:
        v2 = f.read()
    with open('static/data/v3.xml') as f:
        v3 = f.read()

    edits = [
        {
            'upload_time': '2018-12-06T11:55:17.043Z',
            'role': 'machine',
            'data': v1,
        },
        {
            'upload_time': '2018-12-06T12:00:17.043Z',
            'role': 'editor',
            'data': v2,
        },
        {
            'upload_time': '2018-12-06T14:55:17.043Z',
            'role': 'reviewer',
            'data': v3,
        }
    ]

    return edits

@app.route('/task/<string:xml>')
def task_page_xml(xml):

    # bypass db
    """
    edits
        role
        upload_time
        xml
    """
    # return render_template(
    #     'task.html',
    #     edits=mock_data(),
    #     task_number=1,
    #     project_number=1
    # )

    cur = get_db().cursor()
    tm_cur = get_tm_db().cursor()

    edits = get_edits(cur, xml)
    edits = extract_last_edits(edits)
    # now actually fill up the edits with xml data
    edits = get_xmls([e['upload_id'] for e in edits], cur)

    task = get_task_details(xml, tm_cur)

    return render_template(
        'task.html',
        edits=edits,
        task=task,
        SERVER_PREFIX=get_server_prefix())


# TODO(wonga):task is duplicated
@app.route('/project/<int:project_id>/task/<int:task_id>')
def task_page(project_id, task_id):
    edits = [
        {
            'date': datetime.now(),
            'role': 'editor'
        },
        {
            'date': datetime.now(),
            'role': 'reviewer'
        }
    ]
    return render_template('task.html', edits=edits)
