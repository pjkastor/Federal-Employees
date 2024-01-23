/* 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 */

let VIEWER = {}

VIEWER.geoJsonByLayers = {}

VIEWER.geoJsonLayers = {}

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
    let locationData = await fetch("./data/AllLocations.json").then(resp => resp.json()).catch(err => {return {}})
    let specificPeople = await fetch("./data/KastorPeopleNY.json").then(resp => resp.json()).catch(err => {return {}})
    let tax_1798 = await fetch("./data/1798_Tax_Divisions_Merged.json").then(resp => resp.json()).catch(err => {return {}})
    let districtBoundaries = await fetch("./data/1814_Districts_Merged.json").then(resp => resp.json()).catch(err => {return {}})
    let tax_1814 = await fetch("./data/CountyBoundaries.json").then(resp => resp.json()).catch(err => {return {}})
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


    // TODO new funtionality prototyping. I want the counties to know their district
    // countyBoundaries.features = countyBoundaries.features.filter(cnty => cnty?.properties?.STATE_TERR === "Pennsylvania")
    // .map(cntyObj => {
    //     cntyObj.properties.districts = judicialDistricts._data.filter(dist => dist.ID === cntyObj.properties.ID)
    //     cntyObj.properties.circuits = judicialCircuits._data.filter(circuit => circuit?.State === "PA")
    //     return cntyObj
    // })

    //  TODO new funtionality prototyping.  I want the states to know their circuit
    // stateBoundaries.features = stateBoundaries.features.filter(state => state?.properties.ABBR_NAME === "PA")
    // .map(stateObj => {
    //     stateObj.properties.circuits = judicialCircuits._data.filter(circuit => circuit?.State === stateObj.properties.ABBR_NAME)
    //     return stateObj
    // })

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
    VIEWER.initializeLeaflet(latlong, 0) 
}

/**
 * Inititalize a Leaflet Web Map with a standard base map. Give it GeoJSON to draw.
 * In this case, the GeoJSON are all Features takeb from Feature Collections.
 */
VIEWER.initializeLeaflet = async function(coords, userInputDate=null) {
    let selectedControls = null
    let geoMarkers = VIEWER.geoJsonByLayers
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

        VIEWER.baseLayers.esri_street = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
        })

        VIEWER.baseLayers.esri_natgeo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
        })

        VIEWER.baseLayers.topomap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        })

        VIEWER.baseLayers.carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        })

        VIEWER.baseLayers.USGS_top_streets = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
        })

        VIEWER.baseMaps = {
            "OpenStreetMap": VIEWER.baseLayers.osm,
            "CartoDB": VIEWER.baseLayers.carto,
            "ESRI Street" : VIEWER.baseLayers.esri_street,
            "ESRI NatGeo" : VIEWER.baseLayers.esri_natgeo,
            "Open Topomap": VIEWER.baseLayers.topomap,
            "USGS Topo + Street": VIEWER.baseLayers.USGS_top_streets,
            "Mapbox Satellite": VIEWER.baseLayers.mapbox_satellite_layer
        }        
    }

    if(userInputDate){
        // The user has provided a date and we are redrawing the layers using the loaded base day filtered by the date.
        geoMarkers = JSON.parse(JSON.stringify(VIEWER.geoJsonByLayers))
        for(const entry in geoMarkers){
            switch(entry){
                case "locations":
                    geoMarkers[entry].features = geoMarkers[entry].features.filter(f => {
                        // If it does not have a date, should we keep it on the map?  Yes for now.
                        if(!f.properties.hasOwnProperty("Earliest Record") && f.properties.hasOwnProperty("Latest Record")) return true
                        const sDate = new Date(f.properties["Earliest Record"])
                        const eDate = new Date(f.properties["Latest Record"])
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
    
    VIEWER.main_layers = {
        "1798 Tax Districts": VIEWER.geoJsonLayers.taxFeatures1798,
        "1814 Tax Districts": VIEWER.geoJsonLayers.taxFeatures1814,
        "State Boundaries": VIEWER.geoJsonLayers.stateFeatures,
        "County Boundaries": VIEWER.geoJsonLayers.countyFeatures,
        "Specific Locations": VIEWER.geoJsonLayers.locationFeatures
    }

    VIEWER.selectedLayers = [
        VIEWER.baseLayers.mapbox_satellite_layer,
        VIEWER.geoJsonLayers.locationFeatures
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
            if(layer.hasOwnProperty("feature")){
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
    
    VIEWER.mymap.on("overlayadd", function (event) {
      VIEWER.geoJsonLayers.locationFeatures.bringToFront()
    })

    VIEWER.mymap.on("overlayadd", function (event) {
      VIEWER.geoJsonLayers.locationFeatures.bringToFront()
    })
    
    leafletInstanceContainer.style.backgroundImage = "none"
    loadingMessage.classList.add("is-hidden")
    infoContainer.classList.remove("is-hidden")

    // TODO implement some clustering mechanism for AllLocations
}

/**
 * Define what information from each Feature belongs in the popup
 * that appears.  We want to show labels, summaries and thumbnails.
 * 
 * TODO do we want this classic popup mechanic or a more static one like on the OG?
 */
VIEWER.formatPopup = function(feature, layer) {
    let popupContent = "<div class='featureInfo'>"
    let i = 0
    let langs = []
    let stringToLangMap = {"none":[]}
    if (feature.properties){
        if (feature.properties["Geocoding Location"]) {
            popupContent += `<b>${feature.properties["Geocoding Location"]}</b> <br>`
        }
        if (feature.properties["State"]) {
            popupContent += `${feature.properties["State"]}, `
        }
        if (feature.properties["Country"]) {
            popupContent += `${feature.properties["Country"]}`
        }
        if(feature.properties["Earliest Record"]){
            layer.options.startDate = feature.properties["Earliest Record"] + "-12-31"
        }
        else if(feature.properties["START_DATE"]){
            layer.options.startDate = feature.properties["START_DATE"]
        }
        if(feature.properties["Latest Record"]){
            layer.options.endDate = feature.properties["Latest Record"] + "-12-31"
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

// html functions to change time
document.getElementById("timeSlider").addEventListener("input", function (e) {
    document.getElementById("slider-value").innerText = e.target.value
})

document.getElementById("timeSlider").addEventListener("change", function (e) {
    // Remove and redraw the layers filtering the data by Start Date and End Date comparison to the slider value.
    var sliderYear = e.target.value + "-12-31"
    const latlong = [12, 12]
    VIEWER.initializeLeaflet(latlong, sliderYear) 
})

VIEWER.init()