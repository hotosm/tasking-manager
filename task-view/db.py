import os
import psycopg2

northstar_db_password = os.getenv('NORTHSTAR_DB_PASSWORD', None)
osmtm_db_password = os.getenv('OSMTM_DB_PASSWORD', None)


def get_northstar_db():
    if os.environ.get('FLASK_ENV') == 'production':
        db = psycopg2.connect("""
            dbname='northstar'
            user='northstar'
            host='northstar-pg-west-1.cwzginpfnhup.us-west-1.rds.amazonaws.com'
            password={}
        """.format(northstar_db_password))
    else:
        db = psycopg2.connect("""
            dbname='northstar'
            user='northstar'
            host='127.0.0.1'
            port='5433'
            password={}
        """.format(northstar_db_password))

    return db


def get_osmtm_db():
    if os.environ.get('FLASK_ENV') == 'production':
        db = psycopg2.connect("""
            dbname='osmtm'
            user='postgres'
        """)
    else:
        db = psycopg2.connect("""
            dbname='osmtm'
            user='taskview'
            host='127.0.0.1'
            port='5434'
            password={}
        """.format(osmtm_db_password))

    return db
