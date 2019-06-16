export FLASK_APP=app.py
export FLASK_ENV=production
gunicorn --log-file=$TASK_VIEW_LOG_FILE -b 0.0.0.0:8020 app:app
