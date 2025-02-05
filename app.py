from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import requests
from models import db, Satellite
from dotenv import load_dotenv
import os

load_dotenv()


db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_name = os.getenv('DB_NAME')


app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)

# TLE Data URLs
TLE_CATEGORIES = {
    # "Starlink": "https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle", add in again later when needed
    "Space Stations": "https://celestrak.com/NORAD/elements/stations.txt",
    "GPS": "https://celestrak.com/NORAD/elements/gps-ops.txt",
    "Weather": "https://celestrak.com/NORAD/elements/weather.txt",
    "Defense": "https://celestrak.com/NORAD/elements/military.txt",
    "Communication": "https://celestrak.com/NORAD/elements/geo.txt",
    "Navigation": "https://celestrak.com/NORAD/elements/glo-ops.txt",
    "Scientific": "https://celestrak.com/NORAD/elements/science.txt",
}

def is_valid_tle(tle_line1, tle_line2):
    """Check if the TLE lines are valid."""
    return tle_line1 and tle_line2 and len(tle_line1) > 0 and len(tle_line2) > 0
    
def fetch_and_store_tle():
    """Fetches TLE data from CelesTrak and stores it in PostgreSQL."""
    try:
        for category, url in TLE_CATEGORIES.items():
            response = requests.get(url)
            if response.status_code == 200:
                tle_lines = response.text.strip().split("\n")
                for i in range(0, len(tle_lines), 3):
                    if i + 2 >= len(tle_lines):
                        continue  
                    
                    name = tle_lines[i].strip()
                    line1 = tle_lines[i + 1].strip()
                    line2 = tle_lines[i + 2].strip()
                    
                    if not is_valid_tle(line1, line2):
                        print(f"Skipping invalid TLE data for {name}")
                        continue

                    existing_sat = Satellite.query.filter_by(name=name).first()
                    if existing_sat:
                        existing_sat.category = category
                        existing_sat.tle_line1 = line1
                        existing_sat.tle_line2 = line2
                    else:
                        new_sat = Satellite(name=name, category=category, tle_line1=line1, tle_line2=line2)
                        db.session.add(new_sat)

            db.session.commit()
        return True
    except Exception as e:
        print(f"Error fetching TLE data: {e}")
        return False

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/satellites", methods=["GET"])
def get_satellite_data():
    """Fetches all stored satellites from the database."""
    try:
        satellites = Satellite.query.all()
        satellite_list = [
            {
                "id": sat.id,
                "name": sat.name,
                "category": sat.category,
                "tle_line1": sat.tle_line1,
                "tle_line2": sat.tle_line2
            }
            for sat in satellites
        ]
        return jsonify(satellite_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/update-satellites", methods=["GET"])
def update_satellites():
    """API endpoint to manually trigger a TLE update."""
    success = fetch_and_store_tle()
    if success:
        return jsonify({"message": "Satellite data updated successfully."})
    else:
        return jsonify({"error": "Failed to update satellite data."}), 500

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        fetch_and_store_tle() 
    app.run(debug=True)
