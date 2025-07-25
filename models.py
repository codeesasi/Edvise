from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

logger = logging.getLogger(__name__)

class URL:
    @staticmethod
    def create_table(conn):
        """Create the URL table if it doesn't exist"""
        try:
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
        except psycopg2.Error as e:
            logger.error(f"Database error creating table: {e}")
            conn.rollback()
            raise

    @staticmethod
    def add(conn, url, title, thumbnail):
        """Add a new URL to the database"""
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO url (url, title, thumbnail) VALUES (%s, %s, %s)",
                    (url, title, thumbnail)
                )
            conn.commit()
        except psycopg2.Error as e:
            logger.error(f"Database error adding URL: {e}")
            conn.rollback()
            raise

    @staticmethod
    def get_all(conn):
        """Get all URLs from the database"""
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM url ORDER BY created_date DESC")
                return cur.fetchall()
        except psycopg2.Error as e:
            logger.error(f"Database error fetching URLs: {e}")
            raise

    @staticmethod
    def find_by_url(conn, url):
        """Find a URL by its address"""
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM url WHERE url = %s", (url,))
                return cur.fetchone()
        except psycopg2.Error as e:
            logger.error(f"Database error finding URL: {e}")
            raise

    @staticmethod
    def delete(conn, url):
        """Delete a URL from the database"""
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM url WHERE url = %s", (url,))
                rows_affected = cur.rowcount
            conn.commit()
            return rows_affected > 0
        except psycopg2.Error as e:
            logger.error(f"Database error deleting URL: {e}")
            conn.rollback()
            raise

    @staticmethod
    def update(conn, url, title, thumbnail):
        """Update URL metadata"""
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE url SET title = %s, thumbnail = %s WHERE url = %s",
                    (title, thumbnail, url)
                )
                rows_affected = cur.rowcount
            conn.commit()
            return rows_affected > 0
        except psycopg2.Error as e:
            logger.error(f"Database error updating URL: {e}")
            conn.rollback()
            raise
