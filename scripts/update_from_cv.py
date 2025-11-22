import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET
import os
import datetime
import re

# Configuration
PROJECTS_FILE = 'projects.html'
PUBMED_API_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
SEARCH_TERM = 'Kafle Samipya[au] OR Kafle S[au] AND (Yale OR Oregon OR OHSU OR Otolaryngology)'
# "Kafle S" is common, so adding affiliation keywords helps reduce false positives.
# Alternatively, just use "Kafle Samipya" which is unique enough usually.
# Let's stick to "Kafle Samipya[au]" first as it's safer.
SEARCH_TERM_SAFE = 'Kafle Samipya[au]'

def query_pubmed(term):
    print(f"Querying PubMed for: {term}")
    # 1. ESearch
    params = {
        'db': 'pubmed',
        'term': term,
        'retmode': 'json',
        'retmax': 10
    }
    query_string = urllib.parse.urlencode(params)
    url = f"{PUBMED_API_BASE}esearch.fcgi?{query_string}"

    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            id_list = data['esearchresult']['idlist']
            print(f"Found {len(id_list)} articles.")
            return id_list
    except Exception as e:
        print(f"Error querying PubMed: {e}")
        return []

def fetch_details(id_list):
    if not id_list:
        return []

    print("Fetching article details...")
    ids = ",".join(id_list)
    url = f"{PUBMED_API_BASE}esummary.fcgi?db=pubmed&id={ids}&retmode=json"

    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            articles = []
            result = data.get('result', {})
            for uid in id_list:
                if uid in result:
                    item = result[uid]

                    # Extract fields
                    title = item.get('title', 'No Title')

                    # Authors
                    authors_list = item.get('authors', [])
                    authors_str = ", ".join([a['name'] for a in authors_list])
                    if len(authors_str) > 50:
                         # Shorten authors list
                         authors_str = authors_str[:50] + "..."

                    source = item.get('source', '')
                    pubdate = item.get('pubdate', '')

                    articles.append({
                        'title': title,
                        'authors': authors_str,
                        'journal': f"{source}, {pubdate}",
                        'uid': uid
                    })
            return articles
    except Exception as e:
        print(f"Error fetching details: {e}")
        return []

def format_html(articles):
    html_output = []
    html_output.append('                    <!-- PUBS_AUTO_START -->')
    for art in articles:
        html_output.append('                    <li class="research-item fade-in">')
        html_output.append(f'                        <div class="research-title">{art["title"]}</div>')
        html_output.append(f'                        <div class="research-authors">{art["authors"]}</div>')
        html_output.append(f'                        <div class="research-journal">{art["journal"]}</div>')
        html_output.append(f'                        <p><a href="https://pubmed.ncbi.nlm.nih.gov/{art["uid"]}/" target="_blank" class="btn-outline" style="padding: 2px 8px; font-size: 0.8rem;">View on PubMed</a></p>')
        html_output.append('                    </li>')
    html_output.append('                    <!-- PUBS_AUTO_END -->')
    return "\n".join(html_output)

def update_file(new_content):
    try:
        with open(PROJECTS_FILE, 'r') as f:
            content = f.read()

        # Regex to replace content between markers
        pattern = re.compile(r'<!-- PUBS_AUTO_START -->.*<!-- PUBS_AUTO_END -->', re.DOTALL)

        if pattern.search(content):
            updated_content = pattern.sub(new_content.strip(), content)
            with open(PROJECTS_FILE, 'w') as f:
                f.write(updated_content)
            print("Successfully updated projects.html with PubMed data.")
        else:
            print("Could not find markers <!-- PUBS_AUTO_START --> and <!-- PUBS_AUTO_END --> in projects.html")

    except FileNotFoundError:
        print(f"File {PROJECTS_FILE} not found.")

def main():
    print("=== Automated CV/Publication Updater ===")

    # PubMed Step
    use_pubmed = input("Do you want to query PubMed for new articles? (y/n): ").lower().strip()
    if use_pubmed == 'y':
        ids = query_pubmed(SEARCH_TERM_SAFE)
        if ids:
            articles = fetch_details(ids)
            html = format_html(articles)
            update_file(html)
        else:
            print("No articles found or error occurred.")

    # Manual Step (Placeholder logic for future expansion)
    print("\nTo add manual entries, please edit projects.html directly or add them to the 'Manual CV Input' section in a future version of this tool.")

if __name__ == "__main__":
    main()
