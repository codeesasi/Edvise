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
                # Create URLs table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS url (
                        id SERIAL PRIMARY KEY,
                        url VARCHAR(500) UNIQUE NOT NULL,
                        title VARCHAR(200),
                        thumbnail VARCHAR(500),
                        visit INT DEFAULT 0,
                        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create settings table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS tbl_settings (
                    Settings_id UUID DEFAULT gen_random_uuid(),
                    refreshInterval INTEGER DEFAULT 30000 NOT NULL,
                    itemsPerPage INTEGER DEFAULT 5 NOT NULL,
                    UImode TEXT DEFAULT 'DARK',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
            conn.commit()
        except psycopg2.Error as e:
            logger.error(f"Database error creating tables: {e}")
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
                cur.execute("""
                    select um.id,um.url,um.title,um.thumbnail,mv.visit from tbl_urlmanagement um 
                    join tbl_maintainvisit mv ON um.id = mv.url_id 
                    WHERE um.enable = 1 order by um.created_date DESC;
                """)
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
    def delete(conn, id):
        """Delete a URL from the database"""
        try:
            with conn.cursor() as cur:
                cur.execute("UPDATE tbl_urlmanagement SET enable = 0 WHERE id = %s", (id,))
                rows_affected = cur.rowcount
            conn.commit()
            return rows_affected > 0
        except psycopg2.Error as e:
            logger.error(f"Database error deleting URL: {e}")
            conn.rollback()
            raise

    @staticmethod
    def update(conn, id, title, thumbnail):
        """Update URL metadata"""
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE tbl_urlmanagement SET title = %s, thumbnail = %s WHERE id = %s",
                    (title, thumbnail, id)
                )
                rows_affected = cur.rowcount
            conn.commit()
            return rows_affected > 0
        except psycopg2.Error as e:
            logger.error(f"Database error updating URL: {e}")
            conn.rollback()
            raise

    @staticmethod
    def update_visit(conn, id):
        """Increment visit count for a URL"""
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE tbl_maintainvisit SET visit = visit + 1 WHERE id = %s",
                    (id,)
                )
                rows_affected = cur.rowcount
            conn.commit()
            return rows_affected > 0
        except psycopg2.Error as e:
            logger.error(f"Database error updating URL visit: {e}")
            conn.rollback()
            raise

class Settings:
    @staticmethod
    def get_all(conn):
        """Get all settings from the database"""
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT key, value FROM settings")
                settings = cur.fetchall()
                # Convert list of dicts to single dict for easier consumption
                return {item['key']: item['value'] for item in settings}
        except psycopg2.Error as e:
            logger.error(f"Database error fetching settings: {e}")
            raise

    @staticmethod
    def update(conn, key, value):
        """Update a setting"""
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO settings (key, value, updated_at) 
                    VALUES (%s, %s, NOW()) 
                    ON CONFLICT (key) DO UPDATE 
                    SET value = %s, updated_at = NOW()
                    """,
                    (key, value, value)
                )
                rows_affected = cur.rowcount
            conn.commit()
            return rows_affected > 0
        except psycopg2.Error as e:
            logger.error(f"Database error updating setting {key}: {e}")
            conn.rollback()
            raise