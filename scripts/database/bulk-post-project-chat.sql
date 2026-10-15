-- Post the same chat message to a list of projects as a given user, and send
-- #managers inbox notifications to each project's managers.
--
-- Usage:
--
--   export TM_CHAT_USER_ID='ADMIN_USER_ID'
--   export TM_CHAT_USERNAME='ADMIN_USERNAME'
--   export TM_CHAT_PROJECT_IDS='101,102,103'
--   export TM_CHAT_BASE_URL='https://tasks.hotosm.org'
--   export TM_CHAT_MESSAGE="$(cat message.html)"
--   export TM_CHAT_COMMIT=false
--
--   psql "$TM_DB" \
--     -v user_id="$TM_CHAT_USER_ID" \
--     -v username="$TM_CHAT_USERNAME" \
--     -v project_ids="$TM_CHAT_PROJECT_IDS" \
--     -v base_url="$TM_CHAT_BASE_URL" \
--     -v message="$TM_CHAT_MESSAGE" \
--     -v commit="${TM_CHAT_COMMIT:-false}" \
--     -f scripts/database/bulk-post-project-chat.sql
--
-- Notes:
--   * The message must be sanitized HTML, as stored by ProjectChat.create_from_dto.
--   * No emails are sent, and contributors / favourited users are not notified.
--   * Rolled back unless commit=true. Safe to re-run.

\set ON_ERROR_STOP on

\if :{?commit}
\else
\set commit false
\endif

\if :{?user_id}
\else
\echo 'Missing variable: user_id'
\quit
\endif
\if :{?username}
\else
\echo 'Missing variable: username'
\quit
\endif
\if :{?project_ids}
\else
\echo 'Missing variable: project_ids'
\quit
\endif
\if :{?base_url}
\else
\echo 'Missing variable: base_url'
\quit
\endif
\if :{?message}
\else
\echo 'Missing variable: message'
\quit
\endif

BEGIN;

SELECT NOT EXISTS (
    SELECT 1 FROM users WHERE id = :'user_id'::bigint AND username = :'username'
) AS user_mismatch \gset

\if :user_mismatch
\echo 'No user with id' :'user_id' 'and username' :'username'
ROLLBACK;
\quit
\endif

CREATE TEMP TABLE chat_project_ids ON COMMIT DROP AS
SELECT DISTINCT trim(id)::int AS id
FROM unnest(string_to_array(:'project_ids', ',')) AS id
WHERE trim(id) <> '';

\echo '== Projects'
SELECT count(*) AS requested,
       count(p.id) AS found,
       array_agg(i.id ORDER BY i.id) FILTER (WHERE p.id IS NULL) AS missing
FROM chat_project_ids i
LEFT JOIN projects p ON p.id = i.id;

\echo '== Chat messages inserted'
WITH inserted AS (
    INSERT INTO project_chat (project_id, user_id, message, time_stamp)
    SELECT p.id, :'user_id'::bigint, :'message', (now() AT TIME ZONE 'utc')
    FROM projects p
    JOIN chat_project_ids i ON i.id = p.id
    WHERE NOT EXISTS (
        SELECT 1 FROM project_chat pc
        WHERE pc.project_id = p.id
          AND pc.user_id = :'user_id'::bigint
          AND pc.message = :'message'
    )
    RETURNING project_id
)
SELECT count(*) AS chat_messages FROM inserted;

\echo '== Manager notifications inserted'
WITH recipients AS (
    SELECT pt.project_id, tm.user_id
    FROM project_teams pt
    JOIN chat_project_ids i ON i.id = pt.project_id
    JOIN team_members tm ON tm.team_id = pt.team_id AND tm.active = TRUE
    WHERE pt.role = 2                       -- TeamRoles.PROJECT_MANAGER
    UNION
    SELECT p.id, om.user_id
    FROM projects p
    JOIN chat_project_ids i ON i.id = p.id
    JOIN organisation_managers om ON om.organisation_id = p.organisation_id
),
inserted AS (
    INSERT INTO messages (message, subject, from_user_id, to_user_id, project_id, task_id, message_type, date, read)
    SELECT :'message',
           'You were mentioned in Project <a style="" href="' || :'base_url' || '/projects/' || r.project_id
               || '#questionsAndComments">' || coalesce(pi.name, '') || ' #' || r.project_id || '</a> chat',
           :'user_id'::bigint,
           r.user_id,
           r.project_id,
           NULL,
           3,                               -- MessageType.MENTION_NOTIFICATION
           (now() AT TIME ZONE 'utc'),
           false
    FROM recipients r
    JOIN projects p ON p.id = r.project_id
    LEFT JOIN project_info pi ON pi.project_id = p.id AND pi.locale = p.default_locale
    WHERE NOT EXISTS (
        SELECT 1 FROM messages m
        WHERE m.project_id = r.project_id
          AND m.to_user_id = r.user_id
          AND m.from_user_id = :'user_id'::bigint
          AND m.message_type = 3
          AND m.message = :'message'
    )
    RETURNING project_id, to_user_id
)
SELECT count(*) AS notifications,
       count(DISTINCT project_id) AS projects_with_managers,
       count(DISTINCT to_user_id) AS managers_notified
FROM inserted;

\if :commit
COMMIT;
\echo '== COMMITTED'
\else
ROLLBACK;
\echo '== DRY RUN: rolled back. Set commit=true to save.'
\endif
