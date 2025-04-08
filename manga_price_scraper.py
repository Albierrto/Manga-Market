# Corrected version - April 8, 2025

from bs4 import BeautifulSoup
import requests # requests.Session will be used instead
import csv
import datetime
import os
import time
import re
import random
import traceback # Import traceback for detailed error printing

# --- Helper Function: Check for Mixed Lots (Improved) ---
# (Keep this function exactly as it was)
def is_mixed_lot(title, target_manga_title):
    """Checks if a title likely represents a lot of mixed manga series."""
    title_lower = title.lower()
    target_manga_lower = target_manga_title.lower()
    lot_keywords = ['lot', 'bundle', 'collection', 'set', 'various', 'assorted', 'manga mix', 'bulk']
    count_match = re.search(r'(\d{2,})\s+(?:manga|book|volume|graphic novel)s?\s+(?:' + '|'.join(lot_keywords) + ')', title_lower)
    if count_match and int(count_match.group(1)) > 15: return True
    other_series = [ 'one piece', 'bleach', 'demon slayer', 'attack on titan', 'my hero academia','dragon ball', 'chainsaw man', 'tokyo ghoul', 'jujutsu kaisen', 'death note','spy x family', 'berserk', 'vinland saga', 'fullmetal alchemist', 'hunter x hunter','mob psycho 100', 'seraph of the end', 'blame!', 'soul eater','sailor moon', 'yu-gi-oh', 'blue exorcist', 'fruits basket', 'ouran high school host club','d-n-angel', 'kamichama karin', 'noragami', 'love attack', 'hands off' ]
    series_mentioned = 0
    mentioned_titles = set()
    normalized_target = re.sub(r'\W+', '', target_manga_lower)
    if target_manga_lower in title_lower: series_mentioned += 1; mentioned_titles.add(target_manga_lower)
    for series in other_series:
        normalized_other = re.sub(r'\W+', '', series)
        if series in title_lower and normalized_other != normalized_target:
            is_new_mention = True
            for existing in mentioned_titles:
                if series in existing or existing in series: is_new_mention = False; break
            if is_new_mention:
                series_mentioned += 1; mentioned_titles.add(series)
            if series_mentioned > 1: return True
    if series_mentioned > 1: return True
    return False

# --- Volume Parsing Function (Improved) ---
# (Keep this function exactly as it was)
def parse_volume_info(title, manga_title):
    """ Parses title for volume count and format. """
    title_lower = title.lower(); manga_title_lower = manga_title.lower() # Normalize manga_title once
    format_type = 'Unknown'; is_ambiguous = False
    exclusion_keywords = [ "figure", "poster", "keychain", "plush", "shirt", "box set art","dvd", "blu-ray", "game", "card", "sticker", "art book", "soundtrack","cel", "guide", "magazine", "calendar", "funko", "statue", "cosplay","doujinshi", "doujin" ]
    if any(keyword in title_lower for keyword in exclusion_keywords): return 0, 'Exclude', False
    omnibus_patterns = r'(omnibus|\d-in-\d|vizbig|big edition|collectors? edition)'
    if re.search(omnibus_patterns, title_lower):
        format_type = 'Omnibus'
        volumes_in_omnibus = set(); num_patterns = re.findall(r'(\d+\s*-\s*\d+)|(\d+)', title); count = 0
        for r_match, s_match in num_patterns:
            if r_match:
                try: s, e = map(int, re.split(r'\s*-\s*', r_match)); [volumes_in_omnibus.add(i) for i in range(s, e + 1) if 0 < s <= e < 200]
                except ValueError: pass
            elif s_match:
                try: v = int(s_match); volumes_in_omnibus.add(v) if 0 < v < 200 else None
                except ValueError: pass
        if len(volumes_in_omnibus) > 1: count = len(volumes_in_omnibus)
        elif '3-in-1' in title_lower or 'three-in-one' in title_lower: count = 3
        elif not volumes_in_omnibus: count = 3
        else: count = max(1, len(volumes_in_omnibus))
        return count, format_type, False
    volumes_found = set()
    volume_patterns = re.findall( r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+\s*-\s*\d+)|' r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+)|' r'(?<!\w)(\d+\s*-\s*\d+)(?!\w)|' r'(?<![\w\d-])(\d{1,3})(?![\w\d-])(?!\s*-\s*\d)(?!\s*(?:in|st|nd|rd|th|:|/)\b)', title, re.IGNORECASE )
    for prefixed_range, prefixed_single, standalone_range, standalone_single in volume_patterns:
        if prefixed_range:
            try: s, e = map(int, re.split(r'\s*-\s*', prefixed_range)); [volumes_found.add(i) for i in range(s, e + 1) if 0 < s <= e < 200]
            except ValueError: continue
        elif prefixed_single:
            try: v = int(prefixed_single); volumes_found.add(v) if 0 < v < 200 else None
            except ValueError: continue
        elif standalone_range:
             try: s, e = map(int, re.split(r'\s*-\s*', standalone_range)); [volumes_found.add(i) for i in range(s, e + 1) if 0 < s <= e < 200]
             except ValueError: continue
        elif standalone_single:
             try:
                 if manga_title_lower.strip() != standalone_single:
                      v = int(standalone_single); volumes_found.add(v) if 0 < v < 200 else None
             except ValueError: continue
    count = len(volumes_found)
    if count > 1: format_type = 'Lot'
    elif count == 1: format_type = 'Single'
    elif count == 0:
        if manga_title_lower in title_lower and ('volume' in title_lower or 'manga' in title_lower or re.search(r'\b\d+\b', title)):
             return 1, 'Single', True
        else: return 0, 'Exclude', False
    return count, format_type, False

# --- Function to get volumes from description (Keep as is) ---
def get_volumes_from_description(listing_url, session_headers):
    """ Fetches description page using provided session headers. """
    print(f"      Attempting to fetch description from: {listing_url}")
    volumes_found_in_desc = set(); desc_text = ""
    try:
        time.sleep(random.uniform(3.5, 6.5))
        response = requests.get(listing_url, headers=session_headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        iframe = soup.select_one('iframe#desc_ifr')
        if iframe and iframe.get('src'):
            iframe_url = iframe['src']
            print(f"        Desc in iframe: {iframe_url}")
            time.sleep(random.uniform(2.0, 4.0))
            iframe_response = requests.get(iframe_url, headers=session_headers, timeout=25)
            iframe_response.raise_for_status()
            iframe_soup = BeautifulSoup(iframe_response.text, 'html.parser')
            desc_container = iframe_soup.select_one('#ds_div') or iframe_soup.body
            if desc_container: desc_text = desc_container.get_text(" ", strip=True)
        else:
            desc_container = soup.select_one('#desc_div') or soup.select_one('#descriptionContent') or soup.select_one('div[itemprop="description"]')
            if desc_container: desc_text = desc_container.get_text(" ", strip=True)
        if not desc_text: print("        WARNING: Could not extract description text."); return 0, 'Unknown'
        volume_patterns = re.findall( r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+\s*-\s*\d+)|' r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+)|' r'#\s*(\d+)|' r'(?<![\w-])(\d{1,3})(?![\w-])(?!\s*-\s*\d)(?!\s*(?:in|st|nd|rd|th)\b)', desc_text, re.IGNORECASE)
        for r_match, v_single, h_single, s_single in volume_patterns:
            if r_match:
                try: s,e=map(int,re.split(r'\s*-\s*',r_match)); [volumes_found_in_desc.add(i) for i in range(s,e+1) if 0<s<=e<200]
                except ValueError: continue
            elif v_single:
                try: v=int(v_single); volumes_found_in_desc.add(v) if 0<v<200 else None
                except ValueError: continue
            elif h_single:
                 try: v=int(h_single); volumes_found_in_desc.add(v) if 0<v<200 else None
                 except ValueError: continue
            elif s_single:
                 try: v=int(s_single); volumes_found_in_desc.add(v) if 0<v<200 else None
                 except ValueError: continue
        count = len(volumes_found_in_desc); print(f"        Found {count} volumes in description.")
        if count > 1: return count, 'Lot'
        elif count == 1: return count, 'Single'
        else: return 0, 'Unknown'
    except requests.exceptions.RequestException as e: print(f"        Error fetching description URL {listing_url}: {e}"); return 0, 'Exclude'
    except Exception as e: print(f"        Error parsing description from {listing_url}: {e}"); return 0, 'Unknown'


# --- Main Scraping Function (CORRECTED INDENTATION & Logging) ---
def scrape_manga_prices(manga_title, max_pages=3, min_price=5, fetch_descriptions=False):
    search_query = f'"{manga_title}" manga english'.replace(" ", "+")
    results = []; omnibus_results = []
    session = requests.Session()
    # Use a real User-Agent string
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36", # Example, use a recent one
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Ch-Ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"', # Example common header
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"'
    })

    print(f"[Scraper] Searching for: {manga_title} manga english (Sold Items)")
    if fetch_descriptions: print("[Scraper] WARNING: Fetching descriptions is enabled.")

    data_folder = "manga_price_data"; os.makedirs(data_folder, exist_ok=True)
    current_date = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    safe_manga_title = re.sub(r'[\\/*?:"<>|]', "", manga_title).replace(' ', '_')
    filename_singles_lots = f"{data_folder}/{safe_manga_title}_SinglesLots_{current_date}.csv"
    filename_omnibus = f"{data_folder}/{safe_manga_title}_Omnibus_{current_date}.csv"
    csv_files = {}; csv_writers = {}; csv_open_files = []
    try:
        sl_file = open(filename_singles_lots, "w", newline='', encoding='utf-8'); csv_open_files.append(sl_file)
        csv_files['singles_lots'] = sl_file; csv_writers['singles_lots'] = csv.writer(csv_files['singles_lots'])
        csv_writers['singles_lots'].writerow(["Title", "Total Price", "Date Sold", "Num Volumes", "Price Per Volume", "Format", "Parse Source", "Link"])
        om_file = open(filename_omnibus, "w", newline='', encoding='utf-8'); csv_open_files.append(om_file)
        csv_files['omnibus'] = om_file; csv_writers['omnibus'] = csv.writer(csv_files['omnibus'])
        csv_writers['omnibus'].writerow(["Title", "Total Price", "Date Sold", "Volumes Contained (est.)", "Format", "Link"])

        total_volumes_scraped = 0; total_price_sum_for_avg = 0
        last_working_url = None

        # --- Scraping Loop ---
        for page_num in range(1, max_pages + 1):
            print(f"\n[Scraper] === Starting page {page_num} processing ===") # LOG START
            page_url = f"https://www.ebay.com/sch/i.html?_from=R40&_nkw={search_query}&_sacat=0&rt=1&LH_Sold=1&LH_Complete=1&_udlo={min_price}&LH_PrefLoc=1&Language=English&_pgn={page_num}"
            print(f"[Scraper] Page URL: {page_url}")

            # Broad try-except around the entire page processing logic
            try: # Outer Try for page loop iteration
                page_headers = session.headers.copy()
                if last_working_url: page_headers["Referer"] = last_working_url; page_headers["Sec-Fetch-Site"] = "same-origin"
                else: page_headers["Sec-Fetch-Site"] = "none"
                page_headers["Sec-Fetch-Dest"] = "document"; page_headers["Sec-Fetch-Mode"] = "navigate"; page_headers["Sec-Fetch-User"] = "?1"

                listings = []; page_content = None # Initialize here for broader scope

                # Inner try-except specifically for network request and initial parsing
                try: # Inner Try for network/parsing
                    base_delay = 3.0; time.sleep(random.uniform(base_delay, base_delay + 3.0))
                    print(f"[Scraper] Attempting to fetch URL for page {page_num}...")
                    page = session.get(page_url, headers=page_headers, timeout=45)
                    print(f"[Scraper] URL fetched. Status Code: {page.status_code}")
                    page.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
                    page_content = page.text # Store content *after* successful fetch
                    last_working_url = page_url # Update last successful URL *after* success

                    print(f"[Scraper] Creating Soup object for page {page_num}...")
                    soup = BeautifulSoup(page_content, "html.parser")
                    print("[Scraper] Soup object created.")

                    print("[Scraper] Looking for results container...")
                    results_container = soup.select_one('ul.srp-results.srp-list.clearfix') or soup.select_one('ul.srp-results') or soup.select_one('#srp-river-results')
                    print(f"[Scraper] Container found: {bool(results_container)}")

                    if not results_container:
                        print(f"[Scraper] !! WARNING: Primary results container not found on page {page_num}.")
                        print("[Scraper] Using fallback selector for listings...")
                        listings = soup.select('li.s-item, div.s-item') # Fallback selector
                        if not listings:
                             print(f"[Scraper] !! ERROR: Could not find any list items globally on page {page_num} using fallback. Stopping.")
                             if page_content:
                                 debug_filename = f"page_{page_num}_debug_no_listings_fallback.html"; print(f"  !! Saving HTML content to {debug_filename}")
                                 with open(debug_filename, "w", encoding="utf-8") as f: f.write(page_content)
                             break # Stop pagination
                        else: print(f"[Scraper] Fallback found {len(listings)} items.")
                    else:
                        # Find items *within* the container
                        print("[Scraper] Looking for listings within container...")
                        listings = results_container.select('li.s-item') # Be more specific if possible
                        print(f"[Scraper] Found {len(listings)} potential listings in container.")
                        if not listings and page_num > 1:
                             print("[Scraper] Container found, but no listings within. End of results likely reached.")
                             break # Stop if container is empty on later pages

                # --- Error Handling for Page Request/Initial Parse (Inner Try) ---
                except requests.exceptions.HTTPError as e:
                    print(f"[Scraper] !! HTTP Error during initial fetch/parse for page {page_num}: {e.response.status_code} {e.response.reason}")
                    print(f"   URL: {page_url}")
                    if e.response.status_code != 404 and page:
                         debug_filename = f"page_{page_num}_debug_HTTP_{e.response.status_code}.html"; print(f"  !! Saving HTML content (if available) to {debug_filename}")
                         try:
                             with open(debug_filename, "w", encoding="utf-8") as f: f.write(e.response.text)
                         except Exception as save_err: print(f"  !! Could not save debug HTML: {save_err}")
                    if e.response.status_code == 404: print("    Page not found (404), stopping."); break
                    elif e.response.status_code == 429: print("    Rate limited (429), stopping."); break
                    else: print("    Stopping pagination due to HTTP error."); break
                except requests.exceptions.RequestException as e:
                    print(f"[Scraper] !! Network Error during initial fetch/parse for page {page_num}: {e}")
                    print("    Stopping pagination due to network error.")
                    break

                # *** CORRECTED INDENTATION START ***
                # This block now runs AFTER the inner try/except completes (if no break occurred)
                # It's still inside the OUTER try block.

                # Check if listings is empty AFTER trying container/fallback
                if not listings: # Indentation level 3 (aligned with inner 'try'/'except')
                    print(f"[Scraper] No listings identified on page {page_num} after search attempts. Stopping pagination.")
                    if page_content and not os.path.exists(f"page_{page_num}_debug_no_listings_fallback.html"):
                         debug_filename = f"page_{page_num}_debug_empty_final.html"; print(f"  !! Saving HTML content to {debug_filename}")
                         with open(debug_filename, "w", encoding="utf-8") as f: f.write(page_content)
                    break # Stop if no listings found

                # --- Process Listings ---
                print(f"[Scraper] Starting processing of {len(listings)} found listings...") # Indentation level 3
                processed_count = 0 # Indentation level 3
                for item_index, item in enumerate(listings): # Indentation level 3
                    # Keep the inner try-except for individual item processing
                    try: # Indentation level 4
                        # (Keep the item parsing logic exactly as it was)
                        title_elem=item.select_one('div.s-item__title span[role="heading"]') or item.select_one('.s-item__title span') or item.select_one('.s-item__title'); title=title_elem.get_text(strip=True).replace('New Listing','').strip() if title_elem else None
                        price_elem=item.select_one('.s-item__price'); price_text=price_elem.get_text(strip=True) if price_elem else None
                        date_parent=item.find("span",class_="POSITIVE") or item.find("div", class_="s-item__title--tag") or item.find("span", class_="s-item__dynamic") or item.find(lambda t: t.name=='span' and 'Sold' in t.get_text() and '$' not in t.get_text()); date_text=date_parent.get_text(strip=True) if date_parent else None
                        if date_text and "Sold" in date_text: match = re.search(r'(Sold\s+[A-Za-z]{3}\s+\d{1,2},\s+\d{4})', date_text); date_text = match.group(1) if match else date_text
                        link_elem=item.select_one('a.s-item__link'); link=link_elem['href'].split("?")[0] if link_elem and link_elem.has_attr('href') else None
                        if not all([title,price_text,date_text,link]) or not price_text.startswith('$'): continue
                        if is_mixed_lot(title, manga_title): continue
                        num_volumes, format_type, is_ambiguous = parse_volume_info(title, manga_title)
                        if format_type == 'Exclude' or num_volumes == 0: continue
                        parse_source = "Title"
                        if fetch_descriptions and is_ambiguous:
                            desc_volumes, desc_format = get_volumes_from_description(link, session.headers)
                            if desc_volumes > 0: num_volumes = desc_volumes; format_type = desc_format if desc_format != 'Unknown' else format_type; parse_source = "Description"
                            elif desc_format == 'Exclude': continue
                        if num_volumes == 1 and format_type == 'Single' and parse_source != "Description" and is_ambiguous: continue
                        clean_price=None; price_match=re.search(r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.?\d*)', price_text.replace("$","").replace(",",""));
                        if price_match:
                            try: clean_price=float(price_match.group(1))
                            except ValueError: continue
                        else: continue
                        if clean_price < min_price: continue
                        item_data={"title":title,"total_price":clean_price,"date":date_text,"num_volumes":num_volumes,"format":format_type,"link":link,"parse_source":parse_source}
                        if format_type=='Omnibus': omnibus_results.append(item_data); csv_writers['omnibus'].writerow([title,f"{clean_price:.2f}",date_text,num_volumes,format_type,link])
                        elif format_type in ['Single','Lot']:
                            results.append(item_data); price_per_volume=clean_price/num_volumes if num_volumes > 0 else 0; price_per_volume_display=f"{price_per_volume:.2f}" if price_per_volume>0 else "N/A"
                            if price_per_volume>0: total_volumes_scraped+=num_volumes; total_price_sum_for_avg+=clean_price
                            csv_writers['singles_lots'].writerow([title,f"{clean_price:.2f}",date_text,num_volumes,price_per_volume_display,format_type,parse_source,link])
                        processed_count += 1
                    except Exception as e_item: # Indentation level 4
                        print(f"[Scraper] !! Error processing item #{item_index+1} on page {page_num}: {e_item}")
                        print(f"   Item Title: {title or 'N/A'}")
                        continue # Continue to next item

                print(f"[Scraper] Finished processing {processed_count} valid listings for page {page_num}")
                # *** CORRECTED INDENTATION END ***


            # --- Broad exception handler for the whole page loop logic (Outer Try) ---
            except Exception as e_page_loop: # Indentation level 2 (Aligned with outer 'try')
                 print(f"[Scraper] !! UNEXPECTED Error during processing logic for page {page_num}: {e_page_loop}")
                 print("--- Traceback ---")
                 traceback.print_exc()
                 print("--- End Traceback ---")
                 if page_content: # Save HTML if we got it before the error
                      debug_filename = f"page_{page_num}_debug_UNEXPECTED_ERROR.html"; print(f"  !! Saving HTML content to {debug_filename}")
                      with open(debug_filename, "w", encoding="utf-8") as f: f.write(page_content)
                 print("    Stopping pagination due to unexpected error.")
                 break # Stop pagination on unexpected errors

        # --- Statistics Calculation & Writing ---
        print("\n[Scraper] --- Scraping Finished ---")
        # (Stats calculation remains the same)
        # ... [rest of stats code kept exactly as before] ...
        print(f"[Scraper] --- Singles/Lots Statistics ({manga_title}) ---")
        print(f"[Scraper] Total valid listings processed (Singles/Lots): {len(results)}")
        print(f"[Scraper] Total volumes accounted for (Singles/Lots): {total_volumes_scraped}")
        overall_average_price_per_volume = 0
        if total_volumes_scraped > 0:
            overall_average_price_per_volume = total_price_sum_for_avg / total_volumes_scraped
            print(f"[Scraper] Overall Average Price Per Volume (Singles/Lots): ${overall_average_price_per_volume:.2f}")
            with open(filename_singles_lots, "a", newline='', encoding='utf-8') as csv_file_append:
                 csv_file_append.write("\n\nOverall Statistics (Singles/Lots):\n"); csv_file_append.write(f"Total Listings Processed: {len(results)}\n"); csv_file_append.write(f"Total Volumes Accounted For: {total_volumes_scraped}\n")
                 all_total_prices = [item['total_price'] for item in results if item.get('format') in ['Single', 'Lot']];
                 if all_total_prices: csv_file_append.write(f"Highest Total Price Listing: ${max(all_total_prices):.2f}\n"); csv_file_append.write(f"Lowest Total Price Listing: ${min(all_total_prices):.2f}\n")
                 csv_file_append.write(f"Overall Average Price Per Volume: ${overall_average_price_per_volume:.2f}\n")
        else: print("[Scraper] No single or lot volumes found for average calculation.")
        print(f"\n[Scraper] --- Omnibus Statistics ({manga_title}) ---")
        print(f"[Scraper] Total Omnibus listings processed: {len(omnibus_results)}")
        avg_omnibus_price = 0
        if omnibus_results:
             omnibus_prices = [item['total_price'] for item in omnibus_results]; avg_omnibus_price = sum(omnibus_prices) / len(omnibus_results); print(f"[Scraper] Average Price per Omnibus listing: ${avg_omnibus_price:.2f}")
             with open(filename_omnibus, "a", newline='', encoding='utf-8') as csv_file_append:
                  csv_file_append.write("\n\nOverall Statistics (Omnibus):\n"); csv_file_append.write(f"Total Listings Processed: {len(omnibus_results)}\n");
                  if omnibus_prices: csv_file_append.write(f"Highest Price Omnibus: ${max(omnibus_prices):.2f}\n"); csv_file_append.write(f"Lowest Price Omnibus: ${min(omnibus_prices):.2f}\n");
                  csv_file_append.write(f"Average Price Omnibus: ${avg_omnibus_price:.2f}\n")


        stats = { "singles_lots_listings": len(results), "total_volumes_sl": total_volumes_scraped, "average_price_per_volume_sl": overall_average_price_per_volume, "omnibus_listings": len(omnibus_results), "average_price_omnibus": avg_omnibus_price }
        return results + omnibus_results, stats
    finally:
        # Ensure all opened CSV files are closed
        for f in csv_open_files:
            if f and not f.closed:
                f.close()
                print(f"[Scraper] Closed file: {f.name}")


# --- Main Function (remains the same) ---
def main():
    print("=== Manga Market Price Scraper (v8 - Corrected Indentation) ===")
    manga_title = input("Enter manga series title (e.g., 'Naruto', 'One Piece'): ")
    min_price_str = input("Enter minimum listing price (default: $5): ")
    try: min_price = float(min_price_str) if min_price_str.strip() else 5.0
    except ValueError: min_price = 5.0; print("Invalid minimum price, using default $5.00")
    max_pages_str = input("Number of pages to scrape (default: 3): ")
    try: max_pages = int(max_pages_str) if max_pages_str.strip() else 3; max_pages = max(1, max_pages)
    except ValueError: max_pages = 3; print("Invalid number of pages, using default 3")
    fetch_desc_input = input("Fetch descriptions for ambiguous titles? (slower, experimental) (y/N): ")
    fetch_descriptions = fetch_desc_input.lower() == 'y'

    print("\n[Scraper] Starting search...")
    try:
         results_data, stats_data = scrape_manga_prices(manga_title, max_pages=max_pages, min_price=min_price, fetch_descriptions=fetch_descriptions)
         if stats_data["singles_lots_listings"] > 0 or stats_data["omnibus_listings"] > 0 : print("\n[Scraper] Scraping run complete.")
         else: print("\n[Scraper] Scraping complete. No relevant listings found matching the criteria.")
    except Exception as main_err:
          print(f"\n--- An UNEXPECTED error occurred in main ---")
          traceback.print_exc()
          print(f"Error: {main_err}")

if __name__ == "__main__":
    main()