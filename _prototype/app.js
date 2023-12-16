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
    let geos = []
    let resource = {}
    // TODO get all the local Feature Collections and Features data and play it into this array to pass forward. 
    let geoJsonData = []
    loadInput.value = "Apply Options"
    let formattedGeoJsonData = geoJsonData.flat(1) //AnnotationPages and FeatureCollections cause arrays in arrays.  
    //Abstracted.  Maybe one day you want to VIEWER.initializeOtherWebMap(latlong, allGeos)
    VIEWER.initializeLeaflet(latlong, formattedGeoJsonData)
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

    VIEWER.mymap = L.map('leafletInstanceContainer', {
        center: coords,
        zoom: 2,
        layers: [osm, esri_street, topomap, mapbox_satellite_layer]
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
    let layerControl = L.control.layers(baseMaps, {}).addTo(VIEWER.mymap)

    // let overlayMaps = {
    //     "Cities": osm,
    //     "Streets": esri_street,
    //     "Satellite" : mapbox_satellite_layer,
    //     "Topography" : topomap
    // };
    //var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(VIEWER.mymap)

    let appColor = "#008080"
    L.geoJSON(geoMarkers, {
            pointToLayer: function(feature, latlng) {
                let __fromResource = feature.properties.__fromResource ?? ""
                switch (__fromResource) {
                    case "Type 1":
                        appColor = "blue"
                        break
                    case "Type 2":
                        appColor = "purple"
                        break
                    case "Type 3":
                        appColor = "yellow"
                        break
                    case "Type 4":
                        appColor = "#008080"
                        break
                    case "Type 5":
                        appColor = "#005A9C"
                    break
                    default:
                        appColor = "red"
                }
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: appColor,
                    color: appColor,
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 1
                })
            },
            style: function(feature) {
                let __fromResource = feature.properties.__fromResource ?? ""
                switch (__fromResource) {
                    case "Type 1":
                        appColor = "blue"
                        break
                    case "Type 2":
                        appColor = "purple"
                        break
                    case "Type 3":
                        appColor = "yellow"
                        break
                    case "Type 4":
                        appColor = "#008080"
                        break
                    case "Type 5":
                        appColor = "#005A9C"
                    break
                    default:
                        appColor = "red"
                }
                const ft = feature.geometry.type ?? feature.geometry["@type"] ?? "Yikes"
                if (ft !== "Point") {
                    return {
                        color: appColor,
                        fillColor: appColor,
                        fillOpacity: 0.09
                    }
                }
            },
            onEachFeature: VIEWER.formatPopup
        })
        .addTo(VIEWER.mymap)
    leafletInstanceContainer.style.backgroundImage = "none"
    loadingMessage.classList.add("is-hidden")
}

/**
 * Define what information from each Feature belongs in the popup
 * that appears.  We want to show labels, summaries and thumbnails.
 */
VIEWER.formatPopup = function(feature, layer) {
    let popupContent = ""
    let i = 0
    let langs = []
    let stringToLangMap = {"none":[]}
    if (feature.properties){
        if (feature.properties.thumbnail) {
            let thumbnail = feature.properties.thumbnail[0].id ?? feature.properties.thumbnail[0]["@id"] ?? ""
            popupContent += `<img src="${thumbnail}"\></br>`
        }
        if (feature.properties.option1) {
            let manifestURI = feature.properties.option1 ?? ""
            popupContent += `<a href="https://projectmirador.org/embed/?data-param=${manifestURI}" target="_blank"><img src="https://www.qdl.qa/sites/all/themes/QDLTheme/css/img/logo_mirador.png"/></a>`
            popupContent += `<a href="https://uv-v3.netlify.app/#?c=&m=&s=&cv=&manifest=${manifestURI}" target="_blank"><img src="https://www.qdl.qa/sites/all/themes/QDLTheme/css/img/logo_uv.png"/></a>`
        }
        if (feature.properties.option2) {
            let annoURI = feature.properties.option2 ?? ""
            popupContent += `
                <div class="featureInfo">
                    <b>Some label or description.</b>
                </div>
            `
        }
        layer.bindPopup(popupContent)
    }
}

VIEWER.getURLParameter = function(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return pair[1]; }
    }
    return (false);
}

VIEWER.init()