const hello = "hello world"

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
                "coordinates": [lon,lat] 
            }
        }
        fc.features.push(feature)
    }
    console.log(fc)
}

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
            if(state_obj["STATE_ABBREV"] === loc_obj.properties["State_Abbreviated"]){
                if(typeof loc_obj.properties["State_Full"] === "string"){
                    loc_obj.properties["State_Full"] = {}
                }
                loc_obj.properties["State_Full"][state_obj["YEAR"]] = state_obj["STATE_TITLE"]
            }
        }
    }

    // Could save the file, but you can also just copy it out of console yourself.
    console.log(locations)
    return locations
}

async function adjustSCData(){
    let countiesFeatureCollection = await fetch("./data/CountyBoundariesWithEmployeeCounts_new_adjusted.json").then(resp => resp.json()).catch(err => {return []})
    let counts = await fetch("./data/SC_Employees.json").then(resp => resp.json()).catch(err => {return []})
    let removals = await fetch("./data/sc_removals.json").then(resp => resp.json()).catch(err => {return []})
    let alterations_counts = 0
    let alterations_removals = 0

    for(const count of counts){
        const countyID = count["Newberry County"]
        delete count["Newberry County"]
        countiesFeatureCollection.features = countiesFeatureCollection.features.map(c => {
            if(c.properties.ID === countyID) {
                c.properties.Employees_Count = count
                alterations_counts++
            }
            return c
        })
    }

    for(const obj of removals){
        const countyID = obj.ID
        countiesFeatureCollection.features = countiesFeatureCollection.features.map(c => {
            if(c.properties.ID === countyID) {
                c.properties.START_DATE_ORIG = c.properties.START_DATE
                c.properties.END_DATE_ORIG = c.properties.END_DATE
                c.properties.START_DATE = "1111-11-11"
                c.properties.END_DATE = "1111-11-11"
                alterations_removals++
            }
            return c
        })
    }
    console.log(`COUNTS: ${alterations_counts}`)
    console.log(`REMOVALS: ${alterations_removals}`)
    console.log("FEATURE COLLECTION")
    console.log(countiesFeatureCollection)
    return countiesFeatureCollection
}

async function updateCounties(){
    let countiesFeatureCollection = await fetch("./data/CountyBoundaries.json").then(resp => resp.json()).catch(err => {return []})
    const newbCounties = await fetch("./data/county_metadata.json").then(resp => resp.json()).catch(err => {return []})
    countiesFeatureCollection.features.forEach(f => {
        // Find the corresponding feature in newbCounties and absorb the properties
        let id = f.properties.ID_NUM
        let metadata = newbCounties.filter(s => parseInt(s.ID_NUM) === id)[0]
        metadata.ID_NUM = parseInt(metadata.ID_NUM)
        f.properties = metadata
    })
    console.log(countiesFeatureCollection)
    return countiesFeatureCollection
}

async function updateStates(){
    let statesFeatureCollection = await fetch("./data/StateBoundaries_new.json").then(resp => resp.json()).catch(err => {return []})
    const newbStates = await fetch("./data/state_metadata.json").then(resp => resp.json()).catch(err => {return []})
    statesFeatureCollection.features.forEach(f => {
        // Find the corresponding feature in newbCounties and absorb the properties
        let id = parseInt(f.properties.ID_NUM)
        let metadata = newbStates.filter(s => parseInt(s.ID_NUM) === id)[0]
        metadata.ID_NUM = parseInt(metadata.ID_NUM)
        const count = f.properties.Employees_Count
        f.properties = metadata
    })
    console.log(statesFeatureCollection)
    return statesFeatureCollection
}

async function addEmployeeCountsToCounties(){
    let countiesFeatureCollection = await fetch("./data/CountyBoundaries_new.json").then(resp => resp.json()).catch(err => {return []})
    let counts = await fetch("./data/CountyEmployees.json").then(resp => resp.json()).catch(err => {return []})
    let alterations = 0
    for(count of counts){
        const countyID = count["Newberry County"]
        countiesFeatureCollection.features = countiesFeatureCollection.features.map(c => {
            if(c.properties.ID === countyID) {
                delete count["Column3"]
                delete count["Column4"]
                delete count["Column5"]
                delete count["Newberry County"]
                delete count["Newberry Count2"]
                delete count["State"]
                c.properties.Employees_Count = count
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

async function addEmployeeCountsToStates(){
    let statesFeatureCollection = await fetch("./data/StateBoundaries.json").then(resp => resp.json()).catch(err => {return []})
    let counts = await fetch("./data/StateEmployees.json").then(resp => resp.json()).catch(err => {return []})
    let alterations = 0
    for(count of counts){
        const stateID = count.ID
        statesFeatureCollection.features = statesFeatureCollection.features.map(c => {
            if(c.properties.ID === stateID) {
                delete count.ID
                c.properties.Employees_Count = count
                alterations ++
            }
            return c
        })
    }
    console.log(`ALTERATIONS: ${alterations}`)
    console.log("FEATURE COLLECTION")
    console.log(statesFeatureCollection)
    return statesFeatureCollection
}

async function convertCountiesToXML(){
    const countiesFeatureCollection = await fetch("./data/CountyBoundaries.json").then(resp => resp.json()).catch(err => {return []})
    countiesFeatureCollection.features.forEach(f => {
        let props = f.properties
        delete f.properties
        delete f.geometry
        delete f.type
        delete props.Employees_Count
        f = Object.assign(f, props)
        flatObjs.push(f)
    })
    console.log(flatObjs)
    OBJtoXML(flatObjs)
    function OBJtoXML(jsonarr) {
      let xml = '<newberry-counties>'
      for(let obj of jsonarr){
        xml += "<county>"
        for (const prop in obj) {
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

async function addTaxMetadata(){
    let tax_1798_geo = await fetch("./data/1798_Tax_Divisions_Merged.json").then(resp => resp.json()).catch(err => {return []})
    let metadata_1798 = await fetch("./data/1798_tax_metadata.json").then(resp => resp.json()).catch(err => {return []})
    let tax_1814_geo = await fetch("./data/1814_Districts_Merged.json").then(resp => resp.json()).catch(err => {return []})
    let metadata_1814 = await fetch("./data/1814_tax_metadata.json").then(resp => resp.json()).catch(err => {return []})
    
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
            if(!dup_probs_1814.includes(id)) dup_probs_1814.push(id)
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
            if(!dup_probs_1798.includes(id)) dup_probs_1798.push(id)
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
