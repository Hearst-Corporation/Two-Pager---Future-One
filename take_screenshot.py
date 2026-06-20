from playwright.sync_api import sync_playwright
import sys

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        try:
            print("Navigating to http://localhost:5005/admin/hearst/simulator...")
            page.goto('http://localhost:5005/admin/hearst/simulator', timeout=60000)
            page.wait_for_load_state('networkidle')
            # Wait a bit more for any animations or late rendering
            page.wait_for_timeout(2000)
            
            screenshot_path = 'current_simulator_state.png'
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")
            
            # Also get some text content to help with analysis
            content = page.content()
            with open('page_content.html', 'w') as f:
                f.write(content)
            print("Page content saved to page_content.html")
            
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
