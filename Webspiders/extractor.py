import scrapy
from urllib.parse import urljoin
import re
import json

class PageSummarizerSpider(scrapy.Spider):
    name = 'summarizer'
    
    def __init__(self, url=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_urls = [url] if url else ['https://example.com']
    
    def parse(self, response):
        # Extract content optimized for AI summarization
        summarization_data = {
            # Essential metadata
            'url': response.url,
            'title': self.clean_text(response.css('title::text').get()),
            'meta_description': response.css('meta[name="description"]::attr(content)').get(),
            'thumbnail': response.css('meta[property="og:image"]::attr(content)').get(),
            # Main content for summarization
            'main_content': self.extract_main_content(response),
            'image_urls': response.css('img::attr(src)').getall(),
            # Structured content
            'headings_hierarchy': self.extract_headings_hierarchy(response),
            'key_paragraphs': self.extract_key_paragraphs(response),
            'article_content': self.extract_article_content(response),
            
            # Additional context
            'important_lists': self.extract_important_lists(response),
            'key_quotes': self.extract_quotes(response),
            'table_summaries': self.extract_table_summaries(response),
            
            # Content statistics for AI context
            'content_stats': self.get_content_stats(response),
            
            # Content for AI prompt
            'ai_ready_text': self.prepare_ai_text(response)
        }
        
        yield summarization_data
    
    def clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ""
        # Remove extra whitespace and normalize
        return ' '.join(text.split()).strip()
    
    def extract_main_content(self, response):
        """Extract the main content area of the page"""
        # Try to find main content areas first
        main_selectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.main-content',
            '.post-content',
            '.entry-content',
            '.article-content',
            '#content',
            '#main'
        ]
        
        main_content = ""
        for selector in main_selectors:
            content = response.css(f'{selector} *:not(script):not(style)::text').getall()
            if content:
                main_content = ' '.join([self.clean_text(text) for text in content if self.clean_text(text)])
                if len(main_content) > 100:  # Ensure we have substantial content
                    break
        
        # Fallback to body content if no main content found
        if not main_content or len(main_content) < 100:
            all_text = response.css('body *:not(script):not(style):not(nav):not(header):not(footer)::text').getall()
            main_content = ' '.join([self.clean_text(text) for text in all_text if self.clean_text(text) and len(self.clean_text(text)) > 3])
        
        return main_content
    
    def extract_headings_hierarchy(self, response):
        """Extract headings to understand content structure"""
        headings = []
        for i in range(1, 7):  # h1 to h6
            for heading in response.css(f'h{i}'):
                text = self.clean_text(heading.css('::text').get())
                if text:
                    headings.append({
                        'level': i,
                        'text': text
                    })
        return headings
    
    def extract_key_paragraphs(self, response):
        """Extract paragraphs with substantial content"""
        paragraphs = response.css('p::text').getall()
        key_paragraphs = []
        
        for p in paragraphs:
            cleaned = self.clean_text(p)
            # Filter paragraphs with meaningful content (length > 50 chars, contains letters)
            if len(cleaned) > 50 and re.search(r'[a-zA-Z]', cleaned):
                key_paragraphs.append(cleaned)
        
        return key_paragraphs
    
    def extract_article_content(self, response):
        """Try to extract structured article content"""
        article_selectors = [
            'article p',
            '.post-body p',
            '.entry-content p',
            '.article-body p',
            '.content p'
        ]
        
        article_content = []
        for selector in article_selectors:
            paragraphs = response.css(f'{selector}::text').getall()
            if paragraphs:
                cleaned_paragraphs = [self.clean_text(p) for p in paragraphs if len(self.clean_text(p)) > 30]
                if len(cleaned_paragraphs) > 2:  # Ensure it's substantial
                    article_content = cleaned_paragraphs
                    break
        
        return article_content
    
    def extract_important_lists(self, response):
        """Extract lists that might contain key information"""
        important_lists = []
        
        # Look for lists in main content areas
        for ul in response.css('article ul, main ul, .content ul, .post-content ul'):
            items = []
            for li in ul.css('li'):
                item_text = self.clean_text(' '.join(li.css('::text').getall()))
                if item_text and len(item_text) > 10:
                    items.append(item_text)
            
            if items and len(items) >= 2:  # Only include substantial lists
                important_lists.append({
                    'type': 'unordered',
                    'items': items
                })
        
        return important_lists
    
    def extract_quotes(self, response):
        """Extract blockquotes and important quotes"""
        quotes = []
        
        # Blockquotes
        for quote in response.css('blockquote'):
            quote_text = self.clean_text(' '.join(quote.css('::text').getall()))
            if quote_text and len(quote_text) > 20:
                quotes.append({
                    'type': 'blockquote',
                    'text': quote_text
                })
        
        # Text in quotes
        all_text = ' '.join(response.css('::text').getall())
        quote_patterns = [
            r'"([^"]{30,200})"',  # Double quotes
            r'\'([^\']{30,200})\'',  # Smart quotes
        ]
        
        for pattern in quote_patterns:
            matches = re.findall(pattern, all_text)
            for match in matches[:5]:  # Limit to first 5 matches
                quotes.append({
                    'type': 'quoted_text',
                    'text': self.clean_text(match)
                })
        
        return quotes
    
    def extract_table_summaries(self, response):
        """Extract and summarize table content"""
        table_summaries = []
        
        for i, table in enumerate(response.css('table')):
            # Get table caption or first row as description
            caption = self.clean_text(table.css('caption::text').get())
            
            # Get headers
            headers = [self.clean_text(h) for h in table.css('th::text').getall() if self.clean_text(h)]
            
            # Count rows and get sample data
            rows = table.css('tr')
            row_count = len(rows)
            
            # Get first few data rows for context
            sample_data = []
            for row in rows[1:4]:  # Skip header, get first 3 data rows
                row_data = [self.clean_text(cell) for cell in row.css('td::text').getall()]
                if row_data:
                    sample_data.append(row_data)
            
            if headers or sample_data:
                table_summaries.append({
                    'caption': caption,
                    'headers': headers,
                    'row_count': row_count,
                    'sample_data': sample_data
                })
        
        return table_summaries
    
    def get_content_stats(self, response):
        """Get content statistics for AI context"""
        main_text = self.extract_main_content(response)
        words = main_text.split() if main_text else []
        
        return {
            'word_count': len(words),
            'character_count': len(main_text),
            'paragraph_count': len(response.css('p').getall()),
            'heading_count': len(response.css('h1, h2, h3, h4, h5, h6').getall()),
            'estimated_reading_time': max(1, len(words) // 200)  # ~200 words per minute
        }
    
    def prepare_ai_text(self, response):
        """Prepare clean, structured text ready for AI summarization"""
        title = self.clean_text(response.css('title::text').get()) or ""
        main_content = self.extract_main_content(response)
        headings = self.extract_headings_hierarchy(response)
        
        # Structure the text for AI
        ai_text_parts = []
        
        # Add title
        if title:
            ai_text_parts.append(f"Title: {title}")
        
        # Add main headings for structure
        main_headings = [h['text'] for h in headings if h['level'] <= 3][:5]
        if main_headings:
            ai_text_parts.append(f"Main sections: {', '.join(main_headings)}")
        
        # Add main content
        if main_content:
            # Truncate if too long (most AI models have token limits)
            if len(main_content) > 4000:
                main_content = main_content[:4000] + "..."
            ai_text_parts.append(f"Content: {main_content}")
        
        return "\n\n".join(ai_text_parts)

# AI Integration Helper Functions
def prepare_for_ai_summary(scraped_data):
    """Prepare scraped data for AI summarization"""
    prompt_data = {
        'title': scraped_data.get('title', ''),
        'url': scraped_data.get('url', ''),
        'main_content': scraped_data.get('ai_ready_text', ''),
        'content_type': determine_content_type(scraped_data),
        'reading_time': scraped_data.get('content_stats', {}).get('estimated_reading_time', 1)
    }
    return prompt_data

def determine_content_type(data):
    """Determine the type of content for better AI prompting"""
    headings = data.get('headings_hierarchy', [])
    word_count = data.get('content_stats', {}).get('word_count', 0)
    
    if any('news' in h['text'].lower() for h in headings[:3]):
        return 'news_article'
    elif word_count > 1500:
        return 'long_form_article'
    elif data.get('table_summaries'):
        return 'data_heavy_content'
    elif len(headings) > 5:
        return 'structured_guide'
    else:
        return 'general_content'

def create_ai_prompt(prepared_data):
    """Create an optimized prompt for AI summarization"""
    content_type = prepared_data['content_type']
    
    base_prompt = f"""
Please summarize the following webpage content:

Title: {prepared_data['title']}
URL: {prepared_data['url']}
Estimated reading time: {prepared_data['reading_time']} minutes
Content type: {content_type}

Content:
{prepared_data['main_content']}

Please provide:
1. A brief summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Main topic/theme
"""
    
    return base_prompt

# Usage example
if __name__ == "__main__":
    from scrapy.crawler import CrawlerProcess
    
    def run_summarizer(url):
        process = CrawlerProcess({
            'FEEDS': {
                'page_content.json': {'format': 'json', 'overwrite': True},
            },
            'LOG_LEVEL': 'WARNING',  # Reduce log noise
        })
        
        process.crawl(PageSummarizerSpider, url=url)
        process.start()
        
        # Load the extracted data
        try:
            with open('page_content.json', 'r') as f:
                data = json.load(f)[0]  # Get first item
            
            # Prepare for AI
            ai_data = prepare_for_ai_summary(data)
            prompt = create_ai_prompt(ai_data)
            
            print("=== AI-Ready Content ===")
            print(prompt)
            
            return ai_data, prompt
            
        except Exception as e:
            print(f"Error loading data: {e}")
            return None, None
