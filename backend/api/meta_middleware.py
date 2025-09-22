from bs4 import BeautifulSoup

class HtmlMetaMiddleware:
    """
    Middleware that adds charset meta tag to HTML responses if missing
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Only process HTML responses
        if response.has_header('Content-Type') and 'text/html' in response['Content-Type']:
            # Check if we can modify the content
            if hasattr(response, 'content') and response.content:
                try:
                    # Parse HTML content
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Check if meta charset exists
                    charset_meta = soup.find('meta', charset=True)
                    content_type_meta = soup.find('meta', attrs={'http-equiv': 'Content-Type'})
                    
                    if not charset_meta and not content_type_meta:
                        # Add meta charset tag to head
                        if soup.head:
                            meta_tag = soup.new_tag('meta')
                            meta_tag['charset'] = 'utf-8'
                            soup.head.insert(0, meta_tag)
                            
                            # Update the response content
                            response.content = str(soup).encode('utf-8')
                
                except Exception as e:
                    # If BeautifulSoup parsing fails, log error but don't block the response
                    print(f"HTML meta processing error: {e}")
        
        return response