MapBoxMap = function (_parentElement, _data) {
  this.parentElement = _parentElement;
  this.data = _data;

  // data[0] is locationsgeoJSON
  // data [1] is countyBoundariesgeoJSON
  //data [2] is stateBoundariesgeoJSON
  //data[3] is taxes
  //data[4] is 1814 Tax Districts
};

MapBoxMap.prototype.initVis = function () {
  var vis = this;

  const popup = new mapboxgl.Popup({ closeOnClick: true, maxWidth: "150px" });
  // , offset: popupOffsets

  mapboxgl.accessToken =
    "pk.eyJ1Ijoia2FzdG9ycHJvamVjdCIsImEiOiJjbGlkZ2Q0Z3Ywc2N5M2RwZjVrcnJhMmNvIn0.e1tZnLbd-wfMVODWHJH4ew";
  const map = new mapboxgl.Map({
    container: vis.parentElement, // container ID
    style: "mapbox://styles/kastorproject/clk8k4knw033a01ns024f3h44", // bubble URL
    center: [-82, 35], // starting position [lng, lat]
    zoom: 4, // starting zoom
  });

  // initial load of the map
  map.on("load", () => {
    // county data
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
    // BOUNDARY SOURCE DATA
    map.addSource("countyBoundaries", {
      type: "geojson",
      data: originalCountyData,
      generateId: true,
    });
    map.addSource("stateBoundaries", {
      type: "geojson",
      data: originalStateData,
      generateId: true,
    });
    // LOCATION SOURCE DATA
    map.addSource("locations", {
      type: "geojson",
      data: originalLocData,
      generateId: true,
      cluster: true,
      // clusterMaxZoom: 7,
      clusterRadius: 40,
    });
    // LOCATIONS NO CLUSTER
    map.addSource("allLocations", {
      type: "geojson",
      data: originalLocData,
      generateId: true,
    });
    //TAX SOURCE DATA
    map.addSource("taxes", {
      type: "geojson",
      data: vis.data[3],
      generateId: true,
    });
    //1814 Tax Districts DATA
    map.addSource("district", {
      type: "geojson",
      data: vis.data[4],
      generateId: true,
    });
    // TAX OUTLINE LAYER
    map.addLayer({
      id: "Tax Outlines",
      source: "taxes",
      type: "line",
      layout: {
        "line-join": "round",
        "line-cap": "round",
        visibility: "none",
      },
      paint: {
        "line-color": "blue",
        "line-width": 2,
      },
    });
    // TAX FILL LAYER
    map.addLayer({
      id: "1798 Tax Districts",
      source: "taxes",
      type: "fill",
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#EE4B2B",
        "fill-opacity": 0,
        "fill-outline-color": "white",
      },
    });
    // DISTRICT OUTLINE LAYER
    map.addLayer({
      id: "District Outlines",
      source: "district",
      type: "line",
      layout: {
        "line-join": "round",
        "line-cap": "round",
        visibility: "none",
      },
      paint: {
        "line-color": "red",
        "line-width": 2,
      },
    });
    // DISTRICT FILL LAYER
    map.addLayer({
      id: "1814 Tax Districts",
      source: "district",
      type: "fill",
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#EE4B2B",
        "fill-opacity": 0,
        "fill-outline-color": "white",
      },
    });
    // COUNTY OUTLINE LAYER
    map.addLayer({
      id: "County Boundaries",
      source: "countyBoundaries",
      type: "line",
      layout: {
        "line-join": "round",
        "line-cap": "round",
        visibility: "none",
      },
      paint: {
        "line-color": "white",
        "line-width": 2,
      },
    });
    // COUNTY FILL LAYER
    map.addLayer({
      id: "County Fill",
      source: "countyBoundaries",
      type: "fill",
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#EE4B2B",
        "fill-opacity": 0,
        "fill-outline-color": "green",
      },
    });
    // STATE OUTLINE LAYER
    map.addLayer({
      id: "State Boundaries",
      source: "stateBoundaries",
      type: "line",
      layout: {
        "line-join": "round",
        "line-cap": "round",
        visibility: "none",
      },
      // interpolation numbers need work
      paint: {
        "line-color": "black",
        "line-width": 3.5,
      },
    });
    // STATE FILL LAYER
    map.addLayer({
      id: "State Fill",
      source: "stateBoundaries",
      type: "fill",
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#EE4B2B",
        "fill-opacity": 0,
        "fill-outline-color": "white",
      },
    });
    // zoomed out clusters
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "locations",
      paint: {
        "circle-radius": ["step", ["get", "point_count"], 20, 4, 30, 8, 40],
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#b8e2f6",
          4,
          "#7bbad8",
          8,
          "#375360",
        ],
        "circle-stroke-width": [
          "case",
          ["boolean", ["feature-state", "hovered"], false],
          3,
          1,
        ],
        "circle-stroke-color": [
          "case",
          ["boolean", ["feature-state", "hovered"], false],
          "#FFFFFF",
          "#000000",
        ],
      },
      layout: {
        visibility: "none",
      },
    });
    // cluster count label
    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "locations",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
        visibility: "none",
      },
    });
    // individual location points
    map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "locations",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#C3B1E1",
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#000000",
      },
      layout: {
        visibility: "none",
      },
    });
    map.addLayer({
      id: "allPoints",
      type: "circle",
      source: "allLocations",
      paint: {
        "circle-color": "#C3B1E1",
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#000000",
      },
    });

    map.on("zoom", () => {
      if (map.getZoom() < 5.5) {
        map.setLayoutProperty("clusters", "visibility", "none");
        map.setLayoutProperty("cluster-count", "visibility", "none");
        map.setLayoutProperty("unclustered-point", "visibility", "none");
        map.setLayoutProperty("allPoints", "visibility", "visible");
      } else {
        map.setLayoutProperty("clusters", "visibility", "visible");
        map.setLayoutProperty("cluster-count", "visibility", "visible");
        map.setLayoutProperty("unclustered-point", "visibility", "visible");
        map.setLayoutProperty("allPoints", "visibility", "none");
      }
    });
    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
    });
    // html functions to change time
    document
      .getElementById("timeSlider")
      .addEventListener("input", function (e) {
        document.getElementById("slider-value").innerHTML = e.target.value;
      });
    document
      .getElementById("timeSlider")
      .addEventListener("change", function (e) {
        var sliderYear = e.target.value + "-12-31";
        var newCountyData = {
          ...vis.data[1],
          features: vis.data[1].features.filter(function (d) {
            var sDate = new Date(d.properties["START_DATE"]);
            var eDate = new Date(d.properties["END_DATE"]);
            var currDate = new Date(sliderYear);
            var bool = sDate < currDate && eDate >= currDate;
            return bool;
          }),
        };
        var newStateData = {
          ...vis.data[2],
          features: vis.data[2].features.filter(function (d) {
            var sDate = new Date(d.properties["START_DATE"]);
            var eDate = new Date(d.properties["END_DATE"]);
            var currDate = new Date(sliderYear);
            var bool = sDate < currDate && eDate >= currDate;
            return bool;
          }),
        };
        var currYear = parseInt(e.target.value);
        var newLocData = {
          ...vis.data[0],
          features: vis.data[0].features.filter(function (d) {
            var bool = false;
            if (
              !isNaN(d.properties["Earliest Record"]) ||
              !isNaN(d.properties["Latest Record"])
            ) {
              bool =
                d.properties["Earliest Record"] <= currYear &&
                d.properties["Latest Record"] >= currYear;
            }
            return bool;
          }),
        };
        vis.map.getSource("locations").setData(newLocData);
        vis.map.getSource("allLocations").setData(newLocData);
        vis.map.getSource("countyBoundaries").setData(newCountyData);
        vis.map.getSource("stateBoundaries").setData(newStateData);
      });

    var locID = null;
    // hover functions
    map.on(
      "mousemove",
      [
        "County Fill",
        "1798 Tax Districts",
        "State Fill",
        "1814 Tax Districts",
        "State Boundaries",
        "County Boundaries",
        "District Outlines",
        "Tax Outlines",
        "clusters",
        "unclustered-point",
        "allPoints",
      ],
      (e) => {
        var allLayer = map.queryRenderedFeatures(e.point, {
          layers: ["allPoints"],
        });
        var unclusterLayer = map.queryRenderedFeatures(e.point, {
          layers: ["unclustered-point"],
        });
        var clusterLayer = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        var stateLayer = map.queryRenderedFeatures(e.point, {
          layers: ["State Fill"],
        });
        var countyLayer = map.queryRenderedFeatures(e.point, {
          layers: ["County Fill"],
        });
        var taxLayer = map.queryRenderedFeatures(e.point, {
          layers: ["1798 Tax Districts"],
        });
        var districtLayer = map.queryRenderedFeatures(e.point, {
          layers: ["1814 Tax Districts"],
        });
        if (clusterLayer.length > 0) {
          var clusterId = clusterLayer[0].properties.cluster_id;
          var pointCount = clusterLayer[0].properties.point_count;
          var clusterSource = map.getSource("locations");
          if (pointCount) {
            clusterSource.getClusterLeaves(
              clusterId,
              pointCount,
              0,
              (error, features) => {
                // Print cluster leaves in the console
                var clusterString = "<a><strong>";
                if (features) {
                  features.forEach(function (point) {
                    clusterString =
                      clusterString +
                      point.properties["Geocoding Location"] +
                      " | ";
                  });
                }
                clusterString = clusterString + "</strong></a";
                popup
                  .setHTML(clusterString)
                  .setMaxWidth("400px")
                  .setLngLat(e.lngLat)
                  .addTo(map);
              }
            );
          }
          if (e.features.length === 0) return;
          if (locID) {
            map.removeFeatureState({
              source: "locations",
              id: locID,
            });
          }
          locID = e.features[0].id;
          map.setFeatureState(
            {
              source: "locations",
              id: locID,
            },
            {
              // hovered: true,
            }
          );
        } else if (allLayer.length > 0 || unclusterLayer.length > 0) {
          var currData = e.features[0].properties;
          var pointString =
            "<div id = 'locPopup'><h5>" +
            currData["Geocoding Location"] +
            ", <br>";
          if (currData["State"] !== "") {
            pointString = pointString + currData["State"] + ", ";
          }
          pointString = pointString + currData["Country"] + "</h5>" + "</div>";
          popup.setLngLat(e.lngLat).setHTML(pointString).addTo(map);
        } else if (
          stateLayer.length > 0 ||
          countyLayer.length > 0 ||
          taxLayer.length > 0 ||
          districtLayer.length > 0
        ) {
          var hoverString = "";
          if (countyLayer.length > 0) {
            var currData = countyLayer[0].properties;
            hoverString =
              hoverString +
              "<strong>County: </strong> <a>" +
              currData["NAME"].charAt(0) +
              currData["NAME"].slice(1).toLowerCase() +
              ", " +
              currData["STATE_TERR"] +
              "</a><br>";
          }
          if (stateLayer.length > 0) {
            var currData = stateLayer[0].properties;
            hoverString =
              hoverString +
              "<strong>State: </strong><a>" +
              currData["NAME"] +
              "</a><br>";
          }
          if (taxLayer.length > 0) {
            var currData = taxLayer[0].properties;
            hoverString =
              hoverString +
              "<strong>1798 Tax: </strong><a>" +
              currData["TaxDivision1798"] +
              ", " +
              currData["State"] +
              "</a><br>";
          }
          if (districtLayer.length > 0) {
            var currData = districtLayer[0].properties;
            hoverString =
              hoverString +
              "<strong>1814 Tax: </strong><a>" +
              currData["District1814"] +
              ", " +
              currData["State"] +
              "</a><br>";
          }

          popup
            .setHTML(hoverString)
            .setMaxWidth("400px")
            .setLngLat(e.lngLat)
            .addTo(map);
        }
      }
    );
    map.on(
      "mouseout",
      [
        "County Fill",
        "1798 Tax Districts",
        "State Fill",
        "1814 Tax Districts",
        "State Boundaries",
        "County Boundaries",
        "District Outlines",
        "Tax Outlines",
        "clusters",
        "unclustered-point",
        "allPoints",
      ],
      (e) => {
        popup.remove();
      }
    );
    // click functions
    map.on("click", "clusters", (e) => {
      var clickedPoint = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      if (clickedPoint[0].properties.point_count) {
        map.flyTo({
          center: e.lngLat,
          zoom: map.getZoom() + 1,
          speed: 0.7,
          curve: 1,
          easing(t) {
            return t;
          },
        });
      }
    });
    map.on("click", ["unclustered-point", "allPoints"], (e) => {
      var clickedString = "";
      var clickedPoint = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point", "allPoints"],
      });
      var currData = clickedPoint[0].properties;
      clickedString =
        clickedString +
        "<br> <strong><h5>" +
        currData["Geocoding Location"] +
        "</h5></strong>";
      if (currData["State"] != "") {
        clickedString = clickedString + "<a>" + currData["State"] + ", ";
      }
      clickedString =
        clickedString +
        currData["Country"] +
        ", " +
        currData["Sector"] +
        "</a><br>";
      clickedString =
        clickedString +
        "<a><strong> Earliest Employee Record: </strong>" +
        currData["Earliest Record"] +
        "<br> <strong> Latest Employee Record: </strong>" +
        currData["Latest Record"];
        console.log(currData);
      if (Object.keys(currData["personnel"]).length > 2) {
        document.getElementById("personnelInfo").innerHTML = "";
        currData.personnel = JSON.parse(currData.personnel);
        Object.entries(currData.personnel).forEach(([key, value]) => {
          var link = document.createElement("a");
          link.id = key;
          link.textContent = value[0]["Full Name"];
          link.className = "";
          link.href = "#";
          link.onclick = function(e){
            e.preventDefault();
            e.stopPropagation();
          }
          document.getElementById("personnelInfo").appendChild(link);
        });
        document.querySelector("#personnelInfo").style.visibility = "visible";
      } else {
        document.querySelector("#personnelInfo").style.visibility = "hidden";
        document.getElementById("personnelInfo").innerHTML = "";
      }
      document.getElementById("locInfo").innerHTML = clickedString;
    });
  });
  // CLOSE OF MAPLOAD
  console.log(vis.data);
  map.on("idle", () => {
    setTimeout(function () {
      document.querySelector("#loadingLogo").style.display = "none";
      document.querySelector("body").style.visibility = "visible";
    }, 3000);
    // If these two layers were not added to the map, abort
    if (
      !map.getLayer("State Boundaries") ||
      !map.getLayer("County Boundaries") ||
      !map.getLayer("1814 Tax Districts") ||
      !map.getLayer("1798 Tax Districts") ||
      !map.getLayer("State Fill") ||
      !map.getLayer("County Fill")
    ) {
      return;
    }
    // Enumerate ids of the layers.
    const toggleableLayerIds = [
      "State Boundaries",
      "County Boundaries",
      "1814 Tax Districts",
      "1798 Tax Districts",
    ];
    // Set up the corresponding toggle button for each layer.
    for (const id of toggleableLayerIds) {
      // Skip layers that already have a button set up.
      if (document.getElementById(id)) {
        continue;
      }
      // Create a link.
      const link = document.createElement("a");
      link.id = id;
      link.href = "#";
      link.textContent = id;
      link.className = "";
      // Show or hide layer when the toggle is clicked.
      link.onclick = function (e) {
        const clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();
        const visibility = map.getLayoutProperty(clickedLayer, "visibility");
        // Toggle layer visibility by changing the layout object's visibility property.
        if (visibility === "visible") {
          map.setLayoutProperty(clickedLayer, "visibility", "none");
          this.className = "";
        } else {
          this.className = "active";
          map.setLayoutProperty(clickedLayer, "visibility", "visible");
        }
        if (clickedLayer == "State Boundaries") {
          if (map.getLayoutProperty("State Fill", "visibility") === "visible") {
            map.setLayoutProperty("State Fill", "visibility", "none");
          } else {
            map.setLayoutProperty("State Fill", "visibility", "visible");
          }
        } else if (clickedLayer == "County Boundaries") {
          if (
            map.getLayoutProperty("County Fill", "visibility") === "visible"
          ) {
            map.setLayoutProperty("County Fill", "visibility", "none");
          } else {
            map.setLayoutProperty("County Fill", "visibility", "visible");
          }
        } else if (clickedLayer == "1798 Tax Districts") {
          if (
            map.getLayoutProperty("Tax Outlines", "visibility") === "visible"
          ) {
            map.setLayoutProperty("Tax Outlines", "visibility", "none");
          } else {
            map.setLayoutProperty("Tax Outlines", "visibility", "visible");
          }
        } else if (clickedLayer == "1814 Tax Districts") {
          if (
            map.getLayoutProperty("District Outlines", "visibility") ===
            "visible"
          ) {
            map.setLayoutProperty("District Outlines", "visibility", "none");
          } else {
            map.setLayoutProperty("District Outlines", "visibility", "visible");
          }
        }
      };
      const layers = document.getElementById("toggleMenu");
      layers.appendChild(link);
    }
  });
  // end of map idle
  vis.map = map;
};
