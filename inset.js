/* 
 * Script to power the inset Leaflet map.
 *
 * @author Bryan Haberberger
 * https://habesoftware.rocks
 */

let VIEWER = {}

VIEWER.once = true

VIEWER.rawGeoJSONData = {}

VIEWER.leafletFormattedGeoJsonLayers = {}

VIEWER.locationsClusterLayerGroup = null

VIEWER.main_layers = null

VIEWER.layerControl = null

VIEWER.selectedLayers = []

VIEWER.baseLayers = {}

VIEWER.baseLayers.mapbox_satellite_layer = null

VIEWER.baseLayers.Esri_WorldPhysical = null

VIEWER.baseLayers.Esri_Ocean = null

VIEWER.baseMaps = null

//For Leaflet
VIEWER.mymap = null

//Keep track of the date chosen by the user.
VIEWER.userInputYear = "1829"

//Starting Zoom
VIEWER.startZoom = 2

//Starting Coords
VIEWER.startCoords = [21, 30]

// Starting Viewport Boundary
VIEWER.startBounds = [
    [-39.23225314171489, -176.484375],
    [74.01954331150228, 157.50000000000003]
]

VIEWER.currentZoomLevel = VIEWER.startZoom

VIEWER.cluster_points = null

VIEWER.cluster_icons = null

const loadingMessage = document.querySelector(".loadingMessage")
const kastorMapLegend = document.querySelector(".kastorMapLegend")
const heatmapLegend = document.querySelector(".heatmapLegend")
const datelessView = document.querySelector(".datelessView")
/**
 * All geography is loaded and the interface is ready to show.  Paginate by hiding the 'loading' UI
 */
document.addEventListener("KastorLeafletInitialized", event => {
    loadingMessage.classList.add("is-hidden")
    loadingMessage.innerHTML = `Arranging Map Data...<br>`
    datelessView.classList.remove("is-hidden")
    document.querySelector(".slider-container").classList.remove("is-hidden")
    kastorLeafletInstanceContainer.style.backgroundImage = "none"
    kastorLeafletInstanceContainer.querySelector(".leaflet-map-pane").classList.remove("is-hidden")
    kastorLeafletInstanceContainer.querySelector(".leaflet-control-container").classList.remove("is-hidden")
    kastorMapLegend.classList.remove("is-hidden")
    VIEWER.layerControl._container.querySelectorAll("input[type='checkbox']").forEach(chk => {
        if (chk.nextElementSibling.innerText.trim() === "Postmaster Heatmap" && chk.checked)
            heatmapLegend.classList.remove("is-hidden")
    })
    kastorLeafletInstanceContainer.classList.add("has-loaded")
    if (VIEWER.once) VIEWER.showGreeting()
    VIEWER.once = false
})

/**
 * Change out the points for the icons at a specific zoom level.
 */
VIEWER.iconsAtZoomLevel = function(oldlevel, newlevel) {
    if (!VIEWER.mymap) return
    if (!oldlevel || !newlevel) return
    const maxZoom = VIEWER.mymap.getMaxZoom()
    const zoomInScenario = (newlevel > oldlevel)
    VIEWER.locationsClusterLayerGroup.clearLayers()
    if (newlevel >= 8) {
        // Hide the cluster points and show the cluster icons
        VIEWER.locationsClusterLayerGroup.addLayer(VIEWER.cluster_icons)
    } else {
        // Show the cluster points and hide the cluster icons
        VIEWER.locationsClusterLayerGroup.addLayer(VIEWER.cluster_points)
    }
}

/**
 * Initialize the application.
 * @param {type} view
 * @return {undefined}
 */
VIEWER.init = async function() {
    let [
        locationData,
        tax_1798,
        tax_1814,
        stateBoundaries,
        al_1819_district,
        al_1824_district,
        ct_district,
        dc_district,
        de_district,
        ga_district,
        il_district,
        in_district,
        ky_district,
        la_1804_district,
        la_1812_district,
        la_1823_district,
        ma_district,
        md_district,
        me_district,
        mi_district,
        mo_district,
        ms_district,
        nc_1789_district,
        nc_1800_district,
        nh_district,
        nj_district,
        ny_1789_district,
        ny_1814_district,
        ny_1823_district,
        oh_district,
        pa_1789_district,
        pa_1818_district,
        pa_1823_district,
        ri_district,
        sc_1789_district,
        tn_1797_district,
        tn_1802_district,
        va_1789_district,
        va_1819_district,
        va_1824_district,
        vt_district,
        first_circuit_1789,
        first_circuit_1790,
        first_circuit_1791,
        first_circuit_1800,
        first_circuit_1802,
        first_circuit_1807,

        second_circuit_1789,
        second_circuit_1800,

        third_circuit_1790,
        third_circuit_1800,
        third_circuit_1802,

        fourth_circuit_1800,
        fourth_circuit_1802,

        fifth_circuit_1800,
        fifth_circuit_1802,

        sixth_circuit_1800,
        sixth_circuit_1802,

        seventh_circuit_1807,

        dc_circuit
    ] = await Promise.all([
        fetch("./data/AllLocations.json", { "cache": "default" }).then(resp => resp.json()).catch(err => { return {} }),
        fetch("./data/1798_Tax_Divisions_Merged.json", { "cache": "default" }).then(resp => resp.json()).catch(err => { return {} }),
        fetch("./data/1814_Districts_Merged.json", { "cache": "default" }).then(resp => resp.json()).catch(err => { return {} }),
        fetch("./data/StateBoundaries.json", { "cache": "default" }).then(resp => resp.json()).catch(err => { return {} }),
        fetch("./data/judicial_districts/AL_1819_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/AL_1824_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/CT_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/DC_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/DE_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/GA_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/IL_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/IN_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/KY_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/LA_1804_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/LA_1812_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/LA_1823_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/MA_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/MD_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/ME_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/MI_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/MO_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/MS_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/NC_1789_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/NC_1800_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/NH_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/NJ_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/NY_1789_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/NY_1814_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/NY_1818_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/OH_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/PA_1789_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/PA_1818_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/PA_1823_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/RI_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/SC_1789_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/TN_1797_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/TN_1802_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/VA_1789_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/VA_1819_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/VA_1824_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_districts/VT_district.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),

        fetch("./data/judicial_circuits/First_Circuit_1789.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/First_Circuit_1790.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/First_Circuit_1791.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/First_Circuit_1800.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/First_Circuit_1802.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/First_Circuit_1807.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),

        fetch("./data/judicial_circuits/Second_Circuit_1789.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/Second_Circuit_1800.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),

        fetch("./data/judicial_circuits/Third_Circuit_1790.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/Third_Circuit_1800.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/Third_Circuit_1802.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),

        fetch("./data/judicial_circuits/Fourth_Circuit_1800.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/Fourth_Circuit_1802.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),

        fetch("./data/judicial_circuits/Fifth_Circuit_1800.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/Fifth_Circuit_1802.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),

        fetch("./data/judicial_circuits/Sixth_Circuit_1800.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),
        fetch("./data/judicial_circuits/Sixth_Circuit_1802.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),

        fetch("./data/judicial_circuits/Seventh_Circuit_1807.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} }),

        fetch("./data/judicial_circuits/DC_Circuit.geojson", { "cache": "default" }).then(resp => resp.json()).then(j => j.features).catch(err => { return {} })
    ])

    let judicial_districts = {
        "__name": "judicial_districts",
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
            ...oh_district,
            ...pa_1823_district,
            ...ri_district,
            ...sc_1789_district,
            ...tn_1797_district,
            ...tn_1802_district,
            ...va_1789_district,
            ...va_1819_district,
            ...va_1824_district,
            ...vt_district
        ]
    }
    let judicial_circuits = {
        "__name": "judicial_circuits",
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
    let geoJsonData = []
    let peopleFields = []
    let peopleData = []
    let geoJsonByLayers = {}

    VIEWER.rawGeoJSONData.judicial_districts = judicial_districts
    VIEWER.rawGeoJSONData.judicial_circuits = judicial_circuits

    VIEWER.rawGeoJSONData.locations = locationData
    VIEWER.rawGeoJSONData.states = stateBoundaries
    VIEWER.rawGeoJSONData.tax_1798 = tax_1798
    VIEWER.rawGeoJSONData.tax_1814 = tax_1814

    // const locations_without_coordinates = locationData.features.filter(f => f.geometry.coordinates[0] === null || f.geometry.coordinates[1] === null)
    // console.warn("The following locations do not have coordinates.  They will not appear on the map.")
    // console.log(locations_without_coordinates)

    VIEWER.initializeLeaflet(VIEWER.startCoords, "1829")
}

/**
 * Inititalize a Leaflet Web Map with a standard base map. Give it GeoJSON to draw.
 * In this case, the GeoJSON are all Features takeb from Feature Collections.
 */
VIEWER.initializeLeaflet = async function(coords, userInputYear = "0") {
    let selectedControls = null
    if (VIEWER.mymap === null) {

        VIEWER.baseLayers.mapbox_satellite_layer =
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGhlaGFiZXMiLCJhIjoiY2pyaTdmNGUzMzQwdDQzcGRwd21ieHF3NCJ9.SSflgKbI8tLQOo2DuzEgRQ', {
                maxZoom: 19,
                minZoom: VIEWER.startZoom,
                id: 'mapbox.satellite', //mapbox.streets
                accessToken: 'pk.eyJ1IjoidGhlaGFiZXMiLCJhIjoiY2pyaTdmNGUzMzQwdDQzcGRwd21ieHF3NCJ9.SSflgKbI8tLQOo2DuzEgRQ'
            })

        VIEWER.baseLayers.Esri_WorldPhysical = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 8,
            minZoom: VIEWER.startZoom
        })

        VIEWER.baseLayers.Esri_Ocean = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 10,
            minZoom: VIEWER.startZoom
        })

        VIEWER.baseMaps = {
            "Mapbox Satellite": VIEWER.baseLayers.mapbox_satellite_layer,
            "ESRI World Physical": VIEWER.baseLayers.Esri_WorldPhysical,
            "ESRI Ocean": VIEWER.baseLayers.Esri_Ocean
        }
    } else {
        // Prepare for 'loading' modal and pagination
        kastorLeafletInstanceContainer.querySelector(".leaflet-map-pane").classList.add("is-hidden")
        kastorLeafletInstanceContainer.querySelector(".leaflet-control-container").classList.add("is-hidden")
        document.querySelector(".slider-container").classList.add("is-hidden")
        datelessView.classList.add("is-hidden")
        kastorLeafletInstanceContainer.style.backgroundImage = "url(./images/earth.gif)"
        loadingMessage.classList.remove("is-hidden")
        kastorMapLegend.classList.add("is-hidden")
        heatmapLegend.classList.add("is-hidden")
    }

    setTimeout(function() {
        let geoMarkers = {}
        if (parseInt(userInputYear) > 0) {
            VIEWER.userInputYear = userInputYear
            // The user has provided a date and we are redrawing the layers using the loaded base day filtered by the date.
            for (const entry in VIEWER.rawGeoJSONData) {
                switch (entry) {
                    case "locations":
                    case "judicial_districts":
                    case "judicial_circuits":
                        geoMarkers[entry] = JSON.parse(JSON.stringify(VIEWER.rawGeoJSONData[entry]))
                        geoMarkers[entry].features = geoMarkers[entry].features.filter(f => {
                            if (f.properties?.hasOwnProperty("Start_Date") && f.properties?.hasOwnProperty("End_Date")) {
                                // These are all just years but that should be OK
                                const sDate = new Date(parseInt(f.properties["Start_Date"]) + "")
                                const eDate = new Date(parseInt(f.properties["End_Date"]) + "")
                                const currEnd = new Date(userInputYear)
                                const currStart = new Date(userInputYear)
                                return sDate <= currStart && eDate >= currEnd
                            }
                        })
                        break
                    case "states":
                        geoMarkers[entry] = JSON.parse(JSON.stringify(VIEWER.rawGeoJSONData[entry]))
                        geoMarkers[entry].features = geoMarkers[entry].features.filter(f => {
                            const count = VIEWER.determineEmployeeCount(f)
                            if (f.properties?.hasOwnProperty("START_DATE") && f.properties?.hasOwnProperty("END_DATE")) {
                                const sDate = new Date(parseInt(f.properties["START_DATE"]) + "")
                                const eDate = new Date(parseInt(f.properties["END_DATE"]) + "")
                                const currEnd = new Date(userInputYear)
                                const currStart = new Date(userInputYear)
                                return sDate <= currStart && eDate >= currEnd && parseInt(count) && parseInt(count) > -1
                            }
                        })
                        break
                    default:
                        geoMarkers[entry] = VIEWER.rawGeoJSONData[entry]
                }
            }
        } else {
            geoMarkers = VIEWER.rawGeoJSONData
            document.querySelector(".timeSlider").value = "0"
            document.querySelector(".slider-value").innerText = "N/A"
        }

        VIEWER.leafletFormattedGeoJsonLayers.statePostmastersFeatures = L.geoJSON(geoMarkers.states, {
            style: function(feature) {
                const count = VIEWER.determineEmployeeCount(feature)

                function getColor(d) {
                    d = parseInt(d)
                    const color =
                        d > 800 ? '#800026' :
                        d > 600 ? '#BD0026' :
                        d > 400 ? '#E31A1C' :
                        d > 200 ? '#FC4E2A' :
                        d > 100 ? '#FD8D3C' :
                        d > 50 ? '#FEB24C' :
                        d > 20 ? '#FED976' :
                        d > 0 ? '#FFEDA0' :
                        "white"
                    return color
                }

                const name = feature.properties?._name ?? ""
                const fcolor = getColor(count)
                const style_obj = {
                    fillColor: fcolor,
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 1,
                    className: name.replaceAll(" ", "_")
                }
                return style_obj
            },
            onEachFeature: VIEWER.formatPopupForNewberryData
        })

        // VIEWER.leafletFormattedGeoJsonLayers.countyFeatures = L.geoJSON(geoMarkers.counties, {
        //     style: function(feature) {
        //         const name = feature.properties?._name ?? ""
        //         return {
        //             color: "white",
        //             fillColor: "#3399ff",
        //             fillOpacity: 1.00,
        //             className: name.replaceAll(" ", "_")
        //         }
        //     },
        //     onEachFeature: VIEWER.formatPopupForNewberryData
        // })

        // VIEWER.leafletFormattedGeoJsonLayers.countyPostmastersFeatures = L.geoJSON(geoMarkers.counties, {
        //     style: function(feature) {
        //         const count = VIEWER.determineEmployeeCount(feature)
        //         function getColor(d) {
        //             d = parseInt(d)
        //             const color = 
        //                d > 35  ? '#800026' :
        //                d > 30  ? '#BD0026' :
        //                d > 25  ? '#E31A1C' :
        //                d > 20  ? '#FC4E2A' :
        //                d > 15  ? '#FD8D3C' :
        //                d > 10  ? '#FEB24C' :
        //                d > 5   ? '#FED976' :
        //                d > 0   ? '#FFEDA0' : 
        //                "white"
        //             return color
        //         }

        //         const name = feature.properties?._name ?? ""
        //         const fcolor = getColor(count)
        //         const style_obj = 
        //         {
        //             fillColor: fcolor,
        //             weight: 2,
        //             opacity: 1,
        //             color: 'white',
        //             dashArray: '3',
        //             fillOpacity: 0.7,
        //             className: name.replaceAll(" ", "_")
        //         }
        //         return style_obj
        //     },
        //     onEachFeature: VIEWER.formatPopupForNewberryData
        // })

        VIEWER.leafletFormattedGeoJsonLayers.judicial_districts = L.geoJSON(geoMarkers.judicial_districts, {
            style: function(feature) {
                const name = feature.properties?._name ?? ""
                return {
                    color: "white",
                    fillColor: "#4d4dff",
                    fillOpacity: 1.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopupForKastorData
        })

        VIEWER.leafletFormattedGeoJsonLayers.judicial_circuits = L.geoJSON(geoMarkers.judicial_circuits, {
            style: function(feature) {
                const name = feature.properties["Geocoding_Location"] ?? ""

                return {
                    color: "white",
                    fillColor: "#990000",
                    fillOpacity: 1.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopupForKastorData
        })

        VIEWER.leafletFormattedGeoJsonLayers.taxFeatures1798 = L.geoJSON(geoMarkers.tax_1798, {
            style: function(feature) {
                const name = feature.properties?._name ?? ""
                return {
                    color: "white",
                    fillColor: "#ff9933",
                    fillOpacity: 1.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopupForKastorData
        })

        VIEWER.leafletFormattedGeoJsonLayers.taxFeatures1814 = L.geoJSON(geoMarkers.tax_1814, {
            style: function(feature) {
                const name = feature.properties?._name ?? ""
                return {
                    color: "white",
                    fillColor: "#ffcc66",
                    fillOpacity: 1.00,
                    className: name.replaceAll(" ", "_")
                }
            },
            onEachFeature: VIEWER.formatPopupForKastorData
        })

        VIEWER.leafletFormattedGeoJsonLayers.locationFeatures = L.geoJSON(geoMarkers.locations, {
            pointToLayer: function(feature, latlng) {
                const name = feature.properties?._name ?? ""

                // Make the Capital a 'star' Icon
                if (feature.properties?.State_Abbreviated === "Capital") {
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
                switch (type) {
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
                if (icon) {
                    return L.marker(latlng, { "icon": icon })
                } else {
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
            onEachFeature: VIEWER.formatPopupForKastorData
        })

        VIEWER.cluster_points = L.geoJSON(geoMarkers.locations, {
            pointToLayer: function(feature, latlng) {
                const name = feature.properties?._name ?? ""

                if (feature.properties?.State_Abbreviated === "Capital") {
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
            onEachFeature: VIEWER.formatPopupForKastorData
        })

        VIEWER.cluster_icons = L.geoJSON(geoMarkers.locations, {
            pointToLayer: function(feature, latlng) {
                const name = feature.properties?._name ?? ""

                // Make the Capital a 'star' Icon
                if (feature.properties?.State_Abbreviated === "Capital") {
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
                switch (type) {
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
                if (icon) {
                    return L.marker(latlng, { "icon": icon })
                } else {
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
            onEachFeature: VIEWER.formatPopupForKastorData
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
        if (VIEWER.currentZoomLevel >= 8) {
            // Hide the cluster points and show the cluster icons
            VIEWER.locationsClusterLayerGroup.addLayer(VIEWER.cluster_icons)
        } else {
            // Show the cluster points and hide the cluster icons
            VIEWER.locationsClusterLayerGroup.addLayer(VIEWER.cluster_points)
        }

        VIEWER.main_layers = {
            "1798 Tax Districts": VIEWER.leafletFormattedGeoJsonLayers.taxFeatures1798,
            "1814 Tax Districts": VIEWER.leafletFormattedGeoJsonLayers.taxFeatures1814,
            "Judicial Districts": VIEWER.leafletFormattedGeoJsonLayers.judicial_districts,
            "Judicial Circuits": VIEWER.leafletFormattedGeoJsonLayers.judicial_circuits,
            "Postmaster Heatmap": VIEWER.leafletFormattedGeoJsonLayers.statePostmastersFeatures,
            //"Counties" : VIEWER.leafletFormattedGeoJsonLayers.countyFeatures,
            //"Postmasters Heatmap - County": VIEWER.leafletFormattedGeoJsonLayers.countyPostmastersFeatures,
            "Individual Locations": VIEWER.leafletFormattedGeoJsonLayers.locationFeatures,
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
            VIEWER.mymap = L.map('kastorLeafletInstanceContainer', {
                center: coords,
                zoomControl: false,
                zoom: VIEWER.startZoom,
                attributionControl: false,
                layers: VIEWER.selectedLayers
            })
            VIEWER.layerControl = L.control.layers(VIEWER.baseMaps, VIEWER.main_layers).addTo(VIEWER.mymap)
            VIEWER.mymap.addControl(L.control.zoom({ position: 'bottomright' }))
            VIEWER.mymap.fitBounds(VIEWER.startBounds)
            const zoomNotice = document.createElement("a")
            zoomNotice.classList.add("zoomNotice")
            const span = document.createElement("span")
            span.innerText = "zoom"
            zoomNotice.appendChild(span)
            VIEWER.mymap._container.querySelector(".leaflet-control-zoom-in").after(zoomNotice)
        }

        // Can only show State and County boundaries if a year is selected.  Hide these options until then.
        if (parseInt(userInputYear) <= 0) {
            VIEWER.mymap.fitBounds(VIEWER.startBounds)
            VIEWER.layerControl._container.querySelectorAll("input[type='checkbox']").forEach(chk => {
                if (
                    chk.nextElementSibling.innerText.trim() === "Counties" ||
                    chk.nextElementSibling.innerText.trim() === "Postmasters Heatmap" ||
                    chk.nextElementSibling.innerText.trim() === "Postmaster Heatmap"
                ) {
                    if (chk.checked) chk.click()
                    chk.parentElement.classList.add("is-hidden")
                } else if (
                    chk.nextElementSibling.innerText.trim() === "Individual Locations" ||
                    chk.nextElementSibling.innerText.trim() === "1814 Tax Districts" ||
                    chk.nextElementSibling.innerText.trim() === "1798 Tax Districts" ||
                    chk.nextElementSibling.innerText.trim() === "Judicial Districts" ||
                    chk.nextElementSibling.innerText.trim() === "Judicial Circuits"
                ) {
                    if (chk.checked) chk.click()
                } else if (chk.nextElementSibling.innerText.trim() === "Clustered Locations") {
                    if (!chk.checked) chk.click()
                }
            })
        } else {
            VIEWER.layerControl._container.querySelectorAll("input[type='checkbox']").forEach(chk => {
                chk.parentElement.classList.remove("is-hidden")
            })
        }

        VIEWER.mymap.addEventListener("overlayadd", function(event) {
            VIEWER.locationsClusterLayerGroup._featureGroup.bringToFront()
            if (event.name === "Postmaster Heatmap") heatmapLegend.classList.remove("is-hidden")
        })

        VIEWER.mymap.addEventListener("overlayremove", function(event) {
            if (event.name === "Postmaster Heatmap") heatmapLegend.classList.add("is-hidden")
        })

        VIEWER.mymap.addEventListener("zoomend", function(event) {
            const oldlevel = VIEWER.currentZoomLevel
            VIEWER.currentZoomLevel = event.target._zoom
            VIEWER.iconsAtZoomLevel(oldlevel, VIEWER.currentZoomLevel)
        })

        const initialized = new CustomEvent("KastorLeafletInitialized")
        document.dispatchEvent(initialized)

    }, 150)
}

/**
 * Define what information from each Feature belongs in the popup that appears upon clicking a feature.
 * This is for the Newberry encoded data schema.
 */
VIEWER.formatPopupForNewberryData = function(feature, layer) {
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
        } else if (feature.properties["NAME"]) {
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
        } else if (feature.properties["TERR_TYPE"]) {
            popupContent += `<div class="featureInfo"><label>Territory Type:</label> ${feature.properties["TERR_TYPE"]}</div>`
        }
        if (feature.properties["RECORDS_START"]) {
            popupContent += `<div class="featureInfo"><label>Employees Start In:</label> ${parseInt(feature.properties["RECORDS_START"])}</div>`
            layer.options.startDate = feature.properties["RECORDS_START"]
        }
        if (feature.properties["RECORDS_END"]) {
            popupContent += `<div class="featureInfo"><label>Employees End In:</label> ${parseInt(feature.properties["RECORDS_END"])}</div>`
            layer.options.endDate = feature.properties["RECORDS_END"]
        }
        if (feature.properties["Employees_Count"]) {
            let count = VIEWER.determineEmployeeCount(feature)
            if (!parseInt(count) || parseInt(count) === -1) count = "N/A"
            layer.options["Employees_Count"] = count
            popupContent += `<div class="featureInfo"><label>Employee Count</label> ${count} </div>`
        } else {
            popupContent += `<div class="featureInfo"><label>Employee Count</label> N/A </div>`
        }
        if (feature.properties["Employees_Link"]) {
            popupContent += `
            <div class="featureInfo is-center">
                <a href="${feature.properties["Employees_Link"]}" target="_top" class="button secondary Employees_Link">see who worked here</a>
            </div>`
        }
        layer.bindPopup(popupContent)
    }
}

/**
 * Define what information from each Feature belongs in the popup that appears upon clicking a feature.
 * This is for the Kastor encoded data schema.
 */
VIEWER.formatPopupForKastorData = function(feature, layer) {
    function determineStateTitle(feature) {
        const datemap = feature.properties?.State_Full
        if (!datemap) return null
        if (typeof datemap === "string") return datemap
        const years_in_order = Object.keys(datemap).map(stryear => parseInt(stryear)).sort(function(a, b) { return a - b })
        const mostrecent = years_in_order[years_in_order.length - 1]
        let titleForChosenYear = datemap[mostrecent]
        if (parseInt(VIEWER.userInputYear) > 0) {
            titleForChosenYear = null
            for (let i = 0; i < years_in_order.length; i++) {
                const prev_year = (i > 0) ? years_in_order[i - 1] : years_in_order[i]
                const the_year = years_in_order[i]
                if (the_year === parseInt(VIEWER.userInputYear)) {
                    titleForChosenYear = feature.properties?.State_Full[the_year]
                    break
                }
                if (the_year > parseInt(VIEWER.userInputYear)) {
                    titleForChosenYear = feature.properties?.State_Full[prev_year]
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
        if (feature.properties["Geocoding_Location"]) {
            popupContent += `<div class="featureInfo"><label>Name:</label> ${feature.properties["Geocoding_Location"]} </div>`
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
        if (feature.properties["State_Full"]) {
            const stateTitle = determineStateTitle(feature)
            if (stateTitle) {
                popupContent += `<div class="featureInfo"><label>State Title:</label> ${stateTitle} </div> `
            }
        }
        if (feature.properties["Type"]) {
            popupContent += `<div class="featureInfo"><label>Type:</label> ${feature.properties["Type"].replace("Locality", "Location")}</div>`
        }
        if (feature.properties["Start_Date"]) {
            popupContent += `<div class="featureInfo"><label>Records Start In:</label> ${parseInt(feature.properties["Start_Date"])}</div>`
        }
        if (feature.properties["End_Date"]) {
            popupContent += `<div class="featureInfo"><label>Records End In:</label> ${parseInt(feature.properties["End_Date"])}</div>`
        }
        if (feature.properties["Employees_Link"]) {
            popupContent += `
            <div class="featureInfo is-center">
                <a href="${feature.properties["Employees_Link"]}" target="_top" class="button secondary Employees_Link">see who worked here</a>
            </div>`
        }

        layer.bindPopup(popupContent)
    }
}

/**
 * Change the selected date shown to the user.
 */
document.querySelector(".timeSlider").addEventListener("input", function(e) {
    document.querySelector(".slider-value").innerText = e.target.value
})

/**
 * Change the date slider
 */
document.querySelector(".timeSlider").addEventListener("change", function(e) {
    // Remove and redraw the layers filtering the data by Start Date and End Date comparison to the slider value.
    let sliderYear = e.target.value
    VIEWER.initializeLeaflet(VIEWER.startCoords, sliderYear + "")
})

/**
 * 'See All Locations' button click handler
 */
datelessView.addEventListener("click", function(e) {
    VIEWER.dateless(e)
})

/**
 * Move forward one year
 */
document.querySelector(".year-inc").addEventListener("click", function(e) {
    let currentYear = parseInt(document.querySelector(".slider-value").innerText)
    if (!currentYear || currentYear === 1829) return
    currentYear++
    document.querySelector(".slider-value").innerText = currentYear
    VIEWER.initializeLeaflet(VIEWER.startCoords, currentYear + "")
})

/**
 * Move backward one year
 */
document.querySelector(".year-dec").addEventListener("click", function(e) {
    let currentYear = parseInt(document.querySelector(".slider-value").innerText)
    if (!currentYear || currentYear === 1789) return
    currentYear--
    document.querySelector(".slider-value").innerText = currentYear
    VIEWER.initializeLeaflet(VIEWER.startCoords, currentYear + "")
})

/**
 * Show all features across all time without a date filter
 */
VIEWER.dateless = function(event) {
    VIEWER.initializeLeaflet(VIEWER.startCoords, "0")
}

/**
 * Use the chosen year to determine which count to show from the date:count (Employees_Count) property
 */
VIEWER.determineEmployeeCount = function(feature) {
    const datemap = feature.properties?.Employees_Count
    if (!datemap) return -1
    const years_in_order = Object.keys(datemap).map(stryear => parseInt(stryear)).sort(function(a, b) { return a - b })
    const mostrecent = years_in_order.pop()
    let countForChosenYear = datemap[mostrecent]
    if (parseInt(VIEWER.userInputYear) > 0) {
        for (let i = 0; i < years_in_order.length; i++) {
            const prev_year = (i > 0) ? years_in_order[i - 1] : years_in_order[i]
            const the_year = years_in_order[i]
            if (the_year === parseInt(VIEWER.userInputYear)) {
                countForChosenYear = feature.properties?.Employees_Count[the_year]
                break
            }
            if (the_year > parseInt(VIEWER.userInputYear)) {
                countForChosenYear = feature.properties?.Employees_Count[prev_year]
                break
            }
        }
    }
    return countForChosenYear
}

/**
 * Show the greeting, unless the user has selected not to see it again.
 */
VIEWER.showGreeting = function() {
    const check = sessionStorage.getItem("kastor-map-greeting-message")
    if (check && check === "checked") return
    document.querySelector(".greetingContainer").classList.remove("is-hidden")
}

VIEWER.init()
