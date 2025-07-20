import pyperclip
import time
import requests
from bs4 import BeautifulSoup
from models import URL
from config import get_db_connection
import re

def is_valid_url(url):
    url_pattern = re.compile(
        r'^https?://'
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'
        r'localhost|'
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
        r'(?::\d+)?'
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return url_pattern.match(url) is not None

def get_url_metadata(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        title = soup.title.string if soup.title else url
        thumbnail = soup.find('meta', property='og:image')
        thumbnail_url = thumbnail['content'] if thumbnail else None
        
        return title, thumbnail_url
    except:
        return url, None

def clip_monitor():
    last_url = ''
    conn = get_db_connection()
    
    while True:
        current_url = pyperclip.paste().strip()
        
        if current_url != last_url and is_valid_url(current_url):
            title, thumbnail = get_url_metadata(current_url)
            
            if not URL.find_by_url(conn, current_url):
                URL.add(conn, current_url, title, thumbnail)
                print(f"Added new URL: {current_url}")
            
            last_url = current_url
        
        time.sleep(1)
