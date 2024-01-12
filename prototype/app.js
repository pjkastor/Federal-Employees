/* 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 */

let VIEWER = {}

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
VIEWER.mymap = {}

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
    geoJsonByLayers.locations = locationData
    geoJsonByLayers.counties = countyBoundaries
    geoJsonByLayers.states = stateBoundaries
    geoJsonByLayers.tax_1798 = tax_1798
    geoJsonByLayers.tax_1814 = tax_1814
    VIEWER.initializeLeaflet(latlong, geoJsonByLayers) 
}

/**
 * Inititalize a Leaflet Web Map with a standard base map. Give it GeoJSON to draw.
 * In this case, the GeoJSON are all Features takeb from Feature Collections.
 */
VIEWER.initializeLeaflet = async function(coords, geoMarkers) {
    let mapbox_satellite_layer=
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGhlaGFiZXMiLCJhIjoiY2pyaTdmNGUzMzQwdDQzcGRwd21ieHF3NCJ9.SSflgKbI8tLQOo2DuzEgRQ', {
        maxZoom: 19,
        id: 'mapbox.satellite', //mapbox.streets
        accessToken: 'pk.eyJ1IjoidGhlaGFiZXMiLCJhIjoiY2pyaTdmNGUzMzQwdDQzcGRwd21ieHF3NCJ9.SSflgKbI8tLQOo2DuzEgRQ'
    })

    let osm = 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    })

    let esri_street = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
    })
    let esri_natgeo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
    })

    let topomap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    })

    let carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    })

    let USGS_top_streets = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
    })

    let baseMaps = {
        "OpenStreetMap": osm,
        "CartoDB": carto,
        "ESRI Street" : esri_street,
        "ESRI NatGeo" : esri_natgeo,
        "Open Topomap": topomap,
        "USGS Topo + Street": USGS_top_streets,
        "Mapbox Satellite": mapbox_satellite_layer
    }

    const stateFeatures = L.geoJSON(geoMarkers.states, {
        style: function(feature) {
            let name = feature.properties._name ?? ""
            return {
                color: "#005A9C",
                fillColor: "#005A9C",
                fillOpacity: 0.00,
                className: name
            }
        },
        onEachFeature: VIEWER.formatPopup
    })

    const countyFeatures = L.geoJSON(geoMarkers.counties, {
        style: function(feature) {
            let name = feature.properties._name ?? ""
            return {
                color: "#008080",
                fillColor: "#008080",
                fillOpacity: 0.00,
                className: name
            }
        },
        onEachFeature: VIEWER.formatPopup
    })

    const taxFeatures1798 = L.geoJSON(geoMarkers.tax_1798, {
        style: function(feature) {
            let name = feature.properties._name ?? ""
            return {
                color: "blue",
                fillColor: "blue",
                fillOpacity: 0.00,
                className: name
            }
        },
        onEachFeature: VIEWER.formatPopup
    })

    const taxFeatures1814 = L.geoJSON(geoMarkers.tax_1814, {
        style: function(feature) {
            let name = feature.properties._name ?? ""
            return {
                color: "purple",
                fillColor: "purple",
                fillOpacity: 0.00,
                className: name
            }
        },
        onEachFeature: VIEWER.formatPopup
    })

    const locationFeatures = geoMarkers.locations.features.map(f =>{
        const name = f.properties._name ?? ""
        return L.circleMarker(f.geometry.coordinates, {
            radius: 6,
            fillColor: "yellow",
            color: "yellow",
            weight: 1,
            opacity: 1,
            fillOpacity: 1,
            className: name
        })
    })
    
    const locationsLayer = L.layerGroup(locationFeatures)

    let main_layers = {
        "State Boundaries": stateFeatures,
        "County Boundaries": countyFeatures,
        "1814 Tax Districts": taxFeatures1814,
        "1798 Tax Disctricts": taxFeatures1798,
        "Specific Locations": locationsLayer
    }
    VIEWER.mymap = L.map('leafletInstanceContainer', {
        center: coords,
        zoom: 2,
        layers: [
            osm, 
            esri_street, 
            topomap, 
            mapbox_satellite_layer, 
            stateFeatures, 
            countyFeatures, 
            locationsLayer, 
            taxFeatures1798, 
            taxFeatures1814
        ]
    })
    let layerControl = L.control.layers(baseMaps, main_layers).addTo(VIEWER.mymap)
    leafletInstanceContainer.style.backgroundImage = "none"
    loadingMessage.classList.add("is-hidden")


    // TODO set the initial view by applying an initial filter.
    /*
    var originalCountyData = {
      ...vis.data[1], // Spread the existing object properties
      features: vis.data[1].features.filter(function (d) {
        var sDate = new Date(d.properties["START_DATE"]);
        var eDate = new Date(d.properties["END_DATE"]);
        var currDate = new Date("1811-12-31");
        var bool = sDate < currDate && eDate >= currDate;
        return bool;
      }), // Filter the array based on a condition
    };
    var originalStateData = {
      ...vis.data[2], // Spread the existing object properties
      features: vis.data[2].features.filter(function (d) {
        var sDate = new Date(d.properties["START_DATE"]);
        var eDate = new Date(d.properties["END_DATE"]);
        var currDate = new Date("1811-12-31");
        var bool = sDate < currDate && eDate >= currDate;
        return bool;
      }), // Filter the array based on a condition
    };
    var originalLocData = {
      ...vis.data[0],
      features: vis.data[0].features.filter(function (d) {
        var bool = false;
        if (
          !isNaN(d.properties["Earliest Record"]) ||
          !isNaN(d.properties["Latest Record"])
        ) {
          bool =
            d.properties["Earliest Record"] <= 1811 &&
            d.properties["Latest Record"] >= 1811;
        }
        return bool;
      }),
    };
    */
    // TODO add some kind of fill toggling to allow for "border only" views (per layer?)

    // TODO implement some clustering mechanism for AllLocations


}

/**
 * Define what information from each Feature belongs in the popup
 * that appears.  We want to show labels, summaries and thumbnails.
 * 
 * TODO do we want this classic popup mechanic or a more static one like on the OG?
 */
VIEWER.formatPopup = function(feature, layer) {
    let popupContent = "<div id = 'locPopup'><h5>"
    let i = 0
    let langs = []
    let stringToLangMap = {"none":[]}
    if (feature.properties){
        if (feature.properties["Geocoding Location"]) {
            popupContent += `${feature.properties["Geocoding Location"]}, <br>"`
        }
        if (feature.properties["State"]) {
            popupContent += `${feature.properties["State"]} ", "`
        }
        if (feature.properties["Country"]) {
            popupContent += `${feature.properties["Country"]} ", "`
        }
        if (feature.properties.option2) {
            let annoURI = feature.properties.option2 ?? ""
            popupContent += `
                <div class="featureInfo">
                    <b>Some label or description.</b>
                </div>
            `
        }
        popupContent += `</h5></div>`
        layer.options.start = "1888"
        layer.options.end = "1999"
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

VIEWER.init()