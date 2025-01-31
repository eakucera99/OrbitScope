if (typeof Cesium !== "undefined") {
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMzk2ZDUxYy04Zjk1LTRmY2YtYjUzMC1jZDQyMDEwOTk3ZTIiLCJpZCI6MjcxNDcxLCJpYXQiOjE3Mzc4NDg5NzJ9.ibMmpuvCXS_4AzrKKu-eruLbtn-CooYzoUTv7xpNQa0";

    // Initialize Cesium Viewer
    const viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: Cesium.createWorldTerrain(),
        imageryProvider: Cesium.createWorldImagery({
            style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS,
        }),
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        geocoder: false,
    });

    // Set the camera to view the entire Earth
    viewer.scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
        orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: 0,
        },
    });

    viewer.resolutionScale = window.devicePixelRatio;
    viewer.scene.globe.enableLighting = true;

    // Color mapping for satellite categories
    const colorMap = {
        spacex: Cesium.Color.BLUE,
        iss: Cesium.Color.YELLOW,
        gps: Cesium.Color.GREEN,
        weather: Cesium.Color.CYAN,
        military: Cesium.Color.RED,
        communication: Cesium.Color.ORANGE,
        navigation: Cesium.Color.PURPLE,
        scientific: Cesium.Color.MAGENTA,
    };

    // Fetch and visualize satellites
    async function fetchSatellites() {
        try {
            const response = await fetch("/api/satellites");
            const satelliteData = await response.json();
            console.log("Satellite Data:", satelliteData);

            viewer.entities.removeAll(); // Clear existing entities

            satelliteData.forEach((satellite) => {
                const tleLine1 = satellite.tle_line1;
                const tleLine2 = satellite.tle_line2;
                const category = satellite.category;

                // Create satellite record from TLE data
                const satrec = window.satellite.twoline2satrec(tleLine1, tleLine2);
                console.log("Satrec for", satellite.name, satrec);

                const now = new Date();

                // Propagate satellite position for the next 500 minutes
                const positions = [];
                for (let i = 0; i <= 500; i++) {  // 500 minutes
                    const time = new Date(now.getTime() + i * 60000); // Increment by 1 minute
                    const positionAndVelocity = window.satellite.propagate(satrec, time);
                    if (!positionAndVelocity.position) {
                        console.error("Invalid position for", satellite.name, "at time", time);
                        continue; // Skip this time step
                    }

                    const positionEci = positionAndVelocity.position;
                    const gmst = window.satellite.gstime(time);
                    const positionGd = window.satellite.eciToGeodetic(positionEci, gmst);

                    const longitude = Cesium.Math.toDegrees(positionGd.longitude);
                    const latitude = Cesium.Math.toDegrees(positionGd.latitude);
                    const altitude = positionGd.height * 1000; // Convert km to meters

                    positions.push(Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude));
                }

                // Add satellite as an entity
                const entity = viewer.entities.add({
                    position: positions[0], // Current position
                    point: {
                        pixelSize: 6,
                        color: colorMap[category] || Cesium.Color.WHITE,
                    },
                    label: {
                        text: satellite.name,
                        scale: 0.5,
                        show: false, // Initially hidden
                        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                    },
                    properties: {
                        name: satellite.name,
                        category: category,
                        tle_line1: tleLine1,
                        tle_line2: tleLine2,
                    },
                    path: {
                        leadTime: 0, // Show the path in real-time
                        trailTime: 500 * 60, // Show the path for the next 500 minutes
                        resolution: 60, // Number of points in the path
                        material: new Cesium.PolylineGlowMaterialProperty({
                            glowPower: 0.2,
                            color: colorMap[category] || Cesium.Color.WHITE,
                        }),
                        width: 2,
                    },
                });

                // Store entity reference for later updates
                entity.satelliteData = {
                    satrec: satrec,
                    positions: positions,
                };
            });
        } catch (error) {
            console.error("Error fetching satellites:", error);
        }
    }

    // Fetch satellites every minute
    setInterval(fetchSatellites, 60000);
    fetchSatellites(); // Initial fetch

    // Satellite Details Panel
    const detailsPanel = document.getElementById("satelliteDetailsPanel");
    const satelliteName = document.getElementById("satelliteName");
    const satelliteCategory = document.getElementById("satelliteCategory");
    const satelliteAltitude = document.getElementById("satelliteAltitude");
    const satelliteVelocity = document.getElementById("satelliteVelocity");
    const closePanelButton = document.getElementById("closePanel");

    // Add click interaction for satellite details
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
        const pickedObject = viewer.scene.pick(click.position);
        if (pickedObject && pickedObject.id) {
            const satelliteDetails = pickedObject.id.properties;
            pickedObject.id.label.show = true; // Show label on click

            // Update details panel
            satelliteName.textContent = satelliteDetails.name;
            satelliteCategory.textContent = satelliteDetails.category;

            // Calculate altitude
            const position = pickedObject.id.position.getValue(Cesium.JulianDate.now());
            const cartographic = Cesium.Cartographic.fromCartesian(position);
            const altitude = cartographic.height / 1000; // Convert to km
            satelliteAltitude.textContent = altitude.toFixed(2);

            // Calculate velocity (if available)
            const velocity = pickedObject.id.velocity; // Add velocity as a property if needed
            satelliteVelocity.textContent = velocity ? velocity.getValue().toFixed(2) : "N/A";

            // Show the details panel
            detailsPanel.style.display = "block";
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Close panel when the close button is clicked
    closePanelButton.addEventListener("click", () => {
        detailsPanel.style.display = "none";
    });

    // Toggle Orbit Lines
    let orbitLinesVisible = true;

    document.getElementById("toggleOrbitLines").addEventListener("click", () => {
        orbitLinesVisible = !orbitLinesVisible;
        viewer.entities.values.forEach((entity) => {
            if (entity.path) {
                entity.path.show = orbitLinesVisible;
            }
        });
    });

    // Add slider functionality
    const timeSlider = document.getElementById("timeSlider");
    const timeValue = document.getElementById("timeValue");

    timeSlider.addEventListener("input", (event) => {
        const minutes = parseInt(event.target.value);
        timeValue.textContent = minutes;

        viewer.entities.values.forEach((entity) => {
            if (entity.satelliteData) {
                const { satrec } = entity.satelliteData;

                // Calculate the new position based on the slider value
                const time = new Date(Date.now() + minutes * 60000); // Add minutes to the current time
                const positionAndVelocity = window.satellite.propagate(satrec, time);
                if (positionAndVelocity.position) {
                    const positionEci = positionAndVelocity.position;
                    const gmst = window.satellite.gstime(time);
                    const positionGd = window.satellite.eciToGeodetic(positionEci, gmst);

                    const longitude = Cesium.Math.toDegrees(positionGd.longitude);
                    const latitude = Cesium.Math.toDegrees(positionGd.latitude);
                    const altitude = positionGd.height * 1000; // Convert km to meters

                    // Update the entity's position
                    entity.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);

                    // Update the path to show only the portion up to the current time
                    entity.path.trailTime = minutes * 60; // Convert minutes to seconds
                }
            }
        });
    });

    // Set the initial slider value
    timeSlider.value = 0;
    timeValue.textContent = 0;
} else {
    console.error("Cesium library is not loaded. Please check your script tag.");
}