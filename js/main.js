var allData = [];

var leafletMap, mapboxMap;
loadData();
function loadData() {

  document.querySelector("#loadingLogo").style.visibility = "visible";
  document.querySelector("#personnelInfo").style.visibility = "hidden";


  var locationUrl = "./data/AllLocations.json";
  var peopleUrl = "./data/KastorPeopleNY.json";
  var taxUrl = "./data/1798_Tax_Divisions_Merged.json";
  var districtUrl = "./data/1814_Districts_Merged.json";
  var countyUrl = "./data/CountyBoundaries.json";
  var stateUrl = "./data/StateBoundaries.json";
  var peopleData = [];
  var locationGeoJSON = {};
  var temp = [];
  var peopleFields = [];
  // TO-DO: LOAD DATA

  //use data
  $.when(
    $.getJSON(locationUrl),
    $.getJSON(peopleUrl),
    $.getJSON(countyUrl),
    $.getJSON(stateUrl),
    $.getJSON(taxUrl),
    $.getJSON(districtUrl)
  )
    .then(function (
      lData,
      pData,
      countyBoundaries,
      stateBoundaries,
      taxBoundaries,
      districtBoundaries
    ) {
      lData = lData[0]
      pData = pData[0];
      countyBoundaries = countyBoundaries[0];
      stateBoundaries = stateBoundaries[0];
      taxBoundaries = taxBoundaries[0];
      districtBoundaries = districtBoundaries[0];
      pData["Fields"].forEach((element) => {
        peopleFields.push(element["Fied"]);
      });
      peopleFields.push("Geocoding ID");

      pData["Data"].map((item) => {
        const filteredItem = {};
        peopleFields.forEach((field) => {
          if (item.hasOwnProperty(field)) {
            filteredItem[field] = item[field];
          }
        });
        peopleData.push(filteredItem);
      });

      peopleData.sort(function (a, b) {
        return a.GovernmentEmployeeNumber - b.GovernmentEmployeeNumber;
      });


      lData.features.forEach(function (loc) {
        console.lo
        var tempX = loc.geometry.coordinates[0];
        var tempY = loc.geometry.coordinates[1];
        loc.geometry.coordinates[0] = tempY;
        loc.geometry.coordinates[1] = tempX;
        loc.properties["Earliest Record"] = parseInt(loc.properties["Earliest Record"])
        loc.properties["Latest Record"] = parseInt(loc.properties["Latest Record"])

        var personnelArr = {};
        var temp = peopleData.filter(function (p) {
          return p["Geocoding ID"] == loc.properties["Geocode Number"];
        });
        if (temp.length > 0) {
          temp.forEach((item, index) => {
            const existingId = Object.keys(personnelArr).find((id) =>
              personnelArr[id].includes(item)
            );
            if (existingId) {
              personnelArr[existingId].push(item);
            } else {
              const newId = item["GovernmentEmployeeNumber"];
              personnelArr[newId] = [item];
            }
          });
        }
        loc.properties.personnel = personnelArr;
      });

      allData.push(lData);
      allData.push(countyBoundaries);
      allData.push(stateBoundaries);
      allData.push(taxBoundaries);
      allData.push(districtBoundaries);
      mapboxMap = new MapBoxMap("mapbox-map", allData);
      mapboxMap.initVis();
    })

    .fail(function () {
      // ...didn't work, handle it
    });
}
