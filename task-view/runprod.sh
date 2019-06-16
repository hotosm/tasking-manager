export FLASK_APP=app.py
export FLASK_ENV=production
gunicorn --access-logfile=$TASK_VIEW_ACCESS_LOG_FILE --error-logfile=$TASK_VIEW_ERROR_LOG_FILE -b 0.0.0.0:8020 app:app
