from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Set the API key in the environment
os.environ["GOOGLE_API_KEY"] = "AIzaSyCAlMUOgurlXqEWH9M_ZqrWtiG9tP4LOr4"

def summarize_web_context(url):
    """Fetches content from a URL and uses Gemini to summarize it"""
    try:
        # Fetch the webpage content
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove non-content elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            element.decompose()
            
        # Extract title and domain
        title = soup.title.string if soup.title else "No title found"
        domain = urlparse(url).netloc
        
        # Extract main content text
        paragraphs = soup.find_all('p')
        content = "\n\n".join([p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 50])
        
        # If content is too short, try getting all text
        if len(content) < 500:
            content = soup.get_text(separator="\n\n", strip=True)
        
        # Truncate if too long
        max_chars = 8000
        if len(content) > max_chars:
            content = content[:max_chars] + "... (content truncated)"
        
        # Initialize the Gemini model
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.2)
        
        # Create a summarization prompt
        summary_template = """Summarize the following webpage content:

Title: {title}
Source: {domain}
URL: {url}

CONTENT:
{content}

Provide a comprehensive summary that includes:
1. Main topic and purpose of the page
2. Key points and important information
3. Any notable data, facts, or figures mentioned
4. Conclusion or call to action (if any)
5. Rate the overall quality of the content on a scale from 1 to 10, with 10 being excellent and 1 being poor.
6. Provide any additional comments or insights about the content.
7. Suggest improvements or additional topics to cover.
8. Important keywords or phrases that should be included in the summary.

Your summary should be clear, concise, and capture the essential information.
"""
        
        summary_prompt = PromptTemplate.from_template(summary_template)
        
        # Create the chain and invoke it
        chain = summary_prompt | llm
        summary = chain.invoke({
            "title": title,
            "domain": domain,
            "url": url,
            "content": content
        })
        
        return {
            "title": title,
            "source": domain,
            "url": url,
            "summary": summary.content,
            "success": True
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "url": url
        }

# Example usage
if __name__ == "__main__":
    # Test the web context summarization
    url = "https://medium.com/data-science-at-microsoft/evaluating-llm-systems-metrics-challenges-and-best-practices-664ac25be7e5"
    result = summarize_web_context(url)
    
    if result["success"]:
        print(f"\n=== SUMMARY OF {result['title']} ===\n")
        print(result["summary"])
    else:
        print(f"Error summarizing webpage: {result['error']}")