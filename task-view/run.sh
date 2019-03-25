source task-view/bin/activate
export FLASK_APP=app.py
export FLASK_ENV=production
gunicorn -b 0.0.0.0:8020 app:app
