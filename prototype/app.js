/* 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 */

let VIEWER = {}

VIEWER.geoJsonByLayers = {}

VIEWER.geoJsonLayers = {}

VIEWER.locationsClusterLayer =  null

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

//GeoJSON contexts to verify
VIEWER.geojson_contexts = ["https://geojson.org/geojson-ld/geojson-context.jsonld", "http://geojson.org/geojson-ld/geojson-context.jsonld"]

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
 * For supplying latitude/longitude values via the coordinate number inputs.
 * Position the Leaflet map and update the diplayed coordinate text.
 * Note that order matters, so we are specifically saying what is Lat and what is Long.
 */
VIEWER.updateGeometry = function(event) {
    event.preventDefault()
    let lat = clickedLat ? clickedLat : leafLat.value
    lat = parseInt(lat * 1000000) / 1000000
    let long = clickedLong ? clickedLong : leafLong.value
    long = parseInt(long * 1000000) / 1000000
    if (lat && long) {
        VIEWER.mymap.setView([lat, long], 16)
        let coords = `lat: ${leafLat.value}, lon: ${leafLong.value}`
        document.getElementById("currentCoords").innerHTML = `[${coords}]`
    }
    leafLat.value = lat
    leafLong.value = long
}


/**
 * Initialize the application.
 * @param {type} view
 * @return {undefined}
 */
VIEWER.init = async function() {
    let latlong = [12, 12] //default starting coords
    let locationData = await fetch("./data/AllLocations_new.json").then(resp => resp.json()).catch(err => {return {}})
    let specificPeople = await fetch("./data/KastorPeopleNY.json").then(resp => resp.json()).catch(err => {return {}})
    let tax_1798 = await fetch("./data/1798_Tax_Divisions_Merged.json").then(resp => resp.json()).catch(err => {return {}})
    let tax_1814 = await fetch("./data/1814_Districts_Merged.json").then(resp => resp.json()).catch(err => {return {}})
    let stateBoundaries = await fetch("./data/StateBoundaries.json").then(resp => resp.json()).catch(err => {return {}})
    let countyBoundaries = await fetch("./data/CountyBoundaries.json").then(resp => resp.json()).catch(err => {return {}})
    let judicialDistricts = await fetch("./data/judicial_districts.json").then(resp => resp.json()).catch(err => {return {}})
    let judicialCircuits = await fetch("./data/judicial_circuits.json").then(resp => resp.json()).catch(err => {return {}})
    let geoJsonData = []
    let peopleFields = []
    //loadInput.value = "Apply Options"
    let peopleData = []
    let geoJsonByLayers = {}

    // Format FeatureCollections' Features Array so each feature known its _name for filtering.
    tax_1798.features = tax_1798.features.map(f => {
        if(!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = tax_1798._name
        return f
    })
    tax_1814.features = tax_1814.features.map(f => {
        if(!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = tax_1814._name
        return f
    })
    countyBoundaries.features = countyBoundaries.features.map(f => {
        if(!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = countyBoundaries._name
        return f
    })
    stateBoundaries.features = stateBoundaries.features.map(f => {
        if(!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = stateBoundaries._name
        return f
    })
    locationData.features = locationData.features.map(f => {
        if(!f.hasOwnProperty("properties")) f.properties = {}
        f.properties._name = locationData._name
        // Oh no are these really inverted!?!?!  I may need a new copy of this location data
        let tempX = f.geometry.coordinates[0]
        let tempY = f.geometry.coordinates[1]
        f.geometry.coordinates[0] = tempY
        f.geometry.coordinates[1] = tempX
        return f
    })

    specificPeople["_fields"].forEach((element) => {
        peopleFields.push(element["Fied"])
    })
    peopleFields.push("Geocoding ID")

    specificPeople._data.map((item) => {
        const filteredItem = {}
        peopleFields.forEach((field) => {
          if (item.hasOwnProperty(field)) {
            filteredItem[field] = item[field]
          }
        })
        peopleData.push(filteredItem)
    })

    peopleData.sort(function (a, b) {
        return a.GovernmentEmployeeNumber - b.GovernmentEmployeeNumber
    })

    VIEWER.geoJsonByLayers.locations = locationData
    VIEWER.geoJsonByLayers.counties = countyBoundaries
    VIEWER.geoJsonByLayers.states = stateBoundaries
    VIEWER.geoJsonByLayers.tax_1798 = tax_1798
    VIEWER.geoJsonByLayers.tax_1814 = tax_1814

    const locations_without_coordinates = locationData.features.filter(f => f.geometry.coordinates[0] === null || f.geometry.coordinates[1] === null)
    console.warn("The following locations do not have coordinates.  They will not appear on the map.")
    console.log(locations_without_coordinates)

    VIEWER.initializeLeaflet(latlong, "0-12-31") 
}

/**
 * Inititalize a Leaflet Web Map with a standard base map. Give it GeoJSON to draw.
 * In this case, the GeoJSON are all Features takeb from Feature Collections.
 */
VIEWER.initializeLeaflet = async function(coords, userInputDate=null) {
    let selectedControls = null
    let geoMarkers = JSON.parse(JSON.stringify(VIEWER.geoJsonByLayers))
    if(VIEWER.mymap === null){

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
            maxZoom: 19
        })


        VIEWER.baseLayers.USGS_top_streets = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
        })

        VIEWER.baseLayers.Esri_WorldPhysical = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
        });

        VIEWER.baseLayers.Esri_Ocean = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
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

    if(parseInt(userInputDate) > 0){
        VIEWER.userInputDate = userInputDate
        // The user has provided a date and we are redrawing the layers using the loaded base day filtered by the date.
        for(const entry in geoMarkers){
            switch(entry){
                case "locations":
                    geoMarkers[entry].features = geoMarkers[entry].features.filter(f => {
                        // If it does not have a date, should we keep it on the map?  Yes for now.
                        if(!f.properties.hasOwnProperty("Earliest Date") && f.properties.hasOwnProperty("Latest Date")) return true
                        const sDate = new Date(f.properties["Earliest Date"])
                        const eDate = new Date(f.properties["Latest Date"])
                        const currDate = new Date(userInputDate)
                        return sDate <= currDate && eDate >= currDate
                    })
                break
                case "states":
                case "counties":
                    geoMarkers[entry].features = geoMarkers[entry].features.filter(f => {
                        if(!f.properties.hasOwnProperty("START_DATE") && f.properties.hasOwnProperty("END_DATE")) return true
                        const sDate = new Date(f.properties["START_DATE"])
                        const eDate = new Date(f.properties["END_DATE"])
                        const currDate = new Date(userInputDate)
                        return sDate < currDate && eDate >= currDate
                    })
                break
                default:
            }
        }
    }
    else{
        document.getElementById("timeSlider").value = "1832"
        document.getElementById("slider-value").innerHTML = "Year Chosen: N/A"
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
        onEachFeature: VIEWER.formatPopup
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
            // Do something different for feature.properties.STATE_ABBRV === "Capital"
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
            // Do something different for feature.properties.STATE_ABBRV === "Capital"
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
    if(VIEWER.locationsClusterLayer){
        VIEWER.locationsClusterLayer.clearLayers()
        VIEWER.locationsClusterLayer.addLayer(clusters)
    }
    else{
        VIEWER.locationsClusterLayer =  L.markerClusterGroup({
            disableClusteringAtZoom : 7,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true
        })
        VIEWER.locationsClusterLayer.addLayer(clusters)
    }
    
    VIEWER.main_layers = {
        "1798 Tax Districts": VIEWER.geoJsonLayers.taxFeatures1798,
        "1814 Tax Districts": VIEWER.geoJsonLayers.taxFeatures1814,
        "State Boundaries": VIEWER.geoJsonLayers.stateFeatures,
        "County Boundaries": VIEWER.geoJsonLayers.countyFeatures,
        "Specific Locations": VIEWER.geoJsonLayers.locationFeatures,
        "Clustered Locations": VIEWER.locationsClusterLayer
    }

    VIEWER.selectedLayers = [
        VIEWER.baseLayers.mapbox_satellite_layer,
        VIEWER.locationsClusterLayer
    ]

    if(VIEWER.mymap){
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
        VIEWER.mymap.eachLayer(function(layer){
            // Clear the L.GeoJSON layers.  Remember locationsClusterLayer is a layer group.  Clearing and redrawing is handled differently.
            if(layer.hasOwnProperty("feature") && layer.options.className !== "clusterPoint"){
                layer.remove()    
            }
        })
        VIEWER.layerControl = L.control.layers(VIEWER.baseMaps, VIEWER.main_layers).addTo(VIEWER.mymap)
        VIEWER.selectedLayers.forEach(l => {
            if(!l.hasOwnProperty("tiles")) {
                l.addTo(VIEWER.mymap)
            }
        })
    }
    else{
        VIEWER.mymap = L.map('leafletInstanceContainer', {
            center: coords,
            zoom: 2,
            layers: VIEWER.selectedLayers        
        })    
        VIEWER.layerControl = L.control.layers(VIEWER.baseMaps, VIEWER.main_layers).addTo(VIEWER.mymap)
    }
    
    if(parseInt(userInputDate) === 0) VIEWER.mymap.setView([12,12], 2)

    VIEWER.mymap.on("overlayadd", function (event) {
        VIEWER.locationsClusterLayer.bringToFront()
    })

    VIEWER.mymap.on("overlayadd", function (event) {
        VIEWER.locationsClusterLayer.bringToFront()
    })
    
    leafletInstanceContainer.style.backgroundImage = "none"
    loadingMessage.classList.add("is-hidden")
    infoContainer.classList.remove("is-hidden")

}

/**
 * Define what information from each Feature belongs in the popup
 * that appears.  We want to show labels, summaries and thumbnails.
 * 
 * TODO do we want this classic popup mechanic or a more static one like on the OG?
 */
VIEWER.formatPopup = function(feature, layer) {
    function determineStateTitle(feature){
        const datemap = feature?.properties?.STATE_TITLE
        if(!datemap) return null
        const years_in_order = Object.keys(datemap).map(stryear => parseInt(stryear)).sort(function(a, b){return a-b})
        const mostrecent = years_in_order.pop()
        let titleForChosenYear = datemap[mostrecent]
        if(parseInt(VIEWER.userInputDate) > 0){
            titleForChosenYear = null
            for(let i = 0; i<years_in_order.length; i++){
                const prev_year = (i > 0) ? years_in_order[i-1] : years_in_order[i]
                const the_year = years_in_order[i]
                if(the_year === parseInt(VIEWER.userInputDate)){
                    titleForChosenYear = feature.properties.STATE_TITLE[the_year]
                    break
                }
                if(the_year > parseInt(VIEWER.userInputDate)){
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
    let stringToLangMap = {"none":[]}
    if (feature.properties){
        if (feature.properties["Geocoding Location"]) {
            popupContent += `<div class="featureInfo"><label>Name:</label> ${feature.properties["Geocoding Location"]} </div>`
        }
        if (feature.properties["Sector"]) {
            popupContent += `<div class="featureInfo"><label>Sector:</label> ${feature.properties["Sector"]} </div>`
        }
        if (feature.properties["Country"]) {
            popupContent += `<div class="featureInfo"><label>Country:</label> ${feature.properties["Country"]}</div>`
        }
        if (feature.properties["STATE_TITLE"]) {
            const stateTitle = determineStateTitle(feature)
            if(stateTitle){
                popupContent += `<div class="featureInfo"><label>State Title:</label> ${stateTitle} </div> `    
            }
        }
        if (feature.properties["Type"]) {
            popupContent += `<div class="featureInfo"><label>Type:</label> ${feature.properties["Type"]}</div>`
        }
        if(feature.properties["Earliest Date"]){
            popupContent += `<div class="featureInfo"><label>Records Start In:</label> ${feature.properties["Earliest Date"]}</div>`
        }
        else if(feature.properties["START_DATE"]){
            popupContent += `<div class="featureInfo"><label>Records Start In:</label> ${feature.properties["START_DATE"]}</div>`
        }
        if(feature.properties["Latest Date"]){
            popupContent += `<div class="featureInfo"><label>Records End In:</label> ${feature.properties["Latest Date"]}</div>`
        }
        else if(feature.properties["END_DATE"]){
            popupContent += `<div class="featureInfo"><label>Records End In:</label> ${feature.properties["END_DATE"]}</div>`
        }
        if(feature.properties["Earliest Date"]){
            layer.options.startDate = feature.properties["Earliest Date"]
        }
        else if(feature.properties["START_DATE"]){
            layer.options.startDate = feature.properties["START_DATE"]
        }
        if(feature.properties["Latest Date"]){
            layer.options.endDate = feature.properties["Latest Date"]
        }
        else if(feature.properties["END_DATE"]){
            layer.options.endDate = feature.properties["END_DATE"]
        }
        popupContent += `</div>`
        layer.bindPopup(popupContent)
    }
}

VIEWER.getURLParameter = function(variable) {
    var query = window.location.search.substring(1)
    var vars = query.split("&")
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=")
        if (pair[0] == variable) { return pair[1] }
    }
    return (false)
}

// Change the selected date shown to the user.
document.getElementById("timeSlider").addEventListener("input", function (e) {
    document.getElementById("slider-value").innerText = `Year Chosen: ${e.target.value}`
})

// Change the date slider
document.getElementById("timeSlider").addEventListener("change", function (e) {
    // Remove and redraw the layers filtering the data by Start Date and End Date comparison to the slider value.
    var sliderYear = e.target.value + "-12-31"
    const latlong = [12, 12]
    VIEWER.initializeLeaflet(latlong, sliderYear) 
})

// Reset to the default view...maybe just page reset?
document.getElementById("resetView").addEventListener("click", function (e) {
    VIEWER.reset(e)
})

VIEWER.reset = function(event){
    VIEWER.initializeLeaflet([12,12],"0-12-31")
}

VIEWER.init()