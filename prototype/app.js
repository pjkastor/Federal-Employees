/* 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 */

let VIEWER = {}

VIEWER.geoJsonByLayers = {}

VIEWER.geoJsonLayers = {}

VIEWER.locationsClusterLayerGroup = null

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
VIEWER.userInputDate = "1829-12-31"

//Starting Zoom level based on interface
VIEWER.startZoom = document.location.href.includes("inset.html") ? 2 : 2

//Starting coords based on interface
VIEWER.startCoords = document.location.href.includes("inset.html") ? [21, 30] : [12, 12]

VIEWER.currentZoomLevel = VIEWER.startZoom

VIEWER.cluster_points = null

VIEWER.cluster_icons = null

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
    kastorMapLegend.classList.remove("is-hidden")
    leafletInstanceContainer.classList.add("has-loaded")
})

VIEWER.iconsAtZoomLevel = function(oldlevel, newlevel){
    if(!VIEWER.mymap) return
    if(!oldlevel || !newlevel) return
    const maxZoom = VIEWER.mymap.getMaxZoom()
    const zoomInScenario = (newlevel > oldlevel)
    VIEWER.locationsClusterLayerGroup.clearLayers()
    if(newlevel >= 8){
        // Hide the cluster points and show the cluster icons
        VIEWER.locationsClusterLayerGroup.addLayer(VIEWER.cluster_icons)
    }
    else{
        // Show the cluster points and hide the cluster icons
        VIEWER.locationsClusterLayerGroup.addLayer(VIEWER.cluster_points)
    }
}

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
    let al_1819_district = await fetch("./data/judicial_districts/AL_1819.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let al_1824_district = await fetch("./data/judicial_districts/AL_1824.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let ct_district = await fetch("./data/judicial_districts/CT_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let dc_district = await fetch("./data/judicial_districts/DC_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let de_district = await fetch("./data/judicial_districts/DE_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let ga_district = await fetch("./data/judicial_districts/GA_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let il_district = await fetch("./data/judicial_districts/IL_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let in_district = await fetch("./data/judicial_districts/IN_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let ky_district = await fetch("./data/judicial_districts/KY_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let la_1804_district = await fetch("./data/judicial_districts/LA_1804.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let la_1812_district = await fetch("./data/judicial_districts/LA_1812.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let la_1823_district = await fetch("./data/judicial_districts/LA_1823.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let ma_district = await fetch("./data/judicial_districts/MA_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let md_district = await fetch("./data/judicial_districts/MD_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let me_district = await fetch("./data/judicial_districts/ME_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let mi_district = await fetch("./data/judicial_districts/MI_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let mo_district = await fetch("./data/judicial_districts/MO_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let ms_district = await fetch("./data/judicial_districts/MS_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let nc_1789_district = await fetch("./data/judicial_districts/NC_1789.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let nc_1800_district = await fetch("./data/judicial_districts/NC_1800.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let nh_district = await fetch("./data/judicial_districts/NH_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let nj_district = await fetch("./data/judicial_districts/NJ_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let ny_1789_district = await fetch("./data/judicial_districts/NY_1789.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let ny_1814_district = await fetch("./data/judicial_districts/NY_1814.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let ny_1823_district = await fetch("./data/judicial_districts/NY_1818.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let oh_district = await fetch("./data/judicial_districts/OH_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let pa_1789_district = await fetch("./data/judicial_districts/PA_1789.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let pa_1818_district = await fetch("./data/judicial_districts/PA_1818.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let pa_1823_district = await fetch("./data/judicial_districts/PA_1823.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let ri_district = await fetch("./data/judicial_districts/RI_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let sc_1789_district = await fetch("./data/judicial_districts/SC_1789.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let sc_1823_district = await fetch("./data/judicial_districts/SC_1823.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let tn_1797_district = await fetch("./data/judicial_districts/TN_1797.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let tn_1802_district = await fetch("./data/judicial_districts/TN_1802.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let va_1789_district = await fetch("./data/judicial_districts/VA_1789.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let va_1819_district = await fetch("./data/judicial_districts/VA_1819.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let va_1824_district = await fetch("./data/judicial_districts/VA_1824.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let vt_district = await fetch("./data/judicial_districts/VT_District.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let judicial_districts = 
        {
            "__name":"judicial_districts", 
            "@type": "FeatureCollection",
            "features": [
                ...al_1819_district,
                ...al_1824_district,
                ...ct_district,
                ...dc_district,
                ...de_district,
                ...ga_district,
                ...il_district,
                ...in_district,
                ...ky_district,
                ...la_1804_district,
                ...la_1812_district,
                ...la_1823_district,
                ...ma_district,
                ...md_district,
                ...me_district,
                ...mi_district,
                ...mo_district,
                ...ms_district,
                ...nc_1789_district,
                ...nc_1800_district,
                ...nh_district,
                ...nj_district,
                ...ny_1789_district,
                ...ny_1814_district,
                ...ny_1823_district,
                ...pa_1789_district,
                ...pa_1818_district, 
                ...pa_1823_district,
                ...ri_district,
                ...sc_1789_district,
                ...sc_1823_district,
                ...tn_1797_district,
                ...tn_1802_district,
                ...va_1789_district,
                ...va_1819_district,
                ...va_1824_district,
                ...vt_district
            ]
        }

    let first_circuit_1789 = await fetch("./data/judicial_circuits/First_Circuit_1789.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let first_circuit_1790 = await fetch("./data/judicial_circuits/First_Circuit_1790.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let first_circuit_1791 = await fetch("./data/judicial_circuits/First_Circuit_1791.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let first_circuit_1800 = await fetch("./data/judicial_circuits/First_Circuit_1800.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let first_circuit_1802 = await fetch("./data/judicial_circuits/First_Circuit_1802.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let first_circuit_1807 = await fetch("./data/judicial_circuits/First_Circuit_1807.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    
    let second_circuit_1789 = await fetch("./data/judicial_circuits/Second_Circuit_1789.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let second_circuit_1800 = await fetch("./data/judicial_circuits/Second_Circuit_1800.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let second_circuit_1802 = await fetch("./data/judicial_circuits/Second_Circuit_1802.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    
    let third_circuit_1789n = await fetch("./data/judicial_circuits/Third_Circuit_1789_n.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let third_circuit_1789a = await fetch("./data/judicial_circuits/Third_Circuit_1789a.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let third_circuit_1790 = await fetch("./data/judicial_circuits/Third_Circuit_1790.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let third_circuit_1800 = await fetch("./data/judicial_circuits/Third_Circuit_1800.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let third_circuit_1802 = await fetch("./data/judicial_circuits/Third_Circuit_1802.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    
    let fourth_circuit_1800 = await fetch("./data/judicial_circuits/Fourth_Circuit_1800.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let fourth_circuit_1802 = await fetch("./data/judicial_circuits/Fourth_Circuit_1802.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    
    let fifth_circuit_1800 = await fetch("./data/judicial_circuits/Fifth_Circuit_1800.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let fifth_circuit_1802 = await fetch("./data/judicial_circuits/Fifth_Circuit_1802.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    
    let sixth_circuit_1800 = await fetch("./data/judicial_circuits/Sixth_Circuit_1800.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    let sixth_circuit_1802 = await fetch("./data/judicial_circuits/Sixth_Circuit_1802.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    
    let seventh_circuit_1807 = await fetch("./data/judicial_circuits/Seventh_Circuit_1807.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    
    let dc_circuit = await fetch("./data/judicial_circuits/DC_Circuit.geojson").then(resp => resp.json()).then(j => j.features).catch(err => { return {} })

    let judicial_circuits = 
        {
            "__name":"judicial_circuits", 
            "@type": "FeatureCollection",
            "features": [
                ...first_circuit_1789,
                ...first_circuit_1790,
                ...first_circuit_1791,
                ...first_circuit_1800,
                ...first_circuit_1802,
                ...first_circuit_1807,

                ...second_circuit_1789,
                ...second_circuit_1800,
                ...second_circuit_1802,

                ...third_circuit_1789n,
                ...third_circuit_1789a,
                ...third_circuit_1790,
                ...third_circuit_1800,
                ...third_circuit_1802,

                ...fourth_circuit_1800,
                ...fourth_circuit_1802,

                ...fifth_circuit_1800,
                ...fifth_circuit_1802,

                ...sixth_circuit_1800,
                ...sixth_circuit_1802,

                ...seventh_circuit_1807,

                ...dc_circuit
            ]
        }
    let stateBoundaries = await fetch("./data/StateBoundaries.json").then(resp => resp.json()).catch(err => { return {} })
    let countyBoundaries = await fetch("./data/CountyBoundariesWithEmployeeCounts_new_adjusted.json").then(resp => resp.json()).catch(err => { return {} })
    let geoJsonData = []
    let peopleFields = []
    let peopleData = []
    let geoJsonByLayers = {}

    judicial_districts.features = judicial_districts.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = "judicial_disctrict"
        return f
    })

    judicial_circuits.features = judicial_circuits.features.map(f => {
        if (!f.hasOwnProperty("properties")) f.properties = {}
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

    VIEWER.geoJsonByLayers.judicial_districts = judicial_districts
    VIEWER.geoJsonByLayers.judicial_circuits = judicial_circuits

    VIEWER.geoJsonByLayers.locations = locationData
    VIEWER.geoJsonByLayers.counties = countyBoundaries
    VIEWER.geoJsonByLayers.states = stateBoundaries
    VIEWER.geoJsonByLayers.tax_1798 = tax_1798
    VIEWER.geoJsonByLayers.tax_1814 = tax_1814

    // const locations_without_coordinates = locationData.features.filter(f => f.geometry.coordinates[0] === null || f.geometry.coordinates[1] === null)
    // console.warn("The following locations do not have coordinates.  They will not appear on the map.")
    // console.log(locations_without_coordinates)

    VIEWER.initializeLeaflet(VIEWER.startCoords, "1829-12-31")
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

        // VIEWER.baseLayers.osm =
        //     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //         maxZoom: 19
        //     })

        // VIEWER.baseLayers.topomap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        //     maxZoom: 10
        // })

        // VIEWER.baseLayers.USGS_top_streets = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
        //     maxZoom: 8
        // })

        VIEWER.baseLayers.Esri_WorldPhysical = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 8
        })

        VIEWER.baseLayers.Esri_Ocean = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 10
        })

        VIEWER.baseMaps = {
            "Mapbox Satellite": VIEWER.baseLayers.mapbox_satellite_layer,
            // "OpenStreetMap": VIEWER.baseLayers.osm,
            // "Open Topomap": VIEWER.baseLayers.topomap,
            // "USGS Topo + Street": VIEWER.baseLayers.USGS_top_streets,
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
        kastorMapLegend.classList.add("is-hidden")
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
                            if (
                                !(f.properties.hasOwnProperty("Start_Date") && f.properties.hasOwnProperty("End_Date")) ||
                                !(f.properties.hasOwnProperty("Start_Year") && f.properties.hasOwnProperty("End_Year"))
                                ) return true
                            // These are all just years but that should be OK
                            const sDate = f.properties.hasOwnProperty("Start_Date") ? new Date(f.properties["Start_Date"]+"") : new Date(f.properties["Start_Year"]+"")
                            const eDate = f.properties.hasOwnProperty("End_Date") ? new Date(f.properties["End_Date"]+"") : new Date(f.properties["End_Year"]+"")
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
                document.getElementById("timeSlider").value = "1829"
            }
            if(document.getElementById("slider-value")){
                document.getElementById("slider-value").innerHTML = document.location.href.includes("inset.html") ? "N/A" : "Year: N/A"
            }
        }

        VIEWER.geoJsonLayers.stateFeatures = L.geoJSON(geoMarkers.states, {
            style: function(feature) {
                const name = feature.properties._name ?? ""
                return {
                    color: "white",
                    fillColor: "#005A9C",
                    fillOpacity: 1.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopup2
        })

        VIEWER.geoJsonLayers.countyFeatures = L.geoJSON(geoMarkers.counties, {
            style: function(feature) {
                const name = feature.properties._name ?? ""
                return {
                    color: "white",
                    fillColor: "#008080",
                    fillOpacity: 1.00,
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
                const name = feature.properties["Circuit"] ?? ""
                const fill =
                    (name.includes("First")) ? "brown" :
                    (name.includes("Second")) ? "green" :
                    (name.includes("Third")) ? "orange" :
                    (name.includes("Fourth")) ? "purple" :
                    (name.includes("Fifth")) ? "blue" :
                    (name.includes("Sixth")) ? "gray" : 
                    (name.includes("DC")) ? "red" : "#FFFDD0"
                return {
                    color: fill,
                    fillColor: fill,
                    fillOpacity: 1.00,
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
                
                // Make the Capital a 'star' Icon
                if (feature.properties.STATE_ABBREV === "Capital") {
                    const capitalIcon = L.icon({
                        iconUrl: './images/map-icons/Capital.png',
                        iconSize: [24, 24], // size of the icon
                        iconAnchor: [12, 10], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                    })
                    return L.marker(latlng, { icon: capitalIcon })
                }

                const type = feature.properties?.Type
                let icon = null
                switch(type){
                    case "Maritime Station":
                        icon = L.icon({
                            iconUrl: './images/map-icons/Maritime.png',
                            iconSize: [30, 30], // size of the icon
                            iconAnchor: [15, 12], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break
                    case "Lighthouse":
                        icon = L.icon({
                            iconUrl: './images/map-icons/Lighthouse.png',
                            iconSize: [30, 30], // size of the icon
                            iconAnchor: [15, 12], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break
                    case "Non-U.S. Location":
                       icon = L.icon({
                            iconUrl: './images/map-icons/Non-US.png',
                            iconSize: [24, 24], // size of the icon
                            iconAnchor: [12, 11], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break 
                    case "U.S. Location":
                        icon = L.icon({
                            iconUrl: './images/map-icons/Location.png',
                            iconSize: [30, 30], // size of the icon
                            iconAnchor: [15, 12], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break
                    case "Building":
                            icon = L.icon({
                                iconUrl: './images/map-icons/Building.png',
                                iconSize: [24, 24], // size of the icon
                                iconAnchor: [12, 10], // point of the icon which will correspond to marker's location
                                popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                            })
                    break
                    case "State":
                        icon = L.icon({
                            iconUrl: './images/map-icons/State.png',
                            iconSize: [24, 24], // size of the icon
                            iconAnchor: [12, 10], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break
                    default:
                }
                if(icon){
                    return L.marker(latlng, { "icon": icon })
                }
                else{
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: "yellow",
                        color: "black",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 1,
                        className: name.replaceAll(" ", "_")
                    })    
                }
            },
            onEachFeature: VIEWER.formatPopup
        })
        
        /**
         * An option to switch between markers and icons on this layer is desired.
         * It could be made completeley custom and combine both the point and icon markers.
         * Then, on zoom, we can toggle.
         */ 
        VIEWER.cluster_points = L.geoJSON(geoMarkers.locations, {
            pointToLayer: function(feature, latlng) {
                const name = feature.properties._name ?? ""

                if (feature.properties.STATE_ABBREV === "Capital") {
                    const capitalIcon = L.icon({
                        iconUrl: './images/map-icons/Capital.png',
                        iconSize: [16, 16], // size of the icon
                        iconAnchor: [8, 9], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                    })
                    return L.marker(latlng, { icon: capitalIcon })
                }

                const type = feature.properties?.Type
                let fill =
                    (type === "Maritime Station") ? "#008080" :
                    (type === "Lighthouse") ? "yellow" :
                    (type === "Non-U.S. Location") ? "#7A55A6" : 
                    (type === "U.S. Location") ? "blue" : 
                    (type === "State") ? "pink" :
                    (type === "Building") ? "lightgrey" : "red"
                //if(feature.properties?.US === "No") fill = "#7A55A6"
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: fill,
                    color: "black",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 1,
                    className: "clusterPoint"
                })    
            },
            onEachFeature: VIEWER.formatPopup
        })

        VIEWER.cluster_icons = L.geoJSON(geoMarkers.locations, {
            pointToLayer: function(feature, latlng) {
                const name = feature.properties._name ?? ""
                
                // Make the Capital a 'star' Icon
                if (feature.properties.STATE_ABBREV === "Capital") {
                    const capitalIcon = L.icon({
                        iconUrl: './images/map-icons/Capital.png',
                        iconSize: [24, 24], // size of the icon
                        iconAnchor: [12, 10], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                    })
                    return L.marker(latlng, { icon: capitalIcon })
                }

                const type = feature.properties?.Type
                let icon = null
                switch(type){
                    case "Maritime Station":
                        icon = L.icon({
                            iconUrl: './images/map-icons/Maritime.png',
                            iconSize: [30, 30], // size of the icon
                            iconAnchor: [15, 12], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break
                    case "Lighthouse":
                        icon = L.icon({
                            iconUrl: './images/map-icons/Lighthouse.png',
                            iconSize: [30, 30], // size of the icon
                            iconAnchor: [15, 12], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break
                    case "Non-U.S. Location":
                       icon = L.icon({
                            iconUrl: './images/map-icons/Non-US.png',
                            iconSize: [24, 24], // size of the icon
                            iconAnchor: [12, 11], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break 
                    case "U.S. Location":
                        icon = L.icon({
                            iconUrl: './images/map-icons/Location.png',
                            iconSize: [30, 30], // size of the icon
                            iconAnchor: [15, 12], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break
                    case "Building":
                        icon = L.icon({
                            iconUrl: './images/map-icons/Building.png',
                            iconSize: [24, 24], // size of the icon
                            iconAnchor: [12, 10], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break
                    case "State":
                        icon = L.icon({
                            iconUrl: './images/map-icons/State.png',
                            iconSize: [24, 24], // size of the icon
                            iconAnchor: [12, 10], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
                        })
                    break
                    default:
                }
                if(icon){
                    return L.marker(latlng, { "icon": icon })
                }
                else{
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: "yellow",
                        color: "black",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 1,
                        className: "clusterIcon"
                    })    
                }
            },
            onEachFeature: VIEWER.formatPopup
        })

        // This layer is special because it is a LayerGroup via markerClusterGroup.  The L.GeoJSON aboves makes an individual Layer per feature and does not group them.
        if (VIEWER.locationsClusterLayerGroup) {
            VIEWER.locationsClusterLayerGroup.clearLayers()
        } else {
            VIEWER.locationsClusterLayerGroup = L.markerClusterGroup({
                disableClusteringAtZoom: 6,
                showCoverageOnHover: false,
                spiderfyOnMaxZoom: true,
                spiderLegPolylineOptions: { weight: 1.5, color: 'gray', opacity: 0.75 }
            })
        }
        if(VIEWER.currentZoomLevel >= 8){
            // Hide the cluster points and show the cluster icons
            VIEWER.locationsClusterLayerGroup.addLayer(VIEWER.cluster_icons)
        }
        else{
            // Show the cluster points and hide the cluster icons
            VIEWER.locationsClusterLayerGroup.addLayer(VIEWER.cluster_points)
        }

        VIEWER.main_layers = {
            "1798 Tax Districts": VIEWER.geoJsonLayers.taxFeatures1798,
            "1814 Tax Districts": VIEWER.geoJsonLayers.taxFeatures1814,
            "Judicial Districts": VIEWER.geoJsonLayers.judicial_districts,
            "Judicial Circuits": VIEWER.geoJsonLayers.judicial_circuits,
            "State Boundaries": VIEWER.geoJsonLayers.stateFeatures,
            "County Boundaries": VIEWER.geoJsonLayers.countyFeatures,
            "Postmasters Heatmap": VIEWER.geoJsonLayers.postmastersFeatures,
            "Individual Locations": VIEWER.geoJsonLayers.locationFeatures,
            "Clustered Locations": VIEWER.locationsClusterLayerGroup
        }

        VIEWER.selectedLayers = [
            VIEWER.baseLayers.mapbox_satellite_layer,
            VIEWER.locationsClusterLayerGroup
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
                    chk.nextElementSibling.innerText.trim() === "Individual Locations" 
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
        
        VIEWER.mymap.addEventListener("overlayadd", function(event) {
            VIEWER.locationsClusterLayerGroup.bringToFront()
        })

        VIEWER.mymap.addEventListener("zoomend", function (event) {
            const oldlevel = VIEWER.currentZoomLevel
            VIEWER.currentZoomLevel = event.target._zoom
            VIEWER.iconsAtZoomLevel(oldlevel, VIEWER.currentZoomLevel)
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
    let modName = null
    let n = null
    if (feature.properties) {
        if (feature.properties["STATE_TERR"]) {
            popupContent += `<div class="featureInfo"><label>Territory:</label> ${feature.properties["STATE_TERR"]} </div> `
        }
        if (feature.properties["FULL_NAME"]) {
            n = feature.properties["FULL_NAME"].split(" ")
            n = n.map(w => {
                w = w.toLowerCase()
                w = w[0].toUpperCase() + w.slice(1)
                return w
            })
            modName = n.join(" ")
            popupContent += `<div class="featureInfo"><label>Name:</label> ${modName} </div> `
        }
        else if (feature.properties["NAME"]) {
            n = feature.properties["NAME"].split(" ")
            n = n.map(w => {
                w = w.toLowerCase()
                w = w[0].toUpperCase() + w.slice(1)
                return w
            })
            modName = n.join(" ")
            popupContent += `<div class="featureInfo"><label>Name:</label> ${modName} </div>`
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
        const datemap = feature?.properties?.STATE_TITLE
        if (!datemap) return null
        if (typeof datemap === "string") return datemap
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
            popupContent += `<div class="featureInfo"><label>District:</label> ${feature.properties["District"]} </div>`
        }
        if (feature.properties["Circuit"]) {
            popupContent += `<div class="featureInfo"><label>Circuit:</label> ${feature.properties["Circuit"]} </div>`
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
            popupContent += `<div class="featureInfo"><label>Type:</label> ${feature.properties["Type"].replace("Locality", "Location")}</div>`
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
    if(!currentYear || currentYear === 1829) return
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