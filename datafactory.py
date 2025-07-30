# main.py
from scrapy.crawler import CrawlerProcess
from datetime import datetime
from scrapy.utils.project import get_project_settings
from Webspiders.extractor import PageSummarizerSpider
import pymongo
import logging, os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    format='%(asctime)s [%(levelname)s] %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def run_spider_with_mongodb(url):
    settings = get_project_settings()
    
    # Configure MongoDB pipeline
    settings.set('ITEM_PIPELINES', {
        '__main__.MongoDBPipeline': 300,
    })
    
    # MongoDB settings
    settings.set('MONGO_URI', os.getenv('Mongo_URI'))
    settings.set('MONGO_DATABASE', os.getenv('Mongo_Database'))
    
    process = CrawlerProcess(settings)
    process.crawl(PageSummarizerSpider, url=url)
    process.start()

# MongoDB Pipeline Class (include this in the same file)
class MongoDBPipeline:
    def __init__(self, mongo_uri=os.getenv('Mongo_URI'), mongo_db=os.getenv('Mongo_Database')):
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db
        self.client = None
        self.db = None

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            mongo_uri=crawler.settings.get("MONGO_URI"),
            mongo_db=crawler.settings.get("MONGO_DATABASE"),
        )

    def open_spider(self, spider):
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client[self.mongo_db]
        logger.info(f"Connected to MongoDB: {self.mongo_db}")

    def close_spider(self, spider):
        self.client.close()

    def process_item(self, item, spider):
        
        item_dict = dict(item)
        item_dict['scraped_at'] = datetime.utcnow()
        item_dict['spider_name'] = spider.name
        
        # Get collection
        collection = self.db['scraped_pages']
        
        # Check if URL already exists in database
        existing_record = collection.find_one({'url': item_dict.get('url')})
        
        if existing_record:
            # URL already exists, delete the existing record
            result = collection.delete_one({'_id': existing_record['_id']})
            logger.info(f"Deleted existing record for URL: {item_dict.get('url')} (Deleted count: {result.deleted_count})")
        
        # Insert new record
        result = collection.insert_one(item_dict)
        logger.info(f"Saved to MongoDB - ID: {result.inserted_id}")
        
        return item

def process_url(url):
    """Process a URL, checking if it exists first and handling accordingly"""
    try:
        # Connect to MongoDB first to check if URL exists
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["page_summarizer"]
        collection = db["scraped_pages"]
        
        # Check if URL exists
        existing_record = collection.find_one({'url': url})
        
        if existing_record:
            last_processed = existing_record.get('scraped_at', 'Unknown')
            logger.info(f"URL was previously processed at {last_processed}")
        
        # Process the URL
        run_spider_with_mongodb(url)
        client.close()
        
        return True
        
    except Exception as e:
        logger.error(f"Error processing URL {url}: {str(e)}")
        return False

if __name__ == '__main__':
    target_url = "https://blog.dailydoseofds.com/p/prompting-vs-rag-vs-finetuning-e43?ref=dailydev"
    process_url(target_url)