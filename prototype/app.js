/* 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 */

let VIEWER = {}

VIEWER.geoJsonByLayers = {}

VIEWER.geoJsonLayers = {}

VIEWER.locationsClusterLayer = null

VIEWER.main_layers = null

VIEWER.layerControl = null

VIEWER.selectedLayers = []

VIEWER.stateFeatures = null

VIEWER.countyFeatures = null

VIEWER.taxFeatures1798

VIEWER.taxFeatures1819 = null

VIEWER.baseLayers = {}

VIEWER.baseLayers.mapbox_satellite_layer = null

VIEWER.baseLayers.osm = null

VIEWER.baseLayers.esri_street = null

VIEWER.baseLayers.esri_natgeo = null

VIEWER.baseLayers.topomap = null

VIEWER.baseLayers.carto = null

VIEWER.baseLayers.USGS_top_streets = null

VIEWER.baseMaps = null

//Keep tracked of fetched resources.  Do not fetch resources you have already resolved.
VIEWER.resourceMap = new Map()

//Keep track of how many resources you have fetched
VIEWER.resourceFetchCount = 0

//Keep track of how many resources you are processing
VIEWER.resourceCount = 0

//Once you have fetched this many resources, fetch no more.  Helps stop infinite loops from circular references.
VIEWER.resourceFetchLimit = 1000

//Once you have processed this many resources, process no more.  Helps stop infinite loops from circular references.
VIEWER.resourceFindLimit = 1000

//The resource supplied via the data-param paramater.  All referenced values that could be resolved are resolved and embedded.
VIEWER.resource = {}

//For Leaflet
VIEWER.mymap = null

//Keep track of the date chosen by the user.
VIEWER.userInputDate = "0-12-31"

//Starting Zoom level based on interface
VIEWER.startZoom = document.location.href.includes("inset.html") ? 2 : 2

//Starting coords based on interface
VIEWER.startCoords = document.location.href.includes("inset.html") ? [21, 30] : [12, 12]

document.addEventListener("KastorLeafletInitialized", event => {
    // All geography is loaded and the interface is ready to show.  Paginate by hiding the 'loading' UI
    loadingMessage.classList.add("is-hidden")
    loadingMessage.innerHTML = `Arranging Map Data...<br>`
    resetView.classList.remove("is-hidden")
    const infoContainer = document.getElementById("infoContainer")
    if(infoContainer) infoContainer.classList.remove("is-hidden")
    document.querySelector(".slider-container").classList.remove("is-hidden")
    leafletInstanceContainer.style.backgroundImage = "none"
    leafletInstanceContainer.querySelector(".leaflet-map-pane").classList.remove("is-hidden")
    leafletInstanceContainer.querySelector(".leaflet-control-container").classList.remove("is-hidden")
    leafletInstanceContainer.classList.add("has-loaded")
})

VIEWER.isJSON = function(obj) {
    let r = false
    let json = {}
    try {
        json = JSON.parse(JSON.stringify(obj))
        r = true
    } catch (e) {
        r = false
    }
    return r
}

/**
 * Initialize the application.
 * @param {type} view
 * @return {undefined}
 */
VIEWER.init = async function() {
    let locationData = await fetch("./data/AllLocations_new.json").then(resp => resp.json()).catch(err => { return {} })
    let tax_1798 = await fetch("./data/1798_Tax_Divisions_Merged.json").then(resp => resp.json()).catch(err => { return {} })
    let tax_1814 = await fetch("./data/1814_Districts_Merged.json").then(resp => resp.json()).catch(err => { return {} })
    let pa_1818_district = await fetch("./data/judicial_districts/PA_1818_Districts.geojson").then(resp => resp.json()).catch(err => { return {} })
    let pa_1823_district = await fetch("./data/judicial_districts/PA_1823_Districts.geojson").then(resp => resp.json()).catch(err => { return {} })
    let first_circuit_1789 = await fetch("./data/judicial_circuits/First_Circuit_1789.geojson").then(resp => resp.json()).catch(err => { return {} })
    let second_circuit_1789 = await fetch("./data/judicial_circuits/Second_Circuit_1789.geojson").then(resp => resp.json()).catch(err => { return {} })
    let third_circuit_1789 = await fetch("./data/judicial_circuits/Third_Circuit_1789.geojson").then(resp => resp.json()).catch(err => { return {} })
    let stateBoundaries = await fetch("./data/StateBoundaries.json").then(resp => resp.json()).catch(err => { return {} })
    let countyBoundaries = await fetch("./data/CountyBoundariesWithEmployeeCounts.json").then(resp => resp.json()).catch(err => { return {} })
    let geoJsonData = []
    let peopleFields = []
    let peopleData = []
    let geoJsonByLayers = {}

    pa_1818_district.features = pa_1818_district.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        //f.properties._name = pa_1818_district._name
        f.properties._name = "judicial_disctrict"
        return f
    })
    pa_1823_district.features = pa_1823_district.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        //f.properties._name = pa_1823_district._name
        f.properties._name = "judicial_disctrict"
        return f
    })

    first_circuit_1789.features = first_circuit_1789.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        //f.properties._name = first_circuit_1789._name
        f.properties._name = "judicial_circuit"
        return f
    })
    second_circuit_1789.features = second_circuit_1789.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        //f.properties._name = second_circuit_1789._name
        f.properties._name = "judicial_circuit"
        return f
    })
    third_circuit_1789.features = third_circuit_1789.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        //f.properties._name = third_circuit_1789._name
        f.properties._name = "judicial_circuit"
        return f
    })

    tax_1798.features = tax_1798.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = tax_1798._name
        return f
    })
    tax_1814.features = tax_1814.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = tax_1814._name
        return f
    })
    countyBoundaries.features = countyBoundaries.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = countyBoundaries._name
        return f
    })
    stateBoundaries.features = stateBoundaries.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = stateBoundaries._name
        return f
    })
    locationData.features = locationData.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = locationData._name
        // Oh no are these really inverted!?!?!  I may need a new copy of this location data
        let tempX = f.geometry.coordinates[0]
        let tempY = f.geometry.coordinates[1]
        f.geometry.coordinates[0] = tempY
        f.geometry.coordinates[1] = tempX
        return f
    })

    // VIEWER.geoJsonByLayers.pa_1818_district = pa_1818_district
    // VIEWER.geoJsonByLayers.pa_1823_district = pa_1823_district
    // VIEWER.geoJsonByLayers.first_circuit_1789 = first_circuit_1789
    // VIEWER.geoJsonByLayers.second_circuit_1789 = second_circuit_1789
    // VIEWER.geoJsonByLayers.third_circuit_1789 = third_circuit_1789

    VIEWER.geoJsonByLayers.judicial_districts = 
        {
            "__name":"judicial_districts", 
            "@type": "FeatureCollection",
            "features": [...pa_1818_district.features, ...pa_1823_district.features]
        }
    VIEWER.geoJsonByLayers.judicial_circuits = 
        {
            "__name":"judicial_circuits", 
            "@type": "FeatureCollection",
            "features": [...first_circuit_1789.features, ...second_circuit_1789.features, ...third_circuit_1789.features ]
        }

    VIEWER.geoJsonByLayers.locations = locationData
    VIEWER.geoJsonByLayers.counties = countyBoundaries
    VIEWER.geoJsonByLayers.states = stateBoundaries
    VIEWER.geoJsonByLayers.tax_1798 = tax_1798
    VIEWER.geoJsonByLayers.tax_1814 = tax_1814

    // const locations_without_coordinates = locationData.features.filter(f => f.geometry.coordinates[0] === null || f.geometry.coordinates[1] === null)
    // console.warn("The following locations do not have coordinates.  They will not appear on the map.")
    // console.log(locations_without_coordinates)

    VIEWER.initializeLeaflet(VIEWER.startCoords, "0-12-31")
}

/**
 * Inititalize a Leaflet Web Map with a standard base map. Give it GeoJSON to draw.
 * In this case, the GeoJSON are all Features takeb from Feature Collections.
 */
VIEWER.initializeLeaflet = async function(coords, userInputDate = null) {
    let selectedControls = null
    if (VIEWER.mymap === null) {

        VIEWER.baseLayers.mapbox_satellite_layer =
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGhlaGFiZXMiLCJhIjoiY2pyaTdmNGUzMzQwdDQzcGRwd21ieHF3NCJ9.SSflgKbI8tLQOo2DuzEgRQ', {
                maxZoom: 19,
                id: 'mapbox.satellite', //mapbox.streets
                accessToken: 'pk.eyJ1IjoidGhlaGFiZXMiLCJhIjoiY2pyaTdmNGUzMzQwdDQzcGRwd21ieHF3NCJ9.SSflgKbI8tLQOo2DuzEgRQ'
            })

        VIEWER.baseLayers.osm =
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            })

        VIEWER.baseLayers.topomap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 10
        })

        VIEWER.baseLayers.USGS_top_streets = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 8
        })

        VIEWER.baseLayers.Esri_WorldPhysical = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 8
        })

        VIEWER.baseLayers.Esri_Ocean = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 10
        })

        VIEWER.baseMaps = {
            "Mapbox Satellite": VIEWER.baseLayers.mapbox_satellite_layer,
            "OpenStreetMap": VIEWER.baseLayers.osm,
            "Open Topomap": VIEWER.baseLayers.topomap,
            "USGS Topo + Street": VIEWER.baseLayers.USGS_top_streets,
            "ESRI World Physical": VIEWER.baseLayers.Esri_WorldPhysical,
            "ESRI Ocean": VIEWER.baseLayers.Esri_Ocean
        }
    }
    else{
        // Prepare for 'loading' modal and pagination
        leafletInstanceContainer.querySelector(".leaflet-map-pane").classList.add("is-hidden")
        leafletInstanceContainer.querySelector(".leaflet-control-container").classList.add("is-hidden")
        const infoContainer = document.getElementById("infoContainer")
        if(infoContainer) infoContainer.classList.add("is-hidden")
        document.querySelector(".slider-container").classList.add("is-hidden")
        resetView.classList.add("is-hidden")
        leafletInstanceContainer.style.backgroundImage = "url(./images/earth.gif)"
        loadingMessage.classList.remove("is-hidden")
    }

    setTimeout(function(){
        let geoMarkers = {}
        if (parseInt(userInputDate) > 0) {
            VIEWER.userInputDate = userInputDate
            // The user has provided a date and we are redrawing the layers using the loaded base day filtered by the date.
            for (const entry in VIEWER.geoJsonByLayers) {
                switch (entry) {
                    case "locations":
                        geoMarkers[entry] = JSON.parse(JSON.stringify(VIEWER.geoJsonByLayers[entry]))
                        geoMarkers[entry].features = geoMarkers[entry].features.filter(f => {
                            // If it does not have a date, should we keep it on the map?  Yes for now.
                            if (!f.properties.hasOwnProperty("Earliest Date") && f.properties.hasOwnProperty("Latest Date")) return true
                            const sDate = new Date(f.properties["Earliest Date"])
                            const eDate = new Date(f.properties["Latest Date"])
                            const currDate = new Date(userInputDate)
                            return sDate <= currDate && eDate >= currDate
                        })
                        break
                    case "states":
                    case "counties":
                        geoMarkers[entry] = JSON.parse(JSON.stringify(VIEWER.geoJsonByLayers[entry]))
                        geoMarkers[entry].features = geoMarkers[entry].features.filter(f => {
                            if (!f.properties.hasOwnProperty("START_DATE") && f.properties.hasOwnProperty("END_DATE")) return true
                            const sDate = new Date(f.properties["START_DATE"])
                            const eDate = new Date(f.properties["END_DATE"])
                            const currDate = new Date(userInputDate)
                            return sDate < currDate && eDate >= currDate
                        })
                        break
                    case "judicial_districts":
                    case "judicial_circuits":
                        geoMarkers[entry] = JSON.parse(JSON.stringify(VIEWER.geoJsonByLayers[entry]))
                        geoMarkers[entry].features = geoMarkers[entry].features.filter(f => {
                            if (!f.properties.hasOwnProperty("Start_Year") && f.properties.hasOwnProperty("End_Year")) return true
                            // These are all just years but that should be OK
                            const sDate = new Date(f.properties["Start_Year"]+"")
                            const eDate = new Date(f.properties["End_Year"]+"")
                            const currDate = new Date(userInputDate)
                            return sDate < currDate && eDate >= currDate
                        })
                        break
                    default:
                        geoMarkers[entry] = VIEWER.geoJsonByLayers[entry]
                }
            }
        } 
        else {
            geoMarkers = VIEWER.geoJsonByLayers
            if(document.getElementById("timeSlider")){
                document.getElementById("timeSlider").value = "1832"
            }
            if(document.getElementById("slider-value")){
                document.getElementById("slider-value").innerHTML = document.location.href.includes("inset.html") ? "N/A" : "Year: N/A"
            }
        }

        VIEWER.geoJsonLayers.stateFeatures = L.geoJSON(geoMarkers.states, {
            style: function(feature) {
                const name = feature.properties._name ?? ""
                return {
                    color: "#005A9C",
                    fillColor: "#005A9C",
                    fillOpacity: 0.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopup2
        })

        VIEWER.geoJsonLayers.countyFeatures = L.geoJSON(geoMarkers.counties, {
            style: function(feature) {
                const name = feature.properties._name ?? ""
                return {
                    color: "#008080",
                    fillColor: "#008080",
                    fillOpacity: 0.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopup2
        })

        VIEWER.geoJsonLayers.postmastersFeatures = L.geoJSON(geoMarkers.counties, {
            style: function(feature) {
                const count = VIEWER.determineEmployeeCount(feature)
                function getColor(d) {
                    d = parseInt(d)
                    const color = 
                       d > 35  ? '#800026' :
                       d > 30  ? '#BD0026' :
                       d > 25  ? '#E31A1C' :
                       d > 20  ? '#FC4E2A' :
                       d > 15  ? '#FD8D3C' :
                       d > 10  ? '#FEB24C' :
                       d > 5   ? '#FED976' :
                       d > 0   ? '#FFEDA0' :
                       "white"
                    return color
                }

                const name = feature.properties._name ?? ""
                const fcolor = getColor(count)
                const style_obj = 
                {
                    fillColor: fcolor,
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7,
                    className: name.replaceAll(" ", "_")
                }
                return style_obj
            },
            onEachFeature: VIEWER.formatPopup2
        })

        VIEWER.geoJsonLayers.judicial_districts = L.geoJSON(geoMarkers.judicial_districts, {
            style: function(feature) {
                const name = feature.properties._name ?? ""
                return {
                    color: "#4d4dff",
                    fillColor: "#4d4dff",
                    fillOpacity: 0.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopup
        })

        VIEWER.geoJsonLayers.judicial_circuits = L.geoJSON(geoMarkers.judicial_circuits, {
            style: function(feature) {
                const name = feature.properties._name ?? ""
                return {
                    color: "#cc00cc",
                    fillColor: "#cc00cc",
                    fillOpacity: 0.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopup
        })

        VIEWER.geoJsonLayers.taxFeatures1798 = L.geoJSON(geoMarkers.tax_1798, {
            style: function(feature) {
                const name = feature.properties._name ?? ""
                return {
                    color: "blue",
                    fillColor: "blue",
                    fillOpacity: 0.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopup
        })

        VIEWER.geoJsonLayers.taxFeatures1814 = L.geoJSON(geoMarkers.tax_1814, {
            style: function(feature) {
                const name = feature.properties._name ?? ""
                return {
                    color: "purple",
                    fillColor: "purple",
                    fillOpacity: 0.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopup
        })

        VIEWER.geoJsonLayers.locationFeatures = L.geoJSON(geoMarkers.locations, {
            pointToLayer: function(feature, latlng) {
                const name = feature.properties._name ?? ""
                const capitalIcon = L.icon({
                    iconUrl: './images/star.png',
                    iconSize: [16, 16], // size of the icon
                    iconAnchor: [8, 9], // point of the icon which will correspond to marker's location
                    popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                })

                // Make the Capital a 'star' Icon
                if (feature.properties.STATE_ABBREV === "Capital") return L.marker(latlng, { icon: capitalIcon })

                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: "yellow",
                    color: "black",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 1,
                    className: name.replaceAll(" ", "_")
                })
            },
            onEachFeature: VIEWER.formatPopup
        })

        const clusters = L.geoJSON(geoMarkers.locations, {
            pointToLayer: function(feature, latlng) {
                const name = feature.properties._name ?? ""

                const capitalIcon = L.icon({
                    iconUrl: './images/star.png',
                    iconSize: [16, 16], // size of the icon
                    iconAnchor: [8, 9], // point of the icon which will correspond to marker's location
                    popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                })
                // Make the Capital a 'star' Icon
                if (feature.properties.STATE_ABBREV === "Capital") return L.marker(latlng, { icon: capitalIcon })
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: "yellow",
                    color: "black",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 1,
                    className: "clusterPoint"
                })
            },
            onEachFeature: VIEWER.formatPopup
        })

        // This layer is special because it is a LayerGroup via markerClusterGroup.  The L.GeoJSON aboves makes an individual Layer per feature and does not group them.
        if (VIEWER.locationsClusterLayer) {
            VIEWER.locationsClusterLayer.clearLayers()
            VIEWER.locationsClusterLayer.addLayer(clusters)
        } else {
            VIEWER.locationsClusterLayer = L.markerClusterGroup({
                disableClusteringAtZoom: 6,
                showCoverageOnHover: false,
                spiderfyOnMaxZoom: true,
                spiderLegPolylineOptions: { weight: 1.5, color: 'yellow', opacity: 0.75 }
            })
            VIEWER.locationsClusterLayer.addLayer(clusters)
        }

        VIEWER.main_layers = {
            "1798 Tax Districts": VIEWER.geoJsonLayers.taxFeatures1798,
            "1814 Tax Districts": VIEWER.geoJsonLayers.taxFeatures1814,
            "Judicial Districts": VIEWER.geoJsonLayers.judicial_districts,
            "Judicial Circuits": VIEWER.geoJsonLayers.judicial_circuits,
            "State Boundaries": VIEWER.geoJsonLayers.stateFeatures,
            "County Boundaries": VIEWER.geoJsonLayers.countyFeatures,
            "Postmasters Heatmap": VIEWER.geoJsonLayers.postmastersFeatures,
            "Specific Locations": VIEWER.geoJsonLayers.locationFeatures,
            "Clustered Locations": VIEWER.locationsClusterLayer
        }

        VIEWER.selectedLayers = [
            VIEWER.baseLayers.mapbox_satellite_layer,
            VIEWER.locationsClusterLayer
        ]

        if (VIEWER.mymap) {
            // Which layers are active?  We will need to make them active again after we rebuild them filtered.
            VIEWER.selectedLayers = []
            //Main Layers
            VIEWER.layerControl._container.querySelectorAll("input[type='checkbox']:checked").forEach(chk => {
                const layername = chk.nextElementSibling.innerText.trim()
                VIEWER.selectedLayers.push(VIEWER.main_layers[layername])
            })
            //Base Layer...only one 
            VIEWER.layerControl._container.querySelectorAll("input[type='radio']:checked").forEach(chk => {
                const layername = chk.nextElementSibling.innerText.trim()
                VIEWER.selectedLayers.push(VIEWER.baseMaps[layername])
            })
            VIEWER.layerControl.remove()
            VIEWER.mymap.eachLayer(function(layer) {
                // Clear the L.GeoJSON layers.  Remember locationsClusterLayer is a layer group.  Clearing and redrawing is handled differently.
                if (layer.hasOwnProperty("feature") && layer.options.className !== "clusterPoint") {
                    layer.remove()
                }
            })
            VIEWER.layerControl = L.control.layers(VIEWER.baseMaps, VIEWER.main_layers).addTo(VIEWER.mymap)
            VIEWER.selectedLayers.forEach(l => {
                if (!l.hasOwnProperty("tiles")) {
                    l.addTo(VIEWER.mymap)
                }
            })
        } else {
            VIEWER.mymap = L.map('leafletInstanceContainer', {
                center: coords,
                zoomControl: false,
                zoom: VIEWER.startZoom,
                attributionControl: false,
                layers: VIEWER.selectedLayers
            })
            VIEWER.layerControl = L.control.layers(VIEWER.baseMaps, VIEWER.main_layers).addTo(VIEWER.mymap)
            VIEWER.mymap.addControl(L.control.zoom({position: 'bottomright'}))
        }

        // Can only show State and County boundaries if a year is selected.  Hide these options until then.
        if (parseInt(userInputDate) === 0) {
            VIEWER.mymap.setView(VIEWER.startCoords, VIEWER.startZoom)
            VIEWER.layerControl._container.querySelectorAll("input[type='checkbox']").forEach(chk => {
                if(
                    chk.nextElementSibling.innerText.trim() === "County Boundaries"
                    || chk.nextElementSibling.innerText.trim()  === "Postmasters Heatmap"
                    || chk.nextElementSibling.innerText.trim()  === "State Boundaries"
                )
                {
                    if(chk.checked) chk.click()
                    chk.parentElement.classList.add("is-hidden")
                }
                else if(
                    chk.nextElementSibling.innerText.trim() === "Specific Locations" 
                    || chk.nextElementSibling.innerText.trim() === "1814 Tax Districts" 
                    || chk.nextElementSibling.innerText.trim() === "1798 Tax Districts"
                    || chk.nextElementSibling.innerText.trim() === "Judicial Districts" 
                    || chk.nextElementSibling.innerText.trim() === "Judicial Circuits"
                )
                {
                    if(chk.checked) chk.click()
                }
                else if(chk.nextElementSibling.innerText.trim() === "Clustered Locations"){
                    if(!chk.checked) chk.click()
                }
            })
        }
        else{
            VIEWER.layerControl._container.querySelectorAll("input[type='checkbox']").forEach(chk => {
                chk.parentElement.classList.remove("is-hidden")
            })
        }
        
        VIEWER.mymap.on("overlayadd", function(event) {
            VIEWER.locationsClusterLayer.bringToFront()
        })

        VIEWER.mymap.on("overlayadd", function(event) {
            VIEWER.locationsClusterLayer.bringToFront()
        })

        const initialized = new CustomEvent("KastorLeafletInitialized")
        document.dispatchEvent(initialized)

    },150)

    
}

/**
 * Define what information from each Feature belongs in the popup
 * that appears.  We want to show labels, summaries and thumbnails.
 */
VIEWER.formatPopup2 = function(feature, layer) {
    let popupContent = "<div class='featurePopUp'>"

    if (feature.properties) {
        if (feature.properties["STATE_TERR"]) {
            popupContent += `<div class="featureInfo"><label>Territory:</label> ${feature.properties["STATE_TERR"]} </div> `
        }
        if (feature.properties["FULL_NAME"]) {
            popupContent += `<div class="featureInfo"><label>Name:</label> ${feature.properties["FULL_NAME"]} </div> `
        }
        if (feature.properties["CNTY_TYPE"]) {
            popupContent += `<div class="featureInfo"><label>Territory Type:</label> ${feature.properties["CNTY_TYPE"]}</div>`
        }
        if (feature.properties["TERR_TYPE"]) {
            popupContent += `<div class="featureInfo"><label>Territory Type:</label> ${feature.properties["TERR_TYPE"]}</div>`
        }
        if (feature.properties["Earliest Date"]) {
            popupContent += `<div class="featureInfo"><label>Records Start In:</label> ${parseInt(feature.properties["Earliest Date"])}</div>`
        } else if (feature.properties["START_DATE"]) {
            popupContent += `<div class="featureInfo"><label>Records Start In:</label> ${parseInt(feature.properties["START_DATE"])}</div>`
        }
        if (feature.properties["Latest Date"]) {
            popupContent += `<div class="featureInfo"><label>Records End In:</label> ${parseInt(feature.properties["Latest Date"])}</div>`
        } else if (feature.properties["END_DATE"]) {
            popupContent += `<div class="featureInfo"><label>Records End In:</label> ${parseInt(feature.properties["END_DATE"])}</div>`
        }
        if (feature.properties["Earliest Date"]) {
            layer.options.startDate = feature.properties["Earliest Date"]
        } else if (feature.properties["START_DATE"]) {
            layer.options.startDate = feature.properties["START_DATE"]
        }
        if (feature.properties["Latest Date"]) {
            layer.options.endDate = feature.properties["Latest Date"]
        } else if (feature.properties["END_DATE"]) {
            layer.options.endDate = feature.properties["END_DATE"]
        }
        if(feature.properties.employeeCount){
            const count = VIEWER.determineEmployeeCount(feature)
            layer.options.employeeCount = count
            popupContent += `<div class="featureInfo"><label>Employee Count</label> ${count}</div>`
        }
        if(feature.properties["employeesLink"]){
            // TODO this button should load the page for employees that worked at this location, target _blank
            popupContent += `
            <div class="featureInfo is-center">
                <a href="${feature.properties["employeesLink"]}" target="_blank" class="button secondary employeesLink">see who worked here</a>
            </div>`
        }
        layer.bindPopup(popupContent)
    }
}

/**
 * Define what information from each Feature belongs in the popup
 * that appears.  We want to show labels, summaries and thumbnails.
 */
VIEWER.formatPopup = function(feature, layer) {
    function determineStateTitle(feature) {
        const datemap = feature ?.properties ?.STATE_TITLE
        if (!datemap) return null
        const years_in_order = Object.keys(datemap).map(stryear => parseInt(stryear)).sort(function(a, b) { return a - b })
        const mostrecent = years_in_order.pop()
        let titleForChosenYear = datemap[mostrecent]
        if (parseInt(VIEWER.userInputDate) > 0) {
            titleForChosenYear = null
            for (let i = 0; i < years_in_order.length; i++) {
                const prev_year = (i > 0) ? years_in_order[i - 1] : years_in_order[i]
                const the_year = years_in_order[i]
                if (the_year === parseInt(VIEWER.userInputDate)) {
                    titleForChosenYear = feature.properties.STATE_TITLE[the_year]
                    break
                }
                if (the_year > parseInt(VIEWER.userInputDate)) {
                    titleForChosenYear = feature.properties.STATE_TITLE[prev_year]
                    break
                }
            }
        }
        return titleForChosenYear
    }
    let popupContent = "<div class='featurePopUp'>"
    let i = 0
    let langs = []
    let stringToLangMap = { "none": [] }
    if (feature.properties) {
        if (feature.properties["Geocoding Location"]) {
            popupContent += `<div class="featureInfo"><label>Name:</label> ${feature.properties["Geocoding Location"]} </div>`
        }
        if (feature.properties["District"]) {
            popupContent += `<div class="featureInfo"><label>Name:</label> ${feature.properties["District"]} </div>`
        }
        if (feature.properties["Circuit"]) {
            popupContent += `<div class="featureInfo"><label>Name:</label> ${feature.properties["Circuit"]} </div>`
        }
        if (feature.properties["Sector"]) {
            popupContent += `<div class="featureInfo"><label>Sector:</label> ${feature.properties["Sector"]} </div>`
        }
        if (feature.properties["Country"]) {
            popupContent += `<div class="featureInfo"><label>Country:</label> ${feature.properties["Country"]}</div>`
        }
        if (feature.properties["STATE_TITLE"]) {
            const stateTitle = determineStateTitle(feature)
            if (stateTitle) {
                popupContent += `<div class="featureInfo"><label>State Title:</label> ${stateTitle} </div> `
            }
        }
        if (feature.properties["Type"]) {
            popupContent += `<div class="featureInfo"><label>Type:</label> ${feature.properties["Type"]}</div>`
        }
        if (feature.properties["Earliest Date"]) {
            popupContent += `<div class="featureInfo"><label>Records Start In:</label> ${parseInt(feature.properties["Earliest Date"])}</div>`
        } else if (feature.properties["START_DATE"]) {
            popupContent += `<div class="featureInfo"><label>Records Start In:</label> ${parseInt(feature.properties["START_DATE"])}</div>`
        }
        if (feature.properties["Latest Date"]) {
            popupContent += `<div class="featureInfo"><label>Records End In:</label> ${parseInt(feature.properties["Latest Date"])}</div>`
        } else if (feature.properties["END_DATE"]) {
            popupContent += `<div class="featureInfo"><label>Records End In:</label> ${parseInt(feature.properties["END_DATE"])}</div>`
        }
        if (feature.properties["Earliest Date"]) {
            layer.options.startDate = feature.properties["Earliest Date"]
        } else if (feature.properties["START_DATE"]) {
            layer.options.startDate = feature.properties["START_DATE"]
        }
        if (feature.properties["Latest Date"]) {
            layer.options.endDate = feature.properties["Latest Date"]
        } else if (feature.properties["END_DATE"]) {
            layer.options.endDate = feature.properties["END_DATE"]
        }
        if(feature.properties["employeesLink"]){
            // TODO this button should load the page for employees that worked at this location, target _blank
            popupContent += `
            <div class="featureInfo is-center">
                <a href="${feature.properties["employeesLink"]}" target="_blank" class="button secondary employeesLink">see who worked here</a>
            </div>`
        }
        
        layer.bindPopup(popupContent)
    }
}

// // Change the selected date shown to the user.
document.getElementById("timeSlider").addEventListener("input", function(e) {
    document.getElementById("slider-value").innerText = document.location.href.includes("inset.html") ? e.target.value : `Year: ${e.target.value}`
})

// Change the date slider
document.getElementById("timeSlider").addEventListener("change", function(e) {
    // Remove and redraw the layers filtering the data by Start Date and End Date comparison to the slider value.
    var sliderYear = e.target.value + "-12-31"
    VIEWER.initializeLeaflet(VIEWER.startCoords, sliderYear)
})

// Reset to the default view...maybe just page reset?
document.getElementById("resetView").addEventListener("click", function(e) {
    VIEWER.reset(e)
})

// Reset to the default view...maybe just page reset?
document.querySelector(".year-inc").addEventListener("click", function(e) {
    let currentYear = parseInt(document.getElementById("slider-value").innerText)
    if(!currentYear || currentYear === 1832) return
    currentYear++
    document.getElementById("slider-value").innerText = currentYear
    VIEWER.initializeLeaflet(VIEWER.startCoords, `${currentYear}-12-31`)
})

// Reset to the default view...maybe just page reset?
document.querySelector(".year-dec").addEventListener("click", function(e) {
    let currentYear = parseInt(document.getElementById("slider-value").innerText)
    if(!currentYear || currentYear === 1789) return
    currentYear--
    document.getElementById("slider-value").innerText = currentYear
    VIEWER.initializeLeaflet(VIEWER.startCoords, `${currentYear}-12-31`)
})

VIEWER.reset = function(event) {
    VIEWER.initializeLeaflet(VIEWER.startCoords, "0-12-31")
}

VIEWER.determineEmployeeCount = function(feature) {
    const datemap = feature?.properties?.employeeCount
    if (!datemap) return -1
    const years_in_order = Object.keys(datemap).map(stryear => parseInt(stryear)).sort(function(a, b) { return a - b })
    const mostrecent = years_in_order.pop()
    let countForChosenYear = datemap[mostrecent]
    if (parseInt(VIEWER.userInputDate) > 0) {
        // Ask about this.  If the latest year recorded is 1829 and the chosen year is 1831, should I show 1829's numbers?
        //countForChosenYear = 0
        for (let i = 0; i < years_in_order.length; i++) {
            const prev_year = (i > 0) ? years_in_order[i - 1] : years_in_order[i]
            const the_year = years_in_order[i]
            if (the_year === parseInt(VIEWER.userInputDate)) {
                countForChosenYear = feature.properties.employeeCount[the_year]
                break
            }
            if (the_year > parseInt(VIEWER.userInputDate)) {
                countForChosenYear = feature.properties.employeeCount[prev_year]
                break
            }
        }
    }
    return countForChosenYear
}

VIEWER.init()