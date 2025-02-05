OrbitScope is an interactive 3D visualization tool for tracking satellites in real time, providing a dynamic and immersive experience for exploring satellite orbits, categories, and details. Whether you're a space enthusiast, educator, or developer, OrbitScope brings the wonders of space to your fingertips.

## Features

- **Real Time Satellite Tracking**: Visualize satellites orbiting the Earth in real-time.
- **Satellite Details**: Click on satellites to view name, category, altitude, and velocity.
- **Real-Time Satellite Tracking**: Displays current positions and predicted paths for various satellites.
- **Interactive 3D Globe**: Powered by CesiumJS, explore the Earth and satellite paths with smooth zoom, pan, and rotation.
- **Orbit Lines**: Toggle orbit lines for individual satellites to see their paths.
- **Time Slider**: Adjust the time to see satellite positions in the past or future.

## Screenshots

## Tech Stack

- **Frontend**: 
- CesiumJS: For 3D globe and satellite visualization
- JavaScript, HTML, CSS: For user interface and interactivity
- **Backend**: Flask (Python), postgreSQL
- **APIs Used**:
  - [CelesTrak](https://celestrak.com/): TLE data for satellites
  - [Cesium Ion](https://cesium.com/ion/): High-resolution 3D globe rendering
- **Other Libraries**: Satellite.js for orbit propagation

## Installation

### Prerequisites
- [Python](https://www.python.org/) (for Flask backend)

### Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/eakucera99/satellite-tracker.git
   cd satellite-tracker
   ```

2. **Install Backend Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask Server**:
   ```bash
   python app.py
   ```

4. **Serve the Frontend**:
   Open `index.html` in your preferred browser.

## Usage

1. Open the application in your browser.
2. Interact with the Cesium globe to explore satellites.
3. Use the time slider to adjust the simulation time.
4. Filter satellites by clicking on category buttons.
5. Click on a satellite to view its detailed information.

## File Structure

```plaintext
├── app.py                 # Flask backend
├── models.py 
├── static/
│   ├── scripts.js         # Frontend JavaScript
│   ├── styles.css         # Frontend styles
├── templates/
│   └── index.html         # Main HTML file
├── requirements.txt       # Python dependencies
└── README.md              # Project documentation
```

## Future Enhancements

- Better Data Rendering Functions: Improve the performance and accuracy of satellite position calculations to support large datasets, such as Starlink satellites.
- Enhanced Dropdown Menu: Add search and multi-select functionality to the category dropdown for a more intuitive user experience.
- Historical Data: Enable users to go back in time and visualize satellite positions from past dates.
- Fix the categories feature

## Acknowledgments

- [CesiumJS Documentation](https://cesium.com/docs/)
- [CelesTrak](https://celestrak.com/)
- [Satellite.js Documentation](https://github.com/shashwatak/satellite-js)
