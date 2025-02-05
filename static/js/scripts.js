//public API key
if (typeof Cesium !== "undefined") {
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMzk2ZDUxYy04Zjk1LTRmY2YtYjUzMC1jZDQyMDEwOTk3ZTIiLCJpZCI6MjcxNDcxLCJpYXQiOjE3Mzc4NDg5NzJ9.ibMmpuvCXS_4AzrKKu-eruLbtn-CooYzoUTv7xpNQa0";

    const viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: Cesium.createWorldTerrain(),
        imageryProvider: Cesium.createWorldImagery({
            style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS,
        }),
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        geocoder: false,
        infoBox: false,
    });

    viewer.scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-98.35, 39.50, 20000000),
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
        // spacex: Cesium.Color.BLUE, (too data heavy at the moment)
        "Space Stations": Cesium.Color.YELLOW,
        GPS: Cesium.Color.GREEN,
        Weather: Cesium.Color.CYAN,
        Defense: Cesium.Color.RED,
        Communication: Cesium.Color.ORANGE,
        Navigation: Cesium.Color.PURPLE,
        Scientific: Cesium.Color.MAGENTA,
    };

    let selectedSatellite = null; 

    // Function to calculate satellite positions for the orbit line
    function calculateOrbitLinePositions(tleLine1, tleLine2) {
        const satrec = window.satellite.twoline2satrec(tleLine1, tleLine2);
        const totalSeconds = 60 * 60 * 6; 
        const timestepInSeconds = 10; 
        const start = Cesium.JulianDate.fromDate(new Date());
        const positions = [];

        for (let i = 0; i < totalSeconds; i += timestepInSeconds) {
            const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
            const jsDate = Cesium.JulianDate.toDate(time);

            const positionAndVelocity = window.satellite.propagate(satrec, jsDate);
            if (!positionAndVelocity.position) continue; 

            const gmst = window.satellite.gstime(jsDate);
            const positionGd = window.satellite.eciToGeodetic(positionAndVelocity.position, gmst);

            const longitude = Cesium.Math.toRadians(Cesium.Math.toDegrees(positionGd.longitude));
            const latitude = Cesium.Math.toRadians(Cesium.Math.toDegrees(positionGd.latitude));
            const altitude = positionGd.height * 1000; 

            const position = Cesium.Cartesian3.fromRadians(longitude, latitude, altitude);
            positions.push(position);
        }

        return positions;
    }

    // Function to add an orbit line for a satellite
    function addOrbitLine(satellite) {
        const positions = calculateOrbitLinePositions(satellite.tle_line1, satellite.tle_line2);

        const polyline = viewer.entities.add({
            name: `${satellite.name} Orbit Line`,
            polyline: {
                positions: positions,
                material: Cesium.Color.WHITE,
                width: 0.25,
                show: false, 
            },
        });

        return polyline;
    }

    // Fetch and visualize satellites
    async function fetchSatellites() {
        try {
            const response = await fetch("/api/satellites");
            const satelliteData = await response.json();
            console.log("Satellite Data:", satelliteData);

            viewer.entities.removeAll(); 

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
                for (let i = 0; i <= 500; i++) { 
                    const time = new Date(now.getTime() + i * 60000); 
                    const positionAndVelocity = window.satellite.propagate(satrec, time);
                    if (!positionAndVelocity.position) {
                        console.error("Invalid position for", satellite.name, "at time", time);
                            continue; 
                        }

                    const positionEci = positionAndVelocity.position;
                    const gmst = window.satellite.gstime(time);
                    const positionGd = window.satellite.eciToGeodetic(positionEci, gmst);

                    const longitude = Cesium.Math.toDegrees(positionGd.longitude);
                    const latitude = Cesium.Math.toDegrees(positionGd.latitude);
                    const altitude = positionGd.height * 1000; 

                    positions.push(Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude));
                }

                // Add satellite as an entity
                const entity = viewer.entities.add({
                    position: positions[0], 
                    point: {
                        pixelSize: 6,
                        color: colorMap[category] || Cesium.Color.WHITE,
                    },
                    label: {
                        text: satellite.name,
                        scale: 0.5,
                        show: false, 
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
                });
                const orbitLine = addOrbitLine(satellite);
                entity.orbitLine = orbitLine; 
            });
        } catch (error) {
            console.error("Error fetching satellites:", error);
        }
    }

    // Satellite Details Panel
    const detailsPanel = document.getElementById("satelliteDetailsPanel");
    const satelliteName = document.getElementById("satelliteName");
    const satelliteCategory = document.getElementById("satelliteCategory");
    const satelliteAltitude = document.getElementById("satelliteAltitude");
    const satelliteVelocity = document.getElementById("satelliteVelocity");
    const closePanelButton = document.getElementById("closePanel");

    // Toggle Orbit Lines Button
    const toggleOrbitLinesButton = document.getElementById("toggleOrbitLines");
    let orbitLinesVisible = true; 

    toggleOrbitLinesButton.addEventListener("click", () => {
        orbitLinesVisible = !orbitLinesVisible; 
    
        toggleOrbitLinesButton.textContent = orbitLinesVisible ? "Hide Orbit Lines" : "Show Orbit Lines";
    
        viewer.entities.values.forEach((entity) => {
            if (entity.orbitLine) {
                entity.orbitLine.polyline.show = orbitLinesVisible;
            }
        });
    });
    
    // Click event to show satellite details
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
        const pickedObject = viewer.scene.pick(click.position);
    
        if (pickedObject && pickedObject.id) {
            const satelliteDetails = pickedObject.id.properties;
    
            if (selectedSatellite && selectedSatellite.label) {
                selectedSatellite.label.show = false;
            }
    
            pickedObject.id.label.show = true;
    
            viewer.entities.values.forEach((entity) => {
                if (entity.orbitLine) {
                    entity.orbitLine.polyline.show = false;
                }
            });
    
            if (pickedObject.id.orbitLine) {
                pickedObject.id.orbitLine.polyline.show = true;
            }
    
            selectedSatellite = pickedObject.id;
    
            if (toggleOrbitLinesButton) {
                toggleOrbitLinesButton.textContent = "Hide Orbit Line";
            } else {
                toggleOrbitLinesButton.textContent = "Show Orbit Line";
            }
    
            satelliteName.textContent = satelliteDetails.name.getValue();
            satelliteCategory.textContent = satelliteDetails.category.getValue();
    
            const position = pickedObject.id.position.getValue(Cesium.JulianDate.now());
            const cartographic = Cesium.Cartographic.fromCartesian(position);
            const altitude = cartographic.height / 1000; // Convert to km
            satelliteAltitude.textContent = altitude.toFixed(2);
    
            // Calculate velocity (if available)
            const velocity = pickedObject.id.velocity; // Add velocity as a property if needed
            satelliteVelocity.textContent = velocity ? velocity.getValue().toFixed(2) : "N/A";
    
            detailsPanel.style.display = "block";
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    

    // Close panel 
    closePanelButton.addEventListener("click", () => {
        detailsPanel.style.display = "none";

        if (selectedSatellite && selectedSatellite.orbitLine) {
            selectedSatellite.orbitLine.polyline.show = false;
        }
    });

    // Add slider functionality
    const timeSlider = document.getElementById("timeSlider");
    const timeValue = document.getElementById("timeValue");

    timeSlider.addEventListener("input", (event) => {
        const minutes = parseInt(event.target.value);
        timeValue.textContent = `${minutes} min`; 

        const time = new Date(Date.now() + minutes * 60000); 

        viewer.entities.values.forEach((entity) => {
            if (entity.properties) {
                const tleLine1 = entity.properties.tle_line1.getValue();
                const tleLine2 = entity.properties.tle_line2.getValue();
                const satrec = window.satellite.twoline2satrec(tleLine1, tleLine2);

                const positionAndVelocity = window.satellite.propagate(satrec, time);
                if (positionAndVelocity.position) {
                    const positionEci = positionAndVelocity.position;
                    const gmst = window.satellite.gstime(time);
                    const positionGd = window.satellite.eciToGeodetic(positionEci, gmst);

                    const longitude = Cesium.Math.toDegrees(positionGd.longitude);
                    const latitude = Cesium.Math.toDegrees(positionGd.latitude);
                    const altitude = positionGd.height * 1000; 

                    entity.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
                }
            }
        });
        viewer.scene.requestRender();
    });

    // Set the initial slider value
    timeSlider.value = 0;
    timeValue.textContent = "0 min";

    // Fetch satellites every minute
    setInterval(fetchSatellites, 60000);
    fetchSatellites(); 

    // Filter Satellites by Category
    const dropdown = document.querySelector(".dropdown");
    const dropdownButton = document.querySelector(".dropdown-button");

    dropdownButton.addEventListener("click", () => {
        dropdown.classList.toggle("active");
    });

    document.querySelectorAll(".dropdown-content a").forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault(); 
            const category = item.getAttribute("data-category");

            dropdownButton.textContent = `Filter by Category: ${category}`;

            viewer.entities.values.forEach((entity) => {
                if (entity.properties) {
                    const entityCategory = entity.properties.category.getValue();
                    entity.show = category === "all" || entityCategory === category;
                }
            });
        });
    });
} else {
    console.error("Cesium library is not loaded. Please check your script tag.");
}