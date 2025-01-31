# Satellite Tracker

A web-based application that visualizes real-time satellite positions and trajectories on a 3D Cesium globe. Users can interact with satellites, view details such as altitude and velocity, and filter them by categories like SpaceX, GPS, Weather, and more.

## Features

- **Real-Time Satellite Tracking**: Displays current positions and predicted paths for various satellites.
- **Interactive Satellite Details**: Click on satellites to view name, category, altitude, and velocity.
- **Category Filters**: Filter satellites by predefined categories such as GPS, weather, military, etc.
- **Time Slider**: Adjust the time to see satellite positions in the past or future.
- **Playback Controls**: Play, pause, and rewind the simulation.

## Tech Stack

- **Frontend**: CesiumJS, JavaScript, HTML, CSS
- **Backend**: Flask (Python)
- **APIs Used**:
  - [CelesTrak](https://celestrak.com/): TLE data for satellites
  - [Cesium Ion](https://cesium.com/ion/): High-resolution 3D globe rendering
- **Other Libraries**: Satellite.js for orbit propagation

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (for running JavaScript dependencies)
- [Python](https://www.python.org/) (for Flask backend)

### Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/satellite-tracker.git
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

## Debugging Tips

- Check if `Cesium` and `Satellite.js` libraries are properly loaded.
- Verify the `/api/satellites` endpoint returns valid satellite data.
- Use browser developer tools (`F12`) to debug JavaScript issues.

## Future Enhancements

- Add user accounts for saving favorite satellites.
- Integrate more satellite categories.
- Display satellite imagery or payload details.

## Acknowledgments

- [CesiumJS Documentation](https://cesium.com/docs/)
- [CelesTrak](https://celestrak.com/)
- [Satellite.js Documentation](https://github.com/shashwatak/satellite-js)
