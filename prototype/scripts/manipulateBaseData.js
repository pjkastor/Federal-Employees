const hello = "hello world"
/**
 * Run this after converting the AllLocations spreadsheet to JSON.
 * It will make the state titles a date map.
 */ 
async function mapStateTitleChangesOntoLocations(){

    let locations = await fetch("./data/AllLocations_new.json").then(resp => resp.json()).catch(err => {return []})
    let title_changes = await fetch("./data/state_title_changes.json").then(resp => resp.json()).catch(err => {return []})

    // Runtime could be improved but already runs in less than a couple seconds.
    for(let state_obj of title_changes){
        for(let loc_obj of locations.features){
            if(state_obj["STATE_ABBREV"] === loc_obj.properties["STATE_ABBREV"]){
                if(typeof loc_obj.properties["STATE_TITLE"] === "string"){
                    loc_obj.properties["STATE_TITLE"] = {}
                }
                loc_obj.properties["STATE_TITLE"][state_obj["YEAR"]] = state_obj["STATE_TITLE"]
            }
        }
    }

    // Could save the file, but you can also just copy it out of console yourself.
    console.log(locations)
    return locations
}

/**
 * Do this after converting the AllLocations spreadsheet.
 */ 
async function convertAllLocationsToFeatureCollection(){
    let locations = await fetch("./data/AllLocations_new.json").then(resp => resp.json()).catch(err => {return []})
    let fc = {
          "type": "FeatureCollection",
          "name": "AllLocations",
          "crs": {
            "type": "name",
            "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
          },
          "features": []
    }
    for(let loc_obj of locations){
        // NOTE that we can undo the lat,long issue here as well, and remove the accomodation from the processing script.
        const lat = loc_obj["Latitude"] ? parseFloat(loc_obj["Latitude"].replace(",","")) : null
        const lon = loc_obj["Longitude"] ? parseFloat(loc_obj["Longitude"]) : null
        let feature ={
            "type":"Feature",
            "properties":loc_obj,
            "geometry": { 
                "type": "Point", 
                "coordinates": [lat,lon] 
            }
        }
        fc.features.push(feature)
    }
    console.log(fc)
}

async function addEmployeeCountsToCounties(){
    let countiesFeatureCollection = await fetch("./data/CountyBoundaries.json").then(resp => resp.json()).catch(err => {return []})
    let counts = await fetch("./data/CountyEmployees.json").then(resp => resp.json()).catch(err => {return []})
    let alterations = 0
    for(count of counts){
        const countyID = count["Newberry County"]
        delete count["Newberry County"]
        delete count["County"]
        delete count["State"]
        countiesFeatureCollection.features = countiesFeatureCollection.features.map(c => {
            if(c.properties.ID === countyID) {
                c.properties.employeeCount = count
                alterations ++
            }
            return c
        })
    }
    console.log(`ALTERATIONS: ${alterations}`)
    console.log("FEATURE COLLECTION")
    console.log(countiesFeatureCollection)
    return countiesFeatureCollection
}

async function fixBadCountyID(){
    let countiesFeatureCollection = await fetch("./data/CountyBoundaries.json").then(resp => resp.json()).catch(err => {return []})
    for(f of countiesFeatureCollection.features){
        const countyID = f.properties["ID"]
        const fixed = countyID.replace("s_", "_")
        f.properties["ID"] = fixed        
    }
    console.log(`ALTERATIONS: ${alterations}`)
    console.log("FEATURE COLLECTION")
    console.log(countiesFeatureCollection)
    return countiesFeatureCollection
}

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

async function convertCountiesToXML(){
    const countiesFeatureCollection = await fetch("./data/CountyBoundaries.json").then(resp => resp.json()).catch(err => {return []})
    let flatObjs = []
    countiesFeatureCollection.features.forEach(f => {
        let props = f.properties
        delete f.properties
        delete f.geometry
        delete f.type
        delete props.employeeCount
        f = Object.assign(f, props)
        flatObjs.push(f)
    })
    console.log(flatObjs)
    OBJtoXML(flatObjs)
    function OBJtoXML(jsonarr) {
      let xml = '<newberry-counties>'
      for(let obj of jsonarr){
        xml += "<county>"
        for (var prop in obj) {
            let val = obj[prop] ? obj[prop] : "no_value"
            xml += `<${prop}> ${obj[prop]} </${prop}>`
        }
        xml += "</county>"
      }
      xml += '</newberry-counties>'
      xml = xml.replaceAll(/<\/?[0-9]{1,}>/g, '')
      xml = xml.replaceAll("&", "&amp;")
      console.log(xml)
      return xml
    }
}