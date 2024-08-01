const hello = "hello world"
/**
 * Run this after converting the AllLocations spreadsheet to JSON.
 * It will make the state titles a date map.
 */ 
async function mapStateTitleChangesOntoLocations(){

    let locations = await fetch("./data/AllLocations.json").then(resp => resp.json()).catch(err => {return []})
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
 * Run this after converting the AllLocations spreadsheet to JSON.
 * It will make the state titles a date map.
 */ 
async function mapEmployeeLinksOntoLocations(){
    let locations = await fetch("./data/AllLocations.json").then(resp => resp.json()).catch(err => {return []})
    let links = await fetch("./data/location_employee_links.json").then(resp => resp.json()).catch(err => {return []})

    // Runtime could be improved but already runs in less than a couple seconds.
    for(let link_obj of links){
        for(let loc_obj of locations.features){
            if(loc_obj["Geocode Number"] && loc_obj["Geocode Number"] === link_obj.properties["Geocode Number"]){
                if(loc_obj?.employeesLink){
                    console.log(`Curious thing...${loc_obj["Geocode Number"]}`)
                }
                else{
                    loc_obj.employeesLink = link_obj.properties["Geocode Number"]    
                }
            }
        }
    }
    console.log(locations)
    return locations
}

/**
 * Do this after converting the AllLocations spreadsheet.
 */ 
async function convertAllLocationsToFeatureCollection(){
    let locations = await fetch("./data/AllLocations.json").then(resp => resp.json()).catch(err => {return []})
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
    let countiesFeatureCollection = await fetch("./data/CountyBoundariesWithEmployeeCounts.json").then(resp => resp.json()).catch(err => {return []})
    let counts = await fetch("./data/CountyEmployees.json").then(resp => resp.json()).catch(err => {return []})
    let alterations = 0
    for(count of counts){
        const countyID = count["Newberry County"]
        delete count["Newberry County"]
        delete count["Newberry County2"]
        delete count["State"]
        delete count["Column3"]
        delete count["Column4"]
        delete count["Column5"]
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

async function updateCounties(){
    let countiesFeatureCollection = await fetch("./data/CountyBoundariesWithEmployeeCounts.json").then(resp => resp.json()).catch(err => {return []})
    const newbCounties = await fetch("./data/updatedCountyMetadata.json").then(resp => resp.json()).catch(err => {return []})
    countiesFeatureCollection.features.forEach(f => {
        // Find the corresponding feature in newbCounties and absorb the properties
        let id = f.properties.ID_NUM
        let metadata = newbCounties.filter(f => f.properties.ID_NUM === id)[0]
        let combined = Object.assign(f.properties, metadata)
        f.properties = combined
    })
    console.log(countiesFeatureCollection)
    return countiesFeatureCollection
}

async function convertCountiesToXML(){
    const countiesFeatureCollection = await fetch("./data/CountyBoundaries.json").then(resp => resp.json()).catch(err => {return []})
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

async function hideNH(){
    let countiesFeatureCollection = await fetch("./data/CountyBoundariesWithEmployeeCounts.json").then(resp => resp.json()).catch(err => {return []})
    countiesFeatureCollection.features.forEach(county => {
        if(county.properties.STATE_TERR === "New Hampshire"){
            county.properties.employeeCountNH = county.properties.employeeCount
            delete county.properties.employeeCount
        }
    })
    console.log(countiesFeatureCollection)
    return countiesFeatureCollection
}

async function addTaxMetadata(){
    let tax_1798_geo = await fetch("./data/1798_Tax_Divisions_Merged.json").then(resp => resp.json()).catch(err => {return []})
    let metadata_1798 = await fetch("./data/1798_metadata.json").then(resp => resp.json()).catch(err => {return []})
    let tax_1814_geo = await fetch("./data/1814_Districts_Merged.json").then(resp => resp.json()).catch(err => {return []})
    let metadata_1814 = await fetch("./data/1814_metadata.json").then(resp => resp.json()).catch(err => {return []})
    
    let no_1814_metadata = []
    let no_1814_id = []
    let no_1798_metadata = []
    let no_1798_id = []

    let dup_probs_1814 = []
    let dup_probs_1798 = []

    tax_1814_geo.features.forEach(f => {
        let id = f.properties["District1814"]
        if(!id) {
            no_1814_id.push(f)
            return
        }
        let metadata = metadata_1814.filter(m => id === m["District1814"])
        if(metadata.length > 1){
            console.log(`Curious 1814 thing for ${id}`)
            console.log(metadata)
            if(dup_probs_1814.indexOf(id) === -1) dup_probs_1814.push(id)
            return
        }
        if(metadata.length === 0) {
            no_1814_metadata.push(f)
            return
        }
        //let combined = Object.assign(f.properties, metadata[0])
        f.properties = metadata[0]
    })

    tax_1798_geo.features.forEach(f => {
        let id = f.properties["TaxDivision1798"]
        if(!id) {
            no_1798_id.push(f)
            return
        }
        let metadata = metadata_1798.filter(m => id === m["TaxDivision1798"])
        if(metadata.length > 1){
            console.log(`Curious 1798 thing for ${id}`)
            console.log(metadata)
            if(dup_probs_1798.indexOf(id) === -1) dup_probs_1798.push(id)
            return
        }
        if(metadata.length === 0) {
            no_1798_metadata.push(f)
            return
        }
        //let combined = Object.assign(f.properties, metadata[0])
        f.properties = metadata[0]
    })

    console.log("duplicates 1798")
    console.log(dup_probs_1798)

    console.log("duplicates 1814")
    console.log(dup_probs_1814)

    console.log(`The following ${no_1814_id.length} 1814 features out of ${tax_1814_geo.features.length} did not have the 'District1814' property`)
    console.log(no_1814_id)

    console.log(`There was no metadata for the following ${no_1814_metadata.length} 1814 features.`)
    console.log(no_1814_metadata)

    console.log(`The following ${no_1798_id.length} 1798 features out of ${tax_1798_geo.features.length} did not have the 'TaxDivision1798' property`)
    console.log(no_1798_id.map(o=>o["TaxDivision1798"]))

    console.log(`There was no metadata for the following ${no_1798_metadata.length} 1798 features.`)
    console.log(no_1798_metadata)

    console.log("1814")
    console.log(tax_1814_geo)

    console.log("1798")
    console.log(tax_1798_geo)

    return true
}

async function adjustNewberryData(){
    let countiesFeatureCollection = await fetch("./data/CountyBoundariesWithEmployeeCounts_new_adjusted.json").then(resp => resp.json()).catch(err => {return []})
    countiesFeatureCollection.features.forEach(county => {
        // if(county.properties.STATE_TERR === "Louisiana"){
        //     // Keep parishes, not counties.
        //     // We may need to consider extinct parishes of Orleans Territory as well.
        //     if(county.properties.CNTY_TYPE === "County"){
        //         county.properties.START_DATE_ORIG = county.properties.START_DATE
        //         county.properties.END_DATE_ORIG = county.properties.END_DATE
        //         county.properties.START_DATE = "1111-11-11"
        //         county.properties.END_DATE = "1111-11-11"
        //     }
        // }
        // else if(county.properties.STATE_TERR === "Orleans Territory"){
        //     // Keep parishes, not counties.
        //     // We may need to consider extinct parishes of Orleans Territory as well.
        //     if(county.properties.CNTY_TYPE === "County"){
        //         county.properties.START_DATE_ORIG = county.properties.START_DATE
        //         county.properties.END_DATE_ORIG = county.properties.END_DATE
        //         county.properties.START_DATE = "1111-11-11"
        //         county.properties.END_DATE = "1111-11-11"
        //     }
        // }
        // else if(county.properties.STATE_TERR === "South Carolina"){
        //     // Keep counties, not districts or parishes
        //     if(county.properties.CNTY_TYPE === "District" || county.properties.CNTY_TYPE === "Parish"){
        //         county.properties.START_DATE_ORIG = county.properties.START_DATE
        //         county.properties.END_DATE_ORIG = county.properties.END_DATE
        //         county.properties.START_DATE = "1111-11-11"
        //         county.properties.END_DATE = "1111-11-11"
        //     }
        // }

        if(county.properties.STATE_TERR === "South Carolina"){
            // Keep
            if(county.properties.CNTY_TYPE === "District" || county.properties.CNTY_TYPE === "Parish"){
                county.properties.START_DATE = county.properties.START_DATE_ORIG
                county.properties.END_DATE = county.properties.END_DATE_ORIG
                delete county.properties.START_DATE_ORIG
                delete county.properties.END_DATE_ORIG
            }
            else{
                // Hide
                county.properties.START_DATE_ORIG = county.properties.START_DATE
                county.properties.END_DATE_ORIG = county.properties.END_DATE
                county.properties.START_DATE = "1111-11-11"
                county.properties.END_DATE = "1111-11-11"
            }
        }
    })
    console.log(countiesFeatureCollection)
    return countiesFeatureCollection
}