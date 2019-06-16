# Task View

Task View is an app that visualizes the process of refining machine learning roads into final osm updates.

The app connects to the tasking manager database and xml edits database to visualize diff histories of map editing tasks.

## Installation

The main server is a flask app, and the python dependencies can be installed with

```
pip install -r requirements.txt
```

It is best to install the dependencies in a virtualenv -- the rundev.sh currently assumes there is a virtualenv named `task-view`

To install the front end code

```
npm install
```

## Configuration

Configure the passwords for the databases in the environment variables

```
export NORTHSTAR_DB_PASSWORD=[password]
export OSMTM_DB_PASSWORD=[password]
```

To setup the tunnels for database access in development mode, you should also supply the environment variable for sshing into the aws host

```
export SSH_AWS_HOST=username@aws-tm
```

The tunnel can then be setup with

```
bash tunnel.sh
```

Running this once will setup the tunnel for the server as well as the command-line tools

## Server

The server is Python Flask server. The front end app is a React app packaged with Parcel.js.

### Running server in development mode

`bash rundev.sh`

This will build the front end code and launch the flask server, hosted on http://localhost:5000

### Deploying server to production

`bash deploy.sh`

will copy the directory to the aws server.

### Running server in production

The server is run through gunicorn in production. Only the northstar db `NORTHSTAR_DB_PASSWORD` needs to provided in an environment variable as the tasking manager db shares the same user in production. The path to the gunicorn access and error logs supplied:

`NORTHSTAR_DB_PASSWORD='xxx' TASK_VIEW_ACCESS_LOG_FILE=/home/user/task-view.log TASK_VIEW_ERROR_LOG_FILE=/home/user/task-view.error.log bash runprod.sh`


## CLI tools

### xml-dl.py
utility for downloading xml edits given a task id or path also inspects latest tasks and their states

For full functionality see `python xml-dl.py --help`

Example: retrieving a list of edits, whenever the role changes
```
$ python xml-dl.py --shortlist --task 3 --project 1023
139246  2017-12-18T18:30:29.080132  machine
361438  2018-02-24T03:06:06.590574  editor
361440  2018-02-24T03:07:44.507139  reviewer
```

Example: downloading xmls for the same edits to the folder `ff`
```
$ python xml-dl.py --download --task 3 --project 1023 --dir ff
writing out ff/2017-12-18T18-30-29_machine-AOP_AS51_Q116_V1_370_403_152_9_R8C2_road_1_0.xml
writing out ff/2018-02-24T03-06-06_editor-AOP_AS51_Q116_V1_370_403_152_9_R8C2_road_1_0.xml
writing out ff/2018-02-24T03-07-44_reviewer-AOP_AS51_Q116_V1_370_403_152_9_R8C2_road_1_0.xml
```

### xml-info.py
this utility inspects edits and computes statistics across multiple edits for a given task

For full functionality see `python xml-info.py --help`

Example: count number of ways per edit

```
$ python xml-info.py --num-ways --task 3 --project 1023
[
    {
        "role": "machine",
        "upload_time": "2017-12-18T18:30:29.080132",
        "upload_id": 139246,
        "idx": 1,
        "data": {
            "new": 71,
            "existing": 65
        }
    },
    {
        "role": "editor",
        "upload_time": "2018-02-24T03:06:06.590574",
        "upload_id": 361438,
        "idx": 2,
        "data": {
            "new": 21,
            "existing": 50
        }
    },
    {
        "role": "reviewer",
        "upload_time": "2018-02-24T03:07:44.507139",
        "upload_id": 361440,
        "idx": 3,
        "data": {
            "new": 21,
            "existing": 58
        }
    }
]
```

Example: compute stats on a task

```
$ python xml-info.py --stats --task 3 --project 1023
[
    {
        "role": "machine",
        "upload_time": "2017-12-18T18:30:29.080132",
        "upload_id": 139246,
        "idx": 1,
        "data": {
            "lengths": {
                "new_total": 11.359101165622652,
                "new_unclassified": 9.325373901305044,
                "existing_unclassified": 8.002739602237376,
                "total": 38.2647674966374,
                "new_track": 0,
                "existing_track": 0.24551861912723044,
                "existing_other": 12.752009465072867,
                "new_other": 0,
                "new_residential": 2.033727264317608,
                "existing_residential": 5.905398644577271,
                "existing_total": 26.905666331014743
            },
            "counts": {
                "unclassified": 36,
                "residential": 35
            },
            "lint_tags": []
        }
    },
    {
        "role": "editor",
        "upload_time": "2018-02-24T03:06:06.590574",
        "upload_id": 361438,
        "idx": 2,
        "data": {
            "lengths": {
                "new_total": 8.714546413422022,
                "new_unclassified": 3.1617671967419154,
                "existing_unclassified": 8.505867685204795,
                "total": 35.629693046164164,
                "new_track": 3.543196858897263,
                "existing_track": 0.24551861912723044,
                "existing_other": 12.75200956738108,
                "new_other": 0,
                "new_residential": 2.0095823577828438,
                "existing_residential": 5.411750761029039,
                "existing_total": 26.91514663274216
            },
            "counts": {
                "track": 5,
                "unclassified": 3,
                "residential": 13
            },
            "lint_tags": []
        }
    },
    {
        "role": "reviewer",
        "upload_time": "2018-02-24T03:07:44.507139",
        "upload_id": 361440,
        "idx": 3,
        "data": {
            "lengths": {
                "new_total": 8.717193420399934,
                "new_unclassified": 3.1644142037198266,
                "existing_unclassified": 14.462314457172937,
                "total": 42.66448018800837,
                "new_track": 3.543196858897263,
                "existing_track": 0.24551861912723044,
                "existing_other": 13.10070471321805,
                "new_other": 0,
                "new_residential": 2.0095823577828438,
                "existing_residential": 6.138748978090214,
                "existing_total": 33.94728676760843
            },
            "counts": {
                "track": 5,
                "unclassified": 3,
                "residential": 13
            },
            "lint_tags": []
        }
    }
]
```
