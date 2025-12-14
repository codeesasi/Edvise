import pyperclip
import time
import requests
import threading
import queue
import logging
import os
import re
from datetime import datetime
from pymongo import MongoClient, errors
from bs4 import BeautifulSoup
from newspaper import Article
from dotenv import load_dotenv
from plyer import notification

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("clipboard_monitor.log"),
        logging.StreamHandler()
    ]
)

# Load environment variables
load_dotenv()

class ClipboardMonitorPro:
    def __init__(self):
        self.last_url = ''
        self.url_queue = queue.Queue()
        self.setup_db()
        self.running = True
        
    def setup_db(self):
        """Initialize MongoDB connection."""
        try:
            mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
            self.client = MongoClient(mongo_uri)
            self.db = self.client['hyperlinkdb']
            self.collection = self.db['linkstore']
            # Create unique index on URL to prevent duplicates at DB level too
            try:
                self.collection.create_index("url", unique=True)
            except errors.OperationFailure:
                # Index exists with different options, try dropping and recreating
                logging.warning("Index conflict detected. Dropping existing 'url' index and recreating as unique.")
                self.collection.drop_index("url_1")
                self.collection.create_index("url", unique=True)
            
            logging.info("Connected to MongoDB successfully.")
        except errors.PyMongoError as e:
            logging.error(f"Failed to connect to MongoDB: {e}")
            self.collection = None

    def is_valid_url(self, url):
        """Check if the text is a valid URL."""
        url_pattern = re.compile(
            r'^https?://'
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'
            r'localhost|'
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
            r'(?::\d+)?'
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        return url_pattern.match(url) is not None

    def get_url_metadata(self, url):
        """Extracts the main content, title, thumbnail, and keywords from a URL."""
        result = {
            'url': url,
            'thumbnail': '',
            'title': '',
            'Content': '',
            'KeyWords': [],
            'Visiblity': 1,
            'ClickedCount': 0,
            'Created': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        try:
            logging.info(f"Fetching metadata for: {url}")
            article = Article(url)
            article.download()
            article.parse()
            result['title'] = article.title or ''
            result['Content'] = article.text or ''
            result['thumbnail'] = article.top_image or ''
            
            # NLP to extract keywords if possible
            try:
                article.nlp()
                result['KeyWords'] = article.keywords
            except Exception:
                pass  # NLP may fail silently
                
        except Exception as e:
            logging.warning(f"Newspaper3k failed for {url}: {e}. Falling back to BeautifulSoup.")
            # Fallback to BeautifulSoup for just the title if extraction fails
            try:
                r = requests.get(url, timeout=10)
                soup = BeautifulSoup(r.content, 'html.parser')
                if not result['title']:
                    result['title'] = (soup.title.string if soup.title else '')
                if not result['Content']:
                    body = soup.body
                    if body:
                        result['Content'] = body.get_text(separator='\n', strip=True)[:2000]
            except Exception as fetch_err:
                logging.error(f"Fetching Error for {url}: {fetch_err}")
                
        return result

    def notify_user(self, title, message):
        """Send a desktop notification."""
        try:
            notification.notify(
                title=title,
                message=message,
                app_name='Clipboard Monitor Pro',
                timeout=5
            )
        except Exception as e:
            logging.error(f"Notification failed: {e}")

    def save_to_mongodb(self, data):
        """Save extracted data to MongoDB with duplicate check."""
        if self.collection is None:
            logging.error("No database connection. Cannot save.")
            return

        try:
            # Check for duplicates
            if self.collection.find_one({"url": data['url']}):
                logging.info(f"Duplicate URL found, skipping: {data['url']}")
                self.notify_user("Duplicate Link", "This link is already in your database.")
                return

            self.collection.insert_one(data)
            logging.info(f"Successfully saved: {data['url']}")
            self.notify_user("Link Saved", f"Saved: {data['title'][:30]}...")
            
        except errors.DuplicateKeyError:
            logging.info(f"Duplicate URL caught by DB index: {data['url']}")
            self.notify_user("Duplicate Link", "This link is already in your database.")
        except errors.PyMongoError as me:
            logging.error(f"MongoDB error: {me}")
            self.notify_user("Error", f"Database error: {me}")
        except Exception as e:
            logging.error(f"Unexpected error during Mongo save: {e}")

    def worker(self):
        """Consumer thread that processes URLs from the queue."""
        logging.info("Worker thread started.")
        while self.running:
            try:
                url = self.url_queue.get(timeout=1) # timeout to allow checking self.running
                self.save_to_mongodb(self.get_url_metadata(url))
                self.url_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logging.error(f"Worker exception: {e}")

    def monitor_clipboard(self):
        """Producer loop that monitors clipboard for new URLs."""
        logging.info("Clipboard monitoring started...")
        try:
            while self.running:
                try:
                    current_url = pyperclip.paste().strip()
                except Exception as e:
                    logging.error(f"Clipboard access error: {e}")
                    time.sleep(1)
                    continue

                if current_url != self.last_url:
                    self.last_url = current_url
                    if self.is_valid_url(current_url):
                        logging.info(f"New URL detected: {current_url}")
                        self.url_queue.put(current_url)
                    else:
                        logging.debug(f"Ignored non-URL content")
                
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()

    def start(self):
        """Start the monitor and worker threads."""
        worker_thread = threading.Thread(target=self.worker, daemon=True)
        worker_thread.start()
        
        # Run monitor in main thread (or separate if needed, but main needs to stay alive)
        self.monitor_clipboard()

    def stop(self):
        """Stop the application."""
        logging.info("Stopping Clipboard Monitor Pro...")
        self.running = False

if __name__ == '__main__':
    monitor = ClipboardMonitorPro()
    try:
        monitor.start()
    except KeyboardInterrupt:
        monitor.stop()