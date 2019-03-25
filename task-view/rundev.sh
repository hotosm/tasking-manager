trap "kill 0" EXIT

source `which virtualenvwrapper.sh`
workon task-view
export FLASK_APP=app.py
export FLASK_ENV=development
flask run &
npm run dev &

wait

