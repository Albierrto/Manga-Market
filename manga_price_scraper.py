from bs4 import BeautifulSoup
import requests # requests.Session will be used instead
import csv
import datetime
import os
import time
import re
import random

# --- Helper Function: Check for Mixed Lots (Improved) ---
def is_mixed_lot(title, target_manga_title):
    """Checks if a title likely represents a lot of mixed manga series."""
    title_lower = title.lower()
    target_manga_lower = target_manga_title.lower()

    # Keywords often indicating general lots
    lot_keywords = ['lot', 'bundle', 'collection', 'set', 'various', 'assorted', 'manga mix', 'bulk']

    # --- Check 1: Explicit high count in title with lot keywords ---
    # Looks for patterns like "40 manga lot", "lot of 20 books", etc.
    count_match = re.search(r'(\d{2,})\s+(?:manga|book|volume|graphic novel)s?\s+(?:' + '|'.join(lot_keywords) + ')', title_lower)
    # Check if count is high (e.g., > 15, adjust threshold as needed)
    if count_match and int(count_match.group(1)) > 15:
         print(f"    Detected mixed lot (High count '{count_match.group(1)}' with lot keyword): '{title}'")
         return True

    # --- Check 2: Multiple known series mentioned ---
    # Expanded list of other common manga series
    other_series = [
        'one piece', 'bleach', 'demon slayer', 'attack on titan', 'my hero academia',
        'dragon ball', 'chainsaw man', 'tokyo ghoul', 'jujutsu kaisen', 'death note',
        'spy x family', 'berserk', 'vinland saga', 'fullmetal alchemist', 'hunter x hunter',
        'mob psycho 100', 'seraph of the end', 'blame!', 'soul eater',
        'sailor moon', 'yu-gi-oh', 'blue exorcist', 'fruits basket', 'ouran high school host club',
        'd-n-angel', 'kamichama karin', 'noragami', 'love attack', 'hands off' # Added from images
        # Add more, prioritize series often sold in bulk/lots
    ]

    series_mentioned = 0
    mentioned_titles = set()

    # Check if target manga is mentioned
    normalized_target = re.sub(r'\W+', '', target_manga_lower)
    if target_manga_lower in title_lower:
        series_mentioned += 1
        mentioned_titles.add(target_manga_lower)

    # Check for other series
    for series in other_series:
        normalized_other = re.sub(r'\W+', '', series)
        # Ensure we are not just re-matching the target series and it's actually present
        if series in title_lower and normalized_other != normalized_target:
            # Avoid double counting if variations exist (e.g., "db" vs "dragon ball") - basic check
            is_new_mention = True
            for existing in mentioned_titles:
                 if series in existing or existing in series:
                      is_new_mention = False
                      break
            if is_new_mention:
                 series_mentioned += 1
                 mentioned_titles.add(series)
                 print(f"      Found other series mention: '{series}'") # Debug print

            # Early exit if we already found multiple distinct series
            if series_mentioned > 1:
                 print(f"    Detected mixed lot (Multiple series mentions: {mentioned_titles}): '{title}'")
                 return True

    # If multiple distinct series titles were found
    if series_mentioned > 1:
        # This check might be redundant due to early exit, but keep for clarity
        print(f"    Detected mixed lot ({series_mentioned} series mentioned): '{title}'")
        return True

    # --- Check 3: Lot keyword + multiple unidentified numbers? (Less reliable) ---
    # If it has a lot keyword, only mentions the target series, but contains multiple
    # volume numbers/ranges that don't form a single consecutive sequence? Might indicate mixed.
    # Example: "Naruto Manga Lot Vol 3, 5, 10-12" - this is fine (handled by parser)
    # Example: "Naruto and Friends Manga Lot Vol 1, 5, 8" - could be mixed if "Friends" implies others
    # This logic is complex and prone to errors, skipping for now.

    return False

# --- Volume Parsing Function (Added 'doujin' exclusion) ---
def parse_volume_info(title, manga_title):
    """
    Parses title for volume count and format. Includes debugging prints.
    Returns: (volume_count, format_type, is_ambiguous)
    """
    # print(f"    Parsing title: '{title}'") # DEBUG (Can be uncommented if needed)
    title_lower = title.lower()
    format_type = 'Unknown'
    is_ambiguous = False

    # Updated exclusion list
    exclusion_keywords = [
        "figure", "poster", "keychain", "plush", "shirt", "box set art",
        "dvd", "blu-ray", "game", "card", "sticker", "art book", "soundtrack",
        "cel", "guide", "magazine", "calendar", "funko", "statue", "cosplay",
        "doujinshi", "doujin" # Added doujin
    ]
    if any(keyword in title_lower for keyword in exclusion_keywords):
         # print(f"    --> Excluded by keyword.") # DEBUG
         return 0, 'Exclude', False

    # --- Omnibus Check (Same as before) ---
    omnibus_patterns = r'(omnibus|\d-in-\d|vizbig|big edition|collectors? edition)'
    if re.search(omnibus_patterns, title_lower):
        format_type = 'Omnibus'
        # ... (Omnibus counting logic) ...
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
        # print(f"    --> Detected Omnibus, estimated vols: {count}") # DEBUG
        return count, format_type, False

    # --- Standard Volume Parsing (Same Regex as previous successful version) ---
    volumes_found = set()
    volume_patterns = re.findall(
        r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+\s*-\s*\d+)|'  # Grp 1: Prefixed Range
        r'(?:vol(?:ume)?s?\.?\s*|#\s*)(\d+)|'           # Grp 2: Prefixed Single
        r'(?<!\w)(\d+\s*-\s*\d+)(?!\w)|'              # Grp 3: Standalone Range
        r'(?<![\w\d-])(\d{1,3})(?![\w\d-])(?!\s*-\s*\d)(?!\s*(?:in|st|nd|rd|th|:|/)\b)', # Grp 4: Standalone Single
        title, re.IGNORECASE
    )
    # print(f"    Regex matches found: {volume_patterns}") # DEBUG

    for prefixed_range, prefixed_single, standalone_range, standalone_single in volume_patterns:
        # (Processing logic remains the same - add found volumes to volumes_found set)
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
                 if manga_title.strip() != standalone_single: v = int(standalone_single); volumes_found.add(v) if 0 < v < 200 else None
             except ValueError: continue

    count = len(volumes_found)
    # print(f"    Calculated volume count: {count}") # DEBUG
    # print(f"    Volumes found: {sorted(list(volumes_found))}") # DEBUG

    if count > 1:
        format_type = 'Lot'
        # print(f"    --> Determined format: Lot") # DEBUG
    elif count == 1:
        format_type = 'Single'
        # print(f"    --> Determined format: Single") # DEBUG
    elif count == 0:
        # Fallback Logic
        if manga_title.lower() in title_lower and ('volume' in title_lower or 'manga' in title_lower):
             # print(f"    --> Fallback: No volumes parsed but title seems valid. Marking as ambiguous.") # DEBUG
             return 1, 'Single', True # AMBIGUOUS result
        else:
             # print(f"    --> Excluded: No volumes parsed, title not specific enough.") # DEBUG
             return 0, 'Exclude', False

    # If count > 0 from specific patterns, it's NOT ambiguous
    # print(f"    --> Final result: Count={count}, Format={format_type}, Ambiguous=False") # DEBUG
    return count, format_type, False


# --- Main Scraping Function (Using requests.Session and Referer) ---
def scrape_manga_prices(manga_title, max_pages=3, min_price=5, fetch_descriptions=False):
    search_query = f'"{manga_title}" manga english'.replace(" ", "+")
    results = []
    omnibus_results = []
    session = requests.Session() # Use a session object for requests
    session.headers.update({ # Set common headers for the session
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Upgrade-Insecure-Requests": "1",
    })

    print(f"Searching for: {manga_title} manga english (Sold Items)")
    if fetch_descriptions:
        print("WARNING: Fetching descriptions is enabled. This will significantly slow down the process.")

    # --- CSV Setup (Same as before) ---
    data_folder = "manga_price_data"; os.makedirs(data_folder, exist_ok=True)
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    filename_singles_lots = f"{data_folder}/{manga_title.replace(' ', '_')}_SinglesLots_{current_date}.csv"
    filename_omnibus = f"{data_folder}/{manga_title.replace(' ', '_')}_Omnibus_{current_date}.csv"
    csv_files = {}; csv_writers = {}; csv_open_files = [] # Keep track of open files
    try: # Use try/finally to ensure files are closed
        sl_file = open(filename_singles_lots, "w", newline='', encoding='utf-8'); csv_open_files.append(sl_file)
        csv_files['singles_lots'] = sl_file
        csv_writers['singles_lots'] = csv.writer(csv_files['singles_lots'])
        csv_writers['singles_lots'].writerow(["Title", "Total Price", "Date Sold", "Num Volumes", "Price Per Volume", "Format", "Parse Source", "Link"])
        om_file = open(filename_omnibus, "w", newline='', encoding='utf-8'); csv_open_files.append(om_file)
        csv_files['omnibus'] = om_file
        csv_writers['omnibus'] = csv.writer(csv_files['omnibus'])
        csv_writers['omnibus'].writerow(["Title", "Total Price", "Date Sold", "Volumes Contained (est.)", "Format", "Link"])

        total_volumes_scraped = 0
        total_price_sum_for_avg = 0
        current_url = None # To store the URL for the Referer header

        # --- Scraping Loop ---
        for page_num in range(1, max_pages + 1):
            # Construct URL for the current page
            page_url = f"https://www.ebay.com/sch/i.html?_from=R40&_nkw={search_query}&_sacat=0&rt=1&LH_Sold=1&LH_Complete=1&_udlo={min_price}&LH_PrefLoc=1&Language=English&_pgn={page_num}"
            print(f"\nScraping page {page_num}: {page_url}")

            page_headers = session.headers.copy() # Start with session headers
            if current_url: # If not the first page, set Referer and Sec-Fetch-Site
                page_headers["Referer"] = current_url
                page_headers["Sec-Fetch-Site"] = "same-origin"
            else: # First page
                 page_headers["Sec-Fetch-Site"] = "none"

            page_headers["Sec-Fetch-Dest"] = "document"
            page_headers["Sec-Fetch-Mode"] = "navigate"
            page_headers["Sec-Fetch-User"] = "?1"


            try:
                base_delay = 2.5 if not fetch_descriptions else 4.0
                time.sleep(random.uniform(base_delay, base_delay + 2.5)) # Slightly increased max delay

                # Use the session object to make the request
                page = session.get(page_url, headers=page_headers, timeout=30) # Increased timeout
                page.raise_for_status() # Check for HTTP errors
                current_url = page_url # Update current_url for the next potential Referer

                soup = BeautifulSoup(page.text, "html.parser")

                # Find listings container
                results_container = soup.select_one('ul.srp-results') or soup.select_one('#srp-river-results')
                if not results_container:
                    print(f"!! WARNING: No results container found on page {page_num}.")
                    listings = soup.select('li.s-item, div.s-item')
                    if not listings: print(f"!! ERROR: Could not find any list items on page {page_num}. Stopping pagination.") ; break # Stop if no items found at all
                    else: print(f"    Found {len(listings)} items globally (container search failed).")
                else:
                     listings = results_container.select('li.s-item, div.s-item')
                     print(f"Found {len(listings)} potential listings in container on page {page_num}")
                     if not listings and page_num > 1:
                          print("    Container found, but no listings within it. End of results likely reached.")
                          break # Stop if container is empty on later pages

                processed_count = 0
                if not listings:
                     print(f"No listings found on page {page_num}. End of results?")
                     break # Stop if no listings found

                # --- Process Listings (Loop remains largely the same) ---
                for item in listings:
                    title, price_text, date_text, link = None, None, None, None
                    parse_source = "Title"

                    try:
                        # ... (Extracting Title, Price, Date, Link - same as before) ...
                        title_elem=item.select_one('.s-item__title span[role="heading"]') or item.select_one('.s-item__title'); title=title_elem.text.strip().replace('New Listing','').strip() if title_elem else None
                        price_elem=item.select_one('.s-item__price'); price_text=price_elem.text.strip() if price_elem else None
                        date_parent=item.find("span",class_="POSITIVE") or item.find(lambda t: t.name=='span' and 'Sold' in t.text and '$' not in t.text); date_text=date_parent.text.strip() if date_parent else "Date not found"
                        link_elem=item.select_one('.s-item__link'); link=link_elem['href'].split("?")[0] if link_elem else None
                        if not all([title,price_text,link]) or not price_text.startswith('$'): continue

                        # --- Mixed Lot Check ---
                        if is_mixed_lot(title, manga_title):
                            print(f"    Skipping item: Detected as mixed lot. Title: '{title}'")
                            continue

                        # --- Initial Title Parsing ---
                        num_volumes, format_type, is_ambiguous = parse_volume_info(title, manga_title)

                        if format_type == 'Exclude' or num_volumes == 0: continue

                        # --- Description Fetching (Optional) ---
                        if fetch_descriptions and is_ambiguous:
                            # Pass the SESSION object's headers, not the page-specific ones
                            # Or better, use the session obj directly if get_volumes.. uses requests
                            desc_volumes, desc_format = get_volumes_from_description(link, session.headers) # Pass session headers
                            if desc_volumes > 0:
                                num_volumes = desc_volumes; format_type = desc_format if desc_format != 'Unknown' else format_type; parse_source = "Description"
                            elif desc_format == 'Exclude': continue # Skip if fetch failed badly

                        # Skip remaining ambiguous singles if description check off/failed
                        if num_volumes == 1 and format_type == 'Single' and parse_source != "Description" and is_ambiguous:
                             print(f"    Skipping item: Ambiguous single volume (description check off/failed). Title: '{title}'")
                             continue

                        # --- Clean Price ---
                        clean_price=None; price_match=re.search(r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.?\d*)', price_text.replace("$","").replace(",",""));
                        if price_match:
                            try: clean_price=float(price_match.group(1))
                            except ValueError: continue
                        else: continue
                        if clean_price < min_price: continue

                        # --- Store and Write Data ---
                        # ... (Storing in results/omnibus_results and writing to CSV - same as before) ...
                        item_data={"title":title,"total_price":clean_price,"date":date_text,"num_volumes":num_volumes,"format":format_type,"link":link,"parse_source":parse_source}
                        if format_type=='Omnibus': omnibus_results.append(item_data); csv_writers['omnibus'].writerow([title,f"{clean_price:.2f}",date_text,num_volumes,format_type,link])
                        elif format_type in ['Single','Lot']:
                            results.append(item_data); price_per_volume=clean_price/num_volumes if num_volumes > 0 else 0; price_per_volume_display=f"{price_per_volume:.2f}" if price_per_volume>0 else "N/A"
                            if price_per_volume>0: total_volumes_scraped+=num_volumes; total_price_sum_for_avg+=clean_price
                            csv_writers['singles_lots'].writerow([title,f"{clean_price:.2f}",date_text,num_volumes,price_per_volume_display,format_type,parse_source,link])
                        # else: skip Unknown format

                        processed_count += 1
                    except Exception as e: print(f"!! Error processing item loop: {e} (Title: {title or 'N/A'})"); continue # Continue with next item

                print(f"Finished processing {processed_count} valid listings for page {page_num}")

            # --- Error Handling for Page Request ---
            except requests.exceptions.HTTPError as e:
                 print(f"!! HTTP Error on page {page_num}: {e.response.status_code} {e.response.reason}")
                 print(f"   URL: {page_url}")
                 if e.response.status_code == 404: print("   Page not found (404), likely end of results.")
                 elif e.response.status_code == 429: print("   Rate limited (429). Increase delay or use proxies.")
                 else: print("   Check URL and network connection.")
                 break # Stop pagination on HTTP errors
            except requests.exceptions.RequestException as e:
                 print(f"!! Network Error on page {page_num}: {e}")
                 break # Stop pagination on network errors
            except Exception as e:
                print(f"!! General Error during page {page_num} processing: {e}")
                import traceback; traceback.print_exc() # Print stack trace for unexpected errors
                break # Stop pagination on unexpected errors

        # --- Statistics Calculation & Writing (remains the same) ---
        print("\n--- Scraping Finished ---")
        # ... (Statistics calculation and printing/writing logic) ...
        print(f"--- Singles/Lots Statistics ({manga_title}) ---")
        print(f"Total valid listings processed (Singles/Lots): {len(results)}")
        print(f"Total volumes accounted for (Singles/Lots): {total_volumes_scraped}")
        overall_average_price_per_volume = 0
        if total_volumes_scraped > 0:
            overall_average_price_per_volume = total_price_sum_for_avg / total_volumes_scraped
            print(f"Overall Average Price Per Volume (Singles/Lots): ${overall_average_price_per_volume:.2f}")
            # Append stats to file
            with open(filename_singles_lots, "a", newline='', encoding='utf-8') as csv_file_append:
                 csv_file_append.write("\n\nOverall Statistics (Singles/Lots):\n"); csv_file_append.write(f"Total Listings Processed: {len(results)}\n"); csv_file_append.write(f"Total Volumes Accounted For: {total_volumes_scraped}\n")
                 all_total_prices = [item['total_price'] for item in results if item.get('format') in ['Single', 'Lot']];
                 if all_total_prices: csv_file_append.write(f"Highest Total Price Listing: ${max(all_total_prices):.2f}\n"); csv_file_append.write(f"Lowest Total Price Listing: ${min(all_total_prices):.2f}\n")
                 csv_file_append.write(f"Overall Average Price Per Volume: ${overall_average_price_per_volume:.2f}\n")
        else: print("No single or lot volumes found for average calculation.")

        print(f"\n--- Omnibus Statistics ({manga_title}) ---")
        print(f"Total Omnibus listings processed: {len(omnibus_results)}")
        avg_omnibus_price = 0
        if omnibus_results:
             omnibus_prices = [item['total_price'] for item in omnibus_results]; avg_omnibus_price = sum(omnibus_prices) / len(omnibus_results); print(f"Average Price per Omnibus listing: ${avg_omnibus_price:.2f}")
             # Append stats to file
             with open(filename_omnibus, "a", newline='', encoding='utf-8') as csv_file_append:
                 csv_file_append.write("\n\nOverall Statistics (Omnibus):\n"); csv_file_append.write(f"Total Listings Processed: {len(omnibus_results)}\n"); csv_file_append.write(f"Highest Price Omnibus: ${max(omnibus_prices):.2f}\n"); csv_file_append.write(f"Lowest Price Omnibus: ${min(omnibus_prices):.2f}\n"); csv_file_append.write(f"Average Price Omnibus: ${avg_omnibus_price:.2f}\n")

        stats = {
             "singles_lots_listings": len(results), "total_volumes_sl": total_volumes_scraped, "average_price_per_volume_sl": overall_average_price_per_volume,
             "omnibus_listings": len(omnibus_results), "average_price_omnibus": avg_omnibus_price
        }
        return results + omnibus_results, stats
    finally:
        # Ensure all opened CSV files are closed
        for f in csv_open_files:
            if f and not f.closed:
                f.close()
                print(f"Closed file: {f.name}") # Confirm closure


# --- Function to get volumes from description (minor change) ---
def get_volumes_from_description(listing_url, headers_dict): # Accept headers dict
    """ Fetches description page using provided headers dict. """
    print(f"      Attempting to fetch description from: {listing_url}")
    volumes_found_in_desc = set()
    try:
        # Use simple requests.get here, passing the headers from the session
        # It won't share cookies with the main session unless we pass the session obj itself,
        # but often just matching headers is enough for item pages.
        time.sleep(random.uniform(3.5, 6.5)) # Increased delay
        response = requests.get(listing_url, headers=headers_dict, timeout=30) # Pass headers
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        # ... (rest of description parsing logic remains the same) ...
        iframe=soup.select_one('iframe#desc_ifr'); desc_text="";
        if iframe and iframe.get('src'):
            iframe_url=iframe['src']; print(f"      Desc in iframe: {iframe_url}"); time.sleep(random.uniform(2.0,4.0));
            iframe_response=requests.get(iframe_url,headers=headers_dict,timeout=25); iframe_response.raise_for_status();
            iframe_soup=BeautifulSoup(iframe_response.text,'html.parser'); desc_container=iframe_soup.select_one('#ds_div') or iframe_soup.body;
            if desc_container: desc_text=desc_container.get_text(" ",strip=True)
        else:
            desc_container=soup.select_one('#desc_div') or soup.select_one('#descriptionContent') or soup.select_one('div[itemprop="description"]');
            if desc_container: desc_text=desc_container.get_text(" ",strip=True)
        if not desc_text: print("      WARNING: Could not extract description text."); return 0, 'Unknown'
        # print(f"      Desc text (first 200): {desc_text[:200]}...") # Optional debug
        volume_patterns=re.findall(r'vol(?:ume)?s?\s*(?:\s*#?\s*)?(\d+\s*-\s*\d+)|vol(?:ume)?s?\s*(?:\s*#?\s*)?(\d+)|#\s*(\d+)|(?<![\w-])(\d{1,3})(?![\w-])(?!\s*-\s*\d)(?!\s*(?:in|st|nd|rd|th)\b)',desc_text,re.IGNORECASE);
        for r_match,v_single,h_single,s_single in volume_patterns:
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
        count=len(volumes_found_in_desc); print(f"      Found {count} volumes in description.");
        if count>1: return count,'Lot'
        elif count==1: return count,'Single'
        else: return 0,'Unknown'
    except requests.exceptions.RequestException as e: print(f"      Error fetching description: {e}"); return 0,'Exclude'
    except Exception as e: print(f"      Error parsing description: {e}"); return 0,'Unknown'


# --- Main Function (remains the same) ---
def main():
    print("=== Manga Market Price Scraper (v5 - Pagination Fix, Improved Filters) ===")
    manga_title = input("Enter manga series title (e.g., 'Naruto', 'One Piece'): ")
    min_price = input("Enter minimum listing price (default: $5): ")
    min_price = float(min_price) if min_price.strip() and min_price.replace('.', '', 1).isdigit() else 5
    max_pages = input("Number of pages to scrape (default: 3): ")
    max_pages = int(max_pages) if max_pages.strip() and max_pages.isdigit() else 3
    fetch_desc_input = input("Fetch descriptions for ambiguous titles? (slower, experimental) (y/N): ")
    fetch_descriptions = fetch_desc_input.lower() == 'y'

    print("\nStarting search...")
    results, stats = scrape_manga_prices(manga_title, max_pages=max_pages, min_price=min_price, fetch_descriptions=fetch_descriptions)

    if stats["singles_lots_listings"] > 0 or stats["omnibus_listings"] > 0 :
        print("\nScraping complete.")
        print(f"Data saved to '{manga_title.replace(' ', '_')}_SinglesLots_*.csv' and '{manga_title.replace(' ', '_')}_Omnibus_*.csv'.")
    else:
        print("\nScraping complete. No relevant listings found matching the criteria.")

if __name__ == "__main__":
    main()