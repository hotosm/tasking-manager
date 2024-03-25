from fastapi import FastAPI, HTTPException
import asyncio
import psycopg2
from psycopg2 import pool
from concurrent.futures import ThreadPoolExecutor

app = FastAPI()

# Database connection pool
connection_pool = None

# Function to initialize the database connection pool
def init_connection_pool():
    global connection_pool
    connection_pool = pool.ThreadedConnectionPool(1, 10, user='your_username', password='your_password',
                                                  database='your_database', host='your_host')

# Function to execute queries asynchronously
async def execute_query(query, *args):
    loop = asyncio.get_event_loop()
    with connection_pool.getconn() as conn:
        with conn.cursor() as cur:
            await loop.run_in_executor(None, cur.execute, query, args)
            if cur.description:
                return await loop.run_in_executor(None, cur.fetchall)

# Route to fetch a user by ID
@app.get("/users/{user_id}")
async def read_user(user_id: int):
    query = "SELECT * FROM users WHERE id = %s"
    result = await execute_query(query, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return result

# Route to create a new user
@app.post("/users/")
async def create_user(name: str):
    query = "INSERT INTO users (name) VALUES (%s) RETURNING id, name"
    result = await execute_query(query, name)
    return result

# Initialize the connection pool on startup
@app.on_event("startup")
async def startup_event():
    init_connection_pool()

# Close the connection pool on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    if connection_pool:
        connection_pool.closeall()
