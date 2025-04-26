# === Flask API Server for Manga Scraper ===

import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS

# Import the refactored scraper logic and DB query function
from manga_scraper_logic import run_scrape, get_avg_price_from_db, get_db_connection

# Initialize Flask app
app = Flask(__name__)
CORS(app) # Enable CORS for all routes, allowing requests from your frontend

# --- API Endpoint to Trigger Scrape and Get Price ---
@app.route('/check-price', methods=['POST'])
def check_manga_price():
    """
    API endpoint that receives manga details, triggers a scrape,
    and returns the calculated average price from the database.
    """
    print("[API] Received /check-price request")
    # Get data from the incoming JSON request from the frontend
    data = request.json
    if not data:
        return jsonify({"success": False, "message": "Missing JSON payload"}), 400

    manga_title = data.get('seriesName')
    volumes_str = data.get('volumes') # e.g., "1", "1-10"
    condition = data.get('condition', 'good') # Get condition or default to 'good'

    if not manga_title:
        return jsonify({"success": False, "message": "Missing 'seriesName' in request"}), 400
    if not volumes_str:
         return jsonify({"success": False, "message": "Missing 'volumes' in request"}), 400

    # --- Simple Blocking Implementation ---
    # This runs the scrape directly when the API is called.
    # The frontend will wait until it completes. This might timeout for long scrapes.
    # TODO: Consider background tasks (Celery, Flask-Executor) for production.
    print(f"[API] Triggering scrape for: {manga_title}")
    try:
        # Run the scrape (using default pages=3, min_price=5 for now, could make these params too)
        scrape_success = run_scrape(manga_title=manga_title, max_pages=3, min_price=5)

        if not scrape_success:
            print("[API] Scrape task indicated failure or incomplete run.")
            # Decide if we should still try to query DB or return error
            # Let's try querying anyway, maybe some data was inserted before failure
            # return jsonify({"success": False, "message": "Scraping task failed or was interrupted."}), 500

        print(f"[API] Scrape finished. Querying database for average price...")
        # Connect to DB again to get fresh data
        db_conn = get_db_connection()
        if not db_conn:
             return jsonify({"success": False, "message": "Failed to connect to database after scraping."}), 500

        # Query the average price for the scraped title
        # Note: Current DB query doesn't use volume range or condition yet
        avg_price, count = get_avg_price_from_db(db_conn, manga_title_like=manga_title)

        # Close connection after query
        db_conn.close()
        print("[DB] Query connection closed.")

        if avg_price is not None:
            # Calculate estimated price for all volumes
            volume_count = 1  # Default for single volume
            
            # Parse volume range if present (e.g., "1-10")
            if "-" in volumes_str:
                try:
                    start, end = map(int, volumes_str.split("-"))
                    volume_count = end - start + 1
                except ValueError:
                    pass
            
            estimated_price = avg_price * volume_count
            
            response_data = {
                "success": True,
                "series": {"name": manga_title},
                "query": {
                    "volumes": volumes_str,
                    "condition": condition
                },
                "pricing": {
                    "pricePerVolume": avg_price,
                    "estimatedPrice": estimated_price,
                    "numVolumes": volume_count,
                    "premiumApplied": 0,  # Set default values for these fields
                    "matchType": "approximate",
                    "discontinuityDiscount": 0
                },
                "trend": {
                    "trend": 0,  # Add default trend data
                    "confidence": "low",
                    "recentSamples": count,
                    "olderSamples": 0
                }
            }
            return jsonify(response_data), 200
        else:
            return jsonify({
                "success": False,
                "message": f"Could not calculate average price for '{manga_title}'. No valid listings found in database.",
                "series": {"name": manga_title},
                "query": {"volumes": volumes_str}
                }), 404

    except Exception as e:
        print(f"[API] !! UNEXPECTED Error during /check-price handling: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "message": "An internal server error occurred."}), 500

# --- API Endpoint for Compatability with Frontend's GET Request ---
@app.route('/api/prices', methods=['GET'])
def get_manga_prices():
    """
    Compatibility endpoint for frontend's GET request
    Redirects to the POST-based check-price endpoint
    """
    print("[API] Received /api/prices GET request - redirecting to POST endpoint")
    
    # Extract params from query string
    series = request.args.get('series')
    volumes = request.args.get('volumes')
    condition = request.args.get('condition', 'good')
    
    if not series:
        return jsonify({"success": False, "message": "Missing 'series' parameter"}), 400
    
    # Create a data payload for the POST endpoint
    data = {
        "seriesName": series,
        "volumes": volumes,
        "condition": condition
    }
    
    # Call the POST endpoint function directly with the data
    # This avoids having to duplicate logic
    return check_manga_price()

# --- Run the Flask Server ---
if __name__ == '__main__':
    # Get port from environment variable or default to 5000 (to match your setup)
    port = int(os.environ.get('PORT', 5000))
    # Run in debug mode for development (auto-reloads on code changes)
    # Set debug=False for production
    print(f"[API Server] Starting Flask server on port {port}...")
    app.run(debug=True, host='0.0.0.0', port=port)