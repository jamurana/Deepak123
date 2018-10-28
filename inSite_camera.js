// THIS IS DEPRECATED, but will keep around for comparison
/*function inSiteFindClosestCameraMatchPositionOnly(position, direction, horz_fov, entities_list) {
    // transform input to lat/lon
    //position = Cesium.Cartographic.fromCartesian(position);

    // TEMP: naive version for now, just looking for the closest camera distance
    var closestCamDistance = null;
    var closestCamId = null;

    // TEMP
    console.log("Looking for camera closest to position: " + position);

    // loop through loaded cameras
    var id;
    for (id in viewer.entities.values) {
        var entity = viewer.entities.values[id]
        if (entity.hasOwnProperty("inSiteType")) {
            if (entity.inSiteType == "cameraPosition") {
                var entityCamPos = entity.position.getValue();
                //console.log("checking against cam pos: " + entityCamPos);
                var dist = Cesium.Cartesian3.distance(entityCamPos, position);
                //console.log("distance: " + dist);
                if (!closestCamDistance || (dist < closestCamDistance)) {
                    closestCamDistance = dist;
                    closestCamId = id;
                }
            }
        }
    }

    var camEntity = viewer.entities.values[closestCamId];
    console.log("closest camera found: " + camEntity.image);
    return camEntity;
}*/

export function inSiteFindClosestCameraMatch(position, headingPitchRoll, horz_fov, entities_list) 
{
    // these 3 arrays will be the same length, the number of cameras in the entities_list
    //var camDistances     = [] 
    //var camAngleDeltas   = []
    //var camFitnessScores = []

    function dataCam(entityID, camDistance, camAngleDelta, camFitnessScore){
        this.entityID        = entityID;
        this.camDistance     = camDistance;
        this.camAngleDelta   = camAngleDelta;
        this.camFitnessScore = camFitnessScore;
    }

    var listOfCamData = [];

    // keep track of min/max cam distances to normalise/scale values later
    //var camMinDist = null;
    //var camMaxDist = null;

    // TODO: later, instead of adding all camera positions as cesium entities, store them per-project and 
    // only load in when activating a project (i.e. jumping to it from the menu, or navigating close to it in 3D)
    // otherwise this is going to be too inefficient when you consider a portal with hundreds of projects, each with thousands of cameras

    // we will discard any images which the camera is more than 100x distant from, i.e. only show linked images if we're close to the project
    var projectCenter = inSiteGetProject(insiteActiveProject).center();
    var distToProjectCenter = 0;
    if (projectCenter) {
        distToProjectCenter = Cesium.Cartesian3.distance(projectCenter, position);
    }
    //console.log("project: " + insiteActiveProject + ", projectCenter: " + projectCenter + ", distToProjectCenter: " + distToProjectCenter); // TEMP

    // loop through all cameras, compiling distance and angle deltas to the 3D view cam
    var id;
    for (id in viewer.entities.values) {
        var entity = viewer.entities.values[id]
        if (entity.hasOwnProperty("inSiteType")) {
            if (entity.inSiteType == "cameraPosition") {
                
                // if the camera positions are tagged with the project they're from, skip over if not the current project. TEMP optimisation until cameras are loaded only with each project becoming actice
                if (entity.hasOwnProperty("cameraProject")) {
                    if (entity.cameraProject != insiteActiveProject) {
                        continue;
                    }
                }

                // ## CALC CAMERA DISTANCE
                var entityCamPos = entity.position.getValue();
                //console.log("checking against cam pos: " + entityCamPos);
                var dist = Cesium.Cartesian3.distance(entityCamPos, position);

                // skip images if the 3D camera is 100x or further away
                var imageDistFromProjectCenter = Cesium.Cartesian3.distance(projectCenter, entityCamPos);
                if ((imageDistFromProjectCenter*100) < distToProjectCenter) { 
                    continue;
                }
                /*if (!camMinDist || (dist < camMinDist)) {
                    camMinDist = dist;
                }
                if (!camMaxDist || (dist > camMaxDist)) {
                    camMaxDist = dist;
                }*/
                //console.log("distance: " + dist);
                //camDistances.push(dist);

                // ## CALC CAMERA ANGLE DELTA
                var imageHeadingPitchRoll = entity.hpr;
                headingPitchRoll.roll      = 0; // TEMP? TBD
                imageHeadingPitchRoll.roll = 0; // TEMP? TBD
                var angleDiff = calcAngleBetweenHeadingPitchRollRadians(headingPitchRoll, imageHeadingPitchRoll);
                if (entity.image == "DATA/AusGrid/Beacon_Hill_demo/model/photos/AUAV_Ausgrid_FF_0132.jpg") {       // TEMP!!! debugging during dev
                    console.log("angle diff to image " + entity.image + ": " + Cesium.Math.toDegrees(angleDiff));  // TEMP!!!
                    console.log("  camera hpr: " + headingPitchRoll);                                              // TEMP!!!
                    console.log("  image hpr:  " + imageHeadingPitchRoll);                                         // TEMP!!!
                }
                //camAngleDeltas.push(angleDiff);

                listOfCamData.push(new dataCam(entity.id, dist, angleDiff));

            }
        }
    }

    // calc fitness scores (lower is better)
    // TEMP: naive version for now, just looking for the closest camera distance
    var bestFitnessScore = null;
    var bestFitnessCamId = null;
    for (var i = 0; i < listOfCamData.length; i++) {
        let camObj = listOfCamData[i];

        var distanceScore = camObj.camDistance;
        var angleScore    = camObj.camAngleDelta;
        //var combinedScore = distanceScore + 10*angleScore; // TEMP, super naive averaging for now - 10*angleScore seems to work well for building-scale structures
        var combinedScore = distanceScore + 2*angleScore; // TEMP, super naive averaging for now - 2*angleScore seems to work well for structures of a few metres in scale (e.g. CSBP tank)
        if (!bestFitnessScore || (combinedScore < bestFitnessScore)) {
            bestFitnessScore = combinedScore;
            bestFitnessCamId = camObj.entityID;
        }
    }

    var camEntity = viewer.entities.getById(bestFitnessCamId);
    if (camEntity) {
        console.log("closest camera match found: " + camEntity.image);
    }
    return camEntity;
}

export function insiteReadCamerasXML(projectName, XMLfile, heightOffset, entityProcessCallback) {
/// reads a ContextCapture BlocksExchange XML file for the camera positions

    function cam(){
        this.image = "";
        this.rot = [0,0,0];
        this.pos = [0,0,0];
    }
    
    //added a dynamic param to the url to make it always load from the server.
    //comment the below line if you want to take advantage of browser cache
    XMLfile = XMLfile + "?" + new Date().getTime()

    $.ajax({url: XMLfile, success: function(result) {
        
          var $result = $( result );
          let listOfEntities = [];

          $result.find('Photo').each(function(index, item) {

            let camObj = new cam();
            camObj.image = $(item).find("ImagePath").text() || "";

            let Yaw   = $(item).find("Pose>Rotation>Yaw").text();
            let Pitch = $(item).find("Pose>Rotation>Pitch").text();
            let Roll  = $(item).find("Pose>Rotation>Yaw").text();

            Yaw   = isNaN(Yaw)?0:parseFloat(Yaw);
            Pitch = isNaN(Pitch)?0:parseFloat(Pitch);
            Roll  = isNaN(Yaw)?0:parseFloat(Roll);

            camObj.rot[0] = Yaw;
            camObj.rot[1] = Pitch;
            camObj.rot[2] = Roll;

            let x = $(item).find("Pose>Center>x").text();
            let y = $(item).find("Pose>Center>y").text();
            let z = $(item).find("Pose>Center>z").text();

            x = isNaN(x)?0:parseFloat(x);
            y = isNaN(y)?0:parseFloat(y);
            z = isNaN(z)?0:parseFloat(z);

            camObj.pos[0] = x;
            camObj.pos[1] = y;
            camObj.pos[2] = z + heightOffset;

            listOfEntities.push(
                {
                    image : camObj.image,
                    position : Cesium.Cartesian3.fromDegrees.apply(null,camObj.pos),
                    hpr : Cesium.HeadingPitchRoll.fromDegrees(camObj.rot[0],camObj.rot[1],camObj.rot[2]),
                    inSiteType : "cameraPosition",
                    cameraProject: projectName,
                    show : false,
                    point : {
                        pixelSize : 6,
                        color : Cesium.Color.RED,
                    }
                });
          });

          if (typeof entityProcessCallback === "function"){
            entityProcessCallback.apply(null, [listOfEntities]);
          }
    }});    
}
