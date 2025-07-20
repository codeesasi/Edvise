from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

class URL:
    @staticmethod
    def create_table(conn):
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS url (
                    id SERIAL PRIMARY KEY,
                    url VARCHAR(500) UNIQUE NOT NULL,
                    title VARCHAR(200),
                    thumbnail VARCHAR(500),
                    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()

    @staticmethod
    def add(conn, url, title, thumbnail):
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO url (url, title, thumbnail) VALUES (%s, %s, %s)",
                (url, title, thumbnail)
            )
        conn.commit()

    @staticmethod
    def get_all(conn):
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM url ORDER BY created_date DESC")
            return cur.fetchall()

    @staticmethod
    def find_by_url(conn, url):
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM url WHERE url = %s", (url,))
            return cur.fetchone()

    @staticmethod
    def delete(conn, url):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM url WHERE url = %s", (url,))
        conn.commit()

    @staticmethod
    def update(conn, url, title, thumbnail):
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE url SET title = %s, thumbnail = %s WHERE url = %s",
                (title, thumbnail, url)
            )
        conn.commit()
