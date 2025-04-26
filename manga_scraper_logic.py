# === Manga Scraper Logic (v14.5 - Refactored + All Syntax Fixes) ===
# Renamed from manga_price_scraper.py to be used as a module

# --- Standard Libraries ---
import csv
import datetime
import os
import time
import re
import random
import traceback
from pprint import pprint
from urllib.parse import urlparse

# --- Environment Variable Loading ---
from dotenv import load_dotenv

# --- Web Scraping Libraries ---
from bs4 import BeautifulSoup
import requests

# --- Database Library ---
import psycopg2
from psycopg2 import sql # For safe SQL query construction

# --- Load Environment Variables ---
# Load variables from .env file. Ensure .env is in the root where the API server runs.
load_dotenv()

# --- Helper Functions (is_mixed_lot, parse_volume_info, get_volumes_from_description) ---
def is_mixed_lot(title, target_manga_title):
    """Checks if a title likely represents a lot of mixed manga series."""
    title_lower = title.lower()
    target_manga_lower = target_manga_title.lower()
    lot_keywords = ['lot', 'bundle', 'collection', 'set', 'various', 'assorted', 'manga mix', 'bulk']
    count_match = re.search(r'(\d{2,})\s+(?:manga|book|volume|graphic novel)s?\s+(?:' + '|'.join(lot_keywords) + ')', title_lower)
    if count_match and int(count_match.group(1)) > 15:
        return True
    
    other_series = [
        'one piece', 'bleach', 'demon slayer', 'attack on titan', 'my hero academia',
        'dragon ball', 'chainsaw man', 'tokyo ghoul', 'jujutsu kaisen', 'death note',
        'spy x family', 'berserk', 'vinland saga', 'fullmetal alchemist', 'hunter x hunter',
        'mob psycho 100', 'seraph of the end', 'blame!', 'soul eater', 'sailor moon', 
        'yu-gi-oh', 'blue exorcist', 'fruits basket', 'ouran high school host club',
        'd-n-angel', 'kamichama karin', 'noragami', 'love attack', 'hands off'
    ]
    
    series_mentioned = 0
    mentioned_titles = set()
    normalized_target = re.sub(r'\W+', '', target_manga_lower)
    
    if target_manga_lower in title_lower:
        series_mentioned += 1
        mentioned_titles.add(target_manga_lower)
        
    for series in other_series:
        normalized_other = re.sub(r'\W+', '', series)
        if series in title_lower and normalized_other != normalized_target:
            is_new_mention = True
            for existing in mentioned_titles:
                if series in existing or existing in series:
                    is_new_mention = False
                    break
            if is_new_mention:
                series_mentioned += 1
                mentioned_titles.add(series)
            if series_mentioned > 1:
                return True
                
    if series_mentioned > 1:
        return True
        
    return False

# --- Volume Parsing Function (Improved + All Syntax Fixes) ---
def parse_volume_info(title, manga_title):
    """ Parses title for volume count and format. """
    title_lower = title.lower()
    manga_title_lower = manga_title.lower()
    format_type = 'Unknown'
    is_ambiguous = False
    
    exclusion_keywords = [
        "figure", "poster", "keychain", "plush", "shirt", "box set art",
        "dvd", "blu-ray", "game", "card", "sticker", "art book", "soundtrack",
        "cel", "guide", "magazine", "calendar", "funko", "statue", "cosplay",
        "doujinshi", "doujin"
    ]
    
    if any(keyword in title_lower for keyword in exclusion_keywords):
        return 0, 'Exclude', False
        
    omnibus_patterns = r'(omnibus|\d-in-\d|vizbig|big edition|collectors? edition)'
    if re.search(omnibus_patterns, title_lower):
        format_type = 'Omnibus'
        volumes_in_omnibus = set()
        num_patterns = re.findall(r'(\d+\s*-\s*\d+)|(\d+)', title)
        count = 0
        
        for r_match, s_match in num_patterns:
            if r_match:
                try:
                    s, e = map(int, re.split(r'\s*-\s*', r_match))
                    [volumes_in_omnibus.add(i) for i in range(s, e + 1) if 0 < s <= e < 200]
                except ValueError:
                    pass
            elif s_match:
                try:
                    v = int(s_match)
                    if 0 < v < 200:
                        volumes_in_omnibus.add(v)
                except ValueError:
                    pass
                    
        if len(volumes_in_omnibus) > 1:
            count = len(volumes_in_omnibus)
        elif '3-in-1' in title_lower or 'three-in-one' in title_lower:
            count = 3
        elif not volumes_in_omnibus:
            count = 3
        else:
            count = max(1, len(volumes_in_omnibus))
            
        return count, format_type, False

    # --- This loop processes non-omnibus volume patterns ---
    volumes_found = set()
    volume_patterns = re.findall(
        r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+\s*-\s*\d+)|'
        r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+)|'
        r'(?<!\w)(\d+\s*-\s*\d+)(?!\w)|'
        r'(?<![\w\d-])(\d{1,3})(?![\w\d-])(?!\s*-\s*\d)(?!\s*(?:in|st|nd|rd|th|:|/|\.\d)\b)',
        title, re.IGNORECASE
    )

    for prefixed_range, prefixed_single, standalone_range, standalone_single in volume_patterns:
        if prefixed_range:
            try:
                s, e = map(int, re.split(r'\s*-\s*', prefixed_range))
                [volumes_found.add(i) for i in range(s, e + 1) if 0 < s <= e < 200]
            except ValueError:
                continue
        elif prefixed_single:
            try:
                v = int(prefixed_single)
                if 0 < v < 200:
                    volumes_found.add(v)
            except ValueError:
                continue
        elif standalone_range:
            try:
                s, e = map(int, re.split(r'\s*-\s*', standalone_range))
                [volumes_found.add(i) for i in range(s, e + 1) if 0 < s <= e < 200]
            except ValueError:
                continue
        elif standalone_single:
            try:
                if manga_title_lower.strip() != standalone_single:
                    v = int(standalone_single)
                    if 0 < v < 200:
                        volumes_found.add(v)
            except ValueError:
                continue

    count = len(volumes_found)
    if count > 1:
        format_type = 'Lot'
    elif count == 1:
        format_type = 'Single'
    elif count == 0:
        # If no explicit volumes found, check if title implies a single volume ambiguously
        if manga_title_lower in title_lower and ('volume' in title_lower or 'manga' in title_lower or re.search(r'\b\d+\b', title)):
            # Return 1, 'Single', but mark as ambiguous
            return 1, 'Single', True
        else:
            # If truly no indication, exclude
            return 0, 'Exclude', False

    return count, format_type, False

# --- Function to get volumes from description (Fixed) ---
def get_volumes_from_description(listing_url, session_headers):
    """ Fetches description page using provided session headers (requests). """
    print(f"      Attempting to fetch description from: {listing_url}")
    volumes_found_in_desc = set()
    desc_text = ""
    
    try:
        time.sleep(random.uniform(4.5, 7.5))
        response = requests.get(listing_url, headers=session_headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        iframe = soup.select_one('iframe#desc_ifr')
        
        if iframe and iframe.get('src'):
            iframe_url = iframe['src']
            if iframe_url.startswith("//"):
                iframe_url = "https:" + iframe_url
            elif iframe_url.startswith("/"):
                iframe_url = "https://www.ebay.com" + iframe_url
                
            print(f"        Desc in iframe: {iframe_url}")
            time.sleep(random.uniform(2.5, 4.5))
            
            try:
                iframe_response = requests.get(iframe_url, headers=session_headers, timeout=25)
                iframe_response.raise_for_status()
                iframe_soup = BeautifulSoup(iframe_response.text, 'html.parser')
                desc_container = iframe_soup.select_one('#ds_div') or iframe_soup.body
                if desc_container:
                    desc_text = desc_container.get_text(" ", strip=True)
            except requests.exceptions.RequestException as ie:
                print(f"        Error fetching iframe URL {iframe_url}: {ie}")
                desc_container = soup.select_one('#desc_div') or soup.select_one('#descriptionContent') or soup.select_one('div[itemprop="description"]')
                if desc_container:
                    desc_text = desc_container.get_text(" ", strip=True)
            except Exception as ie_parse:
                print(f"        Error parsing iframe from {iframe_url}: {ie_parse}")
                desc_container = soup.select_one('#desc_div') or soup.select_one('#descriptionContent') or soup.select_one('div[itemprop="description"]')
                if desc_container:
                    desc_text = desc_container.get_text(" ", strip=True)
        else:
            desc_container = soup.select_one('#desc_div') or soup.select_one('#descriptionContent') or soup.select_one('div[itemprop="description"]')
            if desc_container:
                desc_text = desc_container.get_text(" ", strip=True)
                
        if not desc_text:
            print("        WARNING: Could not extract description text.")
            return 0, 'Unknown'

        # Find volume patterns in description text
        volume_patterns = re.findall(
            r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+\s*-\s*\d+)|'
            r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+)|'
            r'(?<!\w)(\d+\s*-\s*\d+)(?!\w)|'
            r'(?<![\w\d-])(\d{1,3})(?![\w\d-])(?!\s*-\s*\d)(?!\s*(?:in|st|nd|rd|th|:|/|\.\d)\b)',
            desc_text, re.IGNORECASE
        )

        for p_r, p_s, s_r, s_s in volume_patterns:
            if p_r:
                try:
                    s, e = map(int, re.split(r'\s*-\s*', p_r))
                    [volumes_found_in_desc.add(i) for i in range(s, e + 1) if 0 < s <= e < 200]
                except ValueError:
                    continue
            elif p_s:
                try:
                    v = int(p_s)
                    if 0 < v < 200:
                        volumes_found_in_desc.add(v)
                except ValueError:
                    continue
            elif s_r:
                try:
                    s, e = map(int, re.split(r'\s*-\s*', s_r))
                    [volumes_found_in_desc.add(i) for i in range(s, e + 1) if 0 < s <= e < 200]
                except ValueError:
                    continue
            elif s_s:
                try:
                    v = int(s_s)
                    if 0 < v < 200:
                        volumes_found_in_desc.add(v)
                except ValueError:
                    continue

        count = len(volumes_found_in_desc)
        print(f"        Found {count} volumes in description.")
        
        if count > 1:
            return count, 'Lot'
        elif count == 1:
            return count, 'Single'
        else:
            return 0, 'Unknown'
            
    except requests.exceptions.HTTPError as e:
        print(f"        HTTP Error fetching description URL {listing_url}: {e.response.status_code}")
        return 0, 'Exclude'
    except requests.exceptions.RequestException as e:
        print(f"        Network Error fetching description URL {listing_url}: {e}")
        return 0, 'Unknown'
    except Exception as e:
        print(f"        Error parsing description from {listing_url}: {e}")
        return 0, 'Unknown'

# --- Database Helper Functions ---
def get_db_connection():
    """Establishes connection to PostgreSQL using environment variables from .env file."""
    conn = None
    try:
        db_name = os.environ.get('DB_NAME')
        db_user = os.environ.get('DB_USER')
        db_pass = os.environ.get('DB_PASSWORD')
        db_host = os.environ.get('DB_HOST')
        db_port = os.environ.get('DB_PORT')
        
        missing_vars = [var for var, val in locals().items() if var.startswith('db_') and not val]
        if missing_vars:
            print(f"!! ERROR: Missing database environment variables: {', '.join(missing_vars)}\n   Please ensure DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD are set in your .env file.")
            return None
            
        conn = psycopg2.connect(dbname=db_name, user=db_user, password=db_pass, host=db_host, port=db_port)
        print("[DB] Successfully connected to PostgreSQL using .env variables.")
        return conn
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"[DB] !! Error connecting to PostgreSQL: {error}")
        return None

def create_tables(conn):
    """ Creates the necessary database table if it doesn't exist. """
    commands = ("""CREATE TABLE IF NOT EXISTS manga_listings (id SERIAL PRIMARY KEY, title VARCHAR(500) NOT NULL, total_price NUMERIC(10, 2) NOT NULL, date_sold DATE, num_volumes INTEGER, price_per_volume NUMERIC(10, 2), format VARCHAR(50), parse_source VARCHAR(50), link VARCHAR(1000) UNIQUE NOT NULL, scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",)
    cur = None
    try:
        cur = conn.cursor()
        [cur.execute(command) for command in commands]
        conn.commit()
        print("[DB] Table 'manga_listings' checked/created successfully.")
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"[DB] !! Error creating table: {error}")
    finally:
        if cur:
            cur.close()

def insert_listing(conn, item_data):
    """ Inserts a single listing into the database. """
    sql_insert = """INSERT INTO manga_listings(title, total_price, date_sold, num_volumes, price_per_volume, format, parse_source, link, scraped_at) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (link) DO NOTHING;"""
    cur = None
    try:
        cur = conn.cursor()
        title = item_data.get('title')
        total_price = item_data.get('total_price')
        date_str = item_data.get('date')
        num_volumes = item_data.get('num_volumes')
        format_type = item_data.get('format')
        link = item_data.get('link')
        parse_source = item_data.get('parse_source')
        scraped_at = datetime.datetime.now()
        date_sold = None
        
        if date_str:
            try:
                date_sold = datetime.datetime.strptime(date_str, '%b %d, %Y').date()
            except ValueError:
                print(f"  [DB] Warning: Could not parse date string: {date_str}")
                date_sold = None
                
        price_per_volume = None
        if total_price is not None and num_volumes is not None and num_volumes > 0:
            price_per_volume = total_price / num_volumes
            
        cur.execute(sql_insert, (title, total_price, date_sold, num_volumes, price_per_volume, format_type, parse_source, link, scraped_at))
        conn.commit()
        return True
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"[DB] !! Error inserting listing: {error}\n   Failed Item Data: {item_data}")
        if conn:
            conn.rollback()
        return False
    finally:
        if cur:
            cur.close()

def get_avg_price_from_db(conn, manga_title_like, start_volume=None, end_volume=None):
    """ Queries the DB for average price per volume for a given manga title and optional volume range. """
    if not conn:
        print("[DB Query] No database connection.")
        return None, 0
        
    cur = None
    try:
        cur = conn.cursor()
        query = sql.SQL(""" SELECT AVG(price_per_volume), COUNT(*) FROM manga_listings WHERE title ILIKE %s AND format IN ('Single', 'Lot') AND price_per_volume IS NOT NULL """)
        params = [f'%{manga_title_like}%']
        
        print(f"[DB Query] Executing query for title like: {manga_title_like}")
        cur.execute(query, params)
        result = cur.fetchone()
        
        if result and result[0] is not None:
            avg_price = float(result[0])
            count = int(result[1])
            print(f"[DB Query] Found average price ${avg_price:.2f} based on {count} listings.")
            return avg_price, count
        else:
            print(f"[DB Query] No listings found matching criteria for average price calculation.")
            return None, 0
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"[DB Query] !! Error querying average price: {error}")
        return None, 0
    finally:
        if cur:
            cur.close()


# --- Core Scraping Function (Modified to be callable) ---
def run_scrape(manga_title, max_pages=3, min_price=5, fetch_descriptions=False):
    """Runs the Oxylabs scrape and inserts data into the DB."""
    search_query = f'"{manga_title}" manga english'.replace(" ", "+")
    credentials = (os.environ.get('OXYLABS_USERNAME'), os.environ.get('OXYLABS_PASSWORD'))
    
    if not credentials[0] or not credentials[1]:
        print("!! ERROR: Oxylabs credentials not found in environment !!")
        return False
        
    oxylabs_endpoint = 'https://realtime.oxylabs.io/v1/queries'
    description_session = requests.Session()
    description_session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    })
    
    print(f"[Scraper Task] Starting scrape for: {manga_title} (Max Pages: {max_pages})")
    
    db_conn = get_db_connection()
    if not db_conn:
        print("[Scraper Task] !! Cannot proceed without database connection.")
        return False
        
    create_tables(db_conn)
    db_insert_count = 0
    success = True
    
    try:
        for page_num in range(1, max_pages + 1):
            print(f"\n[Scraper Task] === Processing page {page_num} ===")
            page_url = f"https://www.ebay.com/sch/i.html?_from=R40&_nkw={search_query}&_sacat=0&rt=1&LH_Sold=1&LH_Complete=1&_udlo={min_price}&LH_PrefLoc=1&Language=English&_trksid=p2045573.m1684&_pgn={page_num}"
            print(f"[Scraper Task] Target URL: {page_url}")
            
            page_content = None
            listings = []
            
            try:
                payload = {
                    'source': 'universal_ecommerce',
                    'url': page_url,
                    'geo_location': 'United States',
                    'render': 'html'
                }
                
                print(f"[Oxylabs Task] Sending request for page {page_num}...")
                response = None
                
                try:
                    response = requests.post(oxylabs_endpoint, auth=credentials, json=payload, timeout=60)
                    print(f"[Oxylabs Task] Response Status Code: {response.status_code}")
                    response.raise_for_status()
                    response_data = response.json()
                    
                    if (response_data and 'results' in response_data and 
                        len(response_data['results']) > 0 and 'content' in response_data['results'][0]):
                        page_content = response_data['results'][0]['content']
                        print("[Oxylabs Task] Successfully extracted HTML content.")
                    else:
                        print("[Oxylabs Task] !! ERROR: Could not find HTML 'content'.")
                        pprint(response_data)
                        success = False
                        break
                except requests.exceptions.Timeout:
                    print(f"[Oxylabs Task] !! ERROR: Timeout connecting.")
                    success = False
                    break
                except requests.exceptions.HTTPError as e:
                    print(f"[Oxylabs Task] !! HTTP Error: {e.response.status_code}")
                    try:
                        print("Error details:", e.response.json())
                    except:
                        pass
                    success = False
                    break
                except requests.exceptions.RequestException as e:
                    print(f"[Oxylabs Task] !! Network Error: {e}")
                    success = False
                    break
                except Exception as e_resp:
                    print(f"[Oxylabs Task] !! Error processing response: {e_resp}")
                    if response:
                        print("Response text:", response.text[:200] + "...")
                    success = False
                    break
                    
                if not page_content:
                    print("[Scraper Task] No HTML content. Stopping page.")
                    success = False
                    break
                    
                print("[Scraper Task] Creating Soup object...")
                soup = BeautifulSoup(page_content, "html.parser")
                
                results_container = soup.select_one('ul.srp-results.srp-list.clearfix') or soup.select_one('ul#srp-results') or soup.select_one('#srp-river-results ul')
                
                if results_container:
                    listings = results_container.select('li.s-item')
                    print(f"[Scraper Task] Found {len(listings)} potential listings.")
                else:
                    print(f"[Scraper Task] !! WARNING: Container not found page {page_num}.")
                    listings = []
                    
                if not listings:
                    print(f"[Scraper Task] No listings found page {page_num}. Stopping.")
                    break
                    
                print(f"[Scraper Task] Processing {len(listings)} listings...")
                page_insert_count = 0
                
                for item_index, item in enumerate(listings):
                    try:
                        title_elem = item.select_one('div.s-item__title span[role="heading"]') or item.select_one('.s-item__title span') or item.select_one('.s-item__title')
                        title = title_elem.get_text(strip=True).replace('New Listing','').strip() if title_elem else None
                        
                        price_elem = item.select_one('.s-item__price')
                        price_text = price_elem.get_text(strip=True) if price_elem else None
                        
                        date_parent = (
                            item.find("span", class_="POSITIVE", string=re.compile(r'Sold\s+[A-Za-z]{3}\s+\d{1,2},\s+\d{4}')) or 
                            item.find("div", class_="s-item__title--tag", string=re.compile(r'Sold\s+')) or 
                            item.find("span", class_="s-item__dynamic", string=re.compile(r'Sold\s+')) or 
                            item.find("span", string=re.compile(r'Sold\s+[A-Za-z]{3}\s+\d{1,2},\s+\d{4}'))
                        )
                        date_text = date_parent.get_text(strip=True) if date_parent else None
                        
                        if date_text and "Sold" in date_text:
                            match = re.search(r'([A-Za-z]{3}\s+\d{1,2},\s+\d{4})', date_text)
                            date_text = match.group(1) if match else date_text
                            
                        link_elem = item.select_one('a.s-item__link')
                        link = link_elem['href'].split("?")[0] if link_elem and link_elem.has_attr('href') else None
                        
                        if not all([title, price_text, date_text, link]) or not price_text.startswith('$'):
                            continue
                            
                        if is_mixed_lot(title, manga_title):
                            continue
                            
                        num_volumes, format_type, is_ambiguous = parse_volume_info(title, manga_title)
                        
                        if format_type == 'Exclude' or num_volumes == 0:
                            continue
                            
                        parse_source = "Title"
                        
                        if fetch_descriptions and is_ambiguous:
                            desc_volumes, desc_format = get_volumes_from_description(link, description_session.headers)
                            if desc_volumes > 0:
                                num_volumes = desc_volumes
                                format_type = desc_format if desc_format != 'Unknown' else format_type
                                parse_source = "Description"
                                is_ambiguous = False
                            elif desc_format == 'Exclude':
                                continue
                                
                        if is_ambiguous:
                            continue
                            
                        clean_price = None
                        price_match = re.search(r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.?\d*)', price_text.replace("$","").replace(",",""))
                        
                        if price_match:
                            try:
                                clean_price = float(price_match.group(1))
                            except ValueError:
                                continue
                        else:
                            continue
                            
                        if clean_price < min_price:
                            continue
                            
                        item_data = {
                            "title": title,
                            "total_price": clean_price,
                            "date": date_text,
                            "num_volumes": num_volumes,
                            "format": format_type,
                            "link": link,
                            "parse_source": parse_source
                        }
                        
                        if db_conn:
                            if insert_listing(db_conn, item_data):
                                page_insert_count += 1
                                
                    except Exception as e_item:
                        print(f"[Scraper Task] !! Error processing item #{item_index+1}: {e_item}")
                        print(f"   Item Title: {title or 'N/A'}")
                        continue
                        
                db_insert_count += page_insert_count
                print(f"[Scraper Task] Finished page {page_num}. Processed {page_insert_count} valid listings.")
                
            except Exception as e_page_loop:
                print(f"[Scraper Task] !! UNEXPECTED Error page {page_num}: {e_page_loop}")
                traceback.print_exc()
                success = False
                break
                
            print(f"[Scraper Task] Delaying...")
            time.sleep(random.uniform(3.0, 6.0))
            
        print(f"\n[Scraper Task] --- Scrape Finished for {manga_title} ---")
        print(f"[DB] Total DB inserts/attempts during scrape: {db_insert_count}")
        return success
        
    finally:
        if db_conn is not None:
            db_conn.close()
            print("[DB] PostgreSQL connection closed.")

# --- Main Execution Block (Removed - Logic moved to API server) ---
# if __name__ == "__main__":
#    # This part is removed as the script is now a module for the API server
#    pass