trap "kill 0" EXIT

export FLASK_APP=app.py
export FLASK_ENV=development
flask run &
npm run dev &

wait

