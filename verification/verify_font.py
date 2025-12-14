from playwright.sync_api import sync_playwright, expect

def verify_font_display():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000/index.html")

        # Verify the Google Fonts link exists with display=swap
        # Note: Playwright's page.content() or locator might return normalized HTML,
        # so we check the href attribute specifically.

        # Locate the link element with the Google Fonts URL
        # We look for a link that contains fonts.googleapis.com
        font_link = page.locator("link[href*='fonts.googleapis.com']")

        # We need to handle potentially multiple links (preconnect vs stylesheet)
        # We want the one with rel="stylesheet"
        stylesheet_link = page.locator("link[href*='fonts.googleapis.com'][rel='stylesheet']")

        count = stylesheet_link.count()
        print(f"Found {count} Google Fonts stylesheet link(s).")

        if count > 0:
            href = stylesheet_link.first.get_attribute("href")
            print(f"Href: {href}")

            if "&display=swap" in href:
                print("SUCCESS: display=swap found in URL.")
            else:
                print("FAILURE: display=swap NOT found in URL.")
        else:
            print("FAILURE: Google Fonts stylesheet link not found.")

        # Take a screenshot just to have one, though it won't show the font loading behavior easily
        page.screenshot(path="verification/font_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_font_display()
