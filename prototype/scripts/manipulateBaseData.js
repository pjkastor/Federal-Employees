const hello = "hello world"


/**
 * Note the new AllLocations file already contains data that is the result of running this script on the original.
 */ 
async function mapStateTitleChangesOntoLocations(){

	let locations = await fetch("./data/AllLocations_new.json").then(resp => resp.json()).catch(err => {return []})
	let title_changes = await fetch("./data/state_title_changes.json").then(resp => resp.json()).catch(err => {return []})

	// Runtime could be improved but already runs in less than a couple seconds.
	for(let state_obj in title_changes){
		for(let loc_obj in locations){
			if(state_obj["STATE_ABBREV"] === loc_obj["STATE_ABBREV"]){
				if(typeof loc_obj["STATE_TITLE"] === "string"){
					loc_obj["STATE_TITLE"] = {}
				}
				loc_obj["STATE_TITLE"][state_obj["YEAR"]] = state_obj["STATE_TITLE"]
			}
		}
	}

	// Could save the file, but you can also just copy it out of console yourself.
	console.log(locations)
}

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
		let feature ={
			"type":"Feature",
			"properties":loc_obj,
			"geometry": { "type": "Point", "coordinates": [loc_obj["Latitude"], loc_obj["Longitude"]] }
		}
		fc.features.push(feature)
	}
	return fc
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