
export function getNearestProjectFromCamera(){
    if(INSITEProjects instanceof Array && INSITEProjects.length > 0){

        let endCartographicPoint = Cesium.Cartographic.fromCartesian(viewer.camera.position);
        let projectDistanceObjList = [];

        INSITEProjects.forEach(function(project){

            let dataArray = project.data;
            let distance = -1;

            if(dataArray instanceof Array && dataArray.length > 0){
                dataArray.forEach(function(data){
                    if(data.center){
                        let startCartographicPoint = Cesium.Cartographic.fromCartesian(data.center);
                        let ellipsoidGeodesic = new Cesium.EllipsoidGeodesic(startCartographicPoint, endCartographicPoint );
                        let tmpDistance = ellipsoidGeodesic.surfaceDistance;
                        //selecting the nearest one
                        if(distance === -1 || tmpDistance < distance){
                            distance = tmpDistance;
                        }
                    }

                })

                if(distance != -1){
                    projectDistanceObjList.push({
                        name: project.name,
                        distance: distance
                    });
                }              
            }
        })

        if(projectDistanceObjList.length > 0){
            projectDistanceObjList.sort((x,y)=>{return x.distance-y.distance});
            return projectDistanceObjList[0].name;
        } else{
            return insiteActiveProject;
        }

    }
}

export function createHPRfromDegrees(h,p,r) {
    return Cesium.HeadingPitchRoll.fromDegrees(h,p,r, new Cesium.HeadingPitchRoll());
}

export function calcAngleBetweenHeadingPitchRollRadians(hpr1, hpr2) {
   
    if(!(hpr1 instanceof Cesium.HeadingPitchRoll) || !(hpr2 instanceof Cesium.HeadingPitchRoll)){
        throw "Invalid input";
    }    
   
    var q1 = Cesium.Quaternion.fromHeadingPitchRoll(hpr1);
    var q2 = Cesium.Quaternion.fromHeadingPitchRoll(hpr2);

    Cesium.Quaternion.normalize(q1,q1);
    Cesium.Quaternion.normalize(q2,q2);

    var q1inv = Cesium.Quaternion.inverse(q1, new Cesium.Quaternion());
    var qDiff = Cesium.Quaternion.multiply(q1inv, q2, new Cesium.Quaternion());

    var angleRadians = Cesium.Quaternion.computeAngle(qDiff) % Cesium.Math.TWO_PI;  

    if (angleRadians > Cesium.Math.PI) {
        angleRadians = Cesium.Math.TWO_PI - angleRadians;
    }

    return angleRadians;
}

export function getClickPositionCartesian(viewer, screenPosition) {
   if (!viewer.scene.pickPositionSupported) {
        console.warn("pickPosition not supported!");
        return;
    }

    var clickCartesian;
    var pickedObject = viewer.scene.pick(screenPosition);
    if (pickedObject) {
        clickCartesian = viewer.scene.pickPosition(screenPosition);
    } else {
        var ray = viewer.camera.getPickRay(screenPosition);
        clickCartesian = viewer.scene.globe.pick(ray, viewer.scene);
    }
    return clickCartesian;
}

export function inSiteLoad3DTiles(viewer, url_, name_, heightOffset_, camerasXML_, _clampToGround) {
    
    _clampToGround = !!_clampToGround;

    var tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: url_,
        geometricError : 0.001
    }));
    tileset.maximumScreenSpaceError = 1; // maybe temp... too high (low number)?

    var data = new INSITEDataset(); // TODO: AC: replace the code chunk below with the new INSITEData({path:url_, type:INSITEDataType.TILE3D, heightOffset:heightOffset_}) syntax as soon as I figure it out

    // TEMP: offset height (there is probably a much simpler way of doing this)
    // and will be a different value for real heights vs ellipsoid
    tileset.readyPromise.then(function(tileset) {

        if(_clampToGround) {

            heightOffset_ = 0;
        }

        var cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
        var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset_);
        var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
      
        siteMarkers.create({
           center: tileset.boundingSphere.center.clone()
        })

        data.center = tileset.boundingSphere.center.clone();

    }).otherwise(function(error) {
        throw(error);
    });

    var newProject = new INSITEProject(); //({name:name_});
    newProject.name = name_;
    
    data.path = url_;
    data.type = INSITEDataType.TILE3D;
    data.heightOffset = heightOffset_;
    data.dataObject = tileset;
    
    newProject.data.push(data);
    INSITEProjects.push(newProject);

    if (camerasXML_) {
        // TODO: modify insiteReadCamerasXML() to handle all this internally rather than passing a function object, makes it complex for the client code
        insiteReadCamerasXML(name_, camerasXML_, heightOffset_, function(listOfEntities){
          if(listOfEntities instanceof Array){
            listOfEntities.forEach(function(item){
              viewer.entities.add(item);
            })
          }
        });
    }

    add3DTileLoadIndicator(tileset);

    return tileset;
}

function add3DTileLoadIndicator(tileset) {

    tileset.loadProgress.addEventListener(function(numberOfPendingRequests, numberOfTilesProcessing) {

        let progressBarInstance = $( "#loadingBar" ).progressbar( "instance" );
        if(!progressBarInstance) {
            progressBarInstance = $( "#loadingBar" ).progressbar({value: 100, max: 100});

        } else {
            
            if($( "#loadingBar" ).progressbar( "option", "disabled" )) {

                $( "#loadingBar" ).progressbar( "enable" );
            }
        }

        if ((numberOfPendingRequests === 0) && (numberOfTilesProcessing === 0)) {
            
            $( "#loadingBar" ).progressbar( "disable" );
            return;
        }

        $( "#loadingBar" ).progressbar( "option", "max", numberOfPendingRequests );
        $( "#loadingBar" ).progressbar( "option", "value", numberOfTilesProcessing );
        
    });
}

export function inSiteLoadOrtho(viewer, url_, name_, lodMin, lodMax)
{
    var layer = viewer.imageryLayers.addImageryProvider(Cesium.createTileMapServiceImageryProvider({
        url : url_,
        minimumLevel : lodMin,
        maximumLevel : lodMax,
        rectangle    : Cesium.Rectangle.fromDegrees(150.77727425, -33.82400461, 150.79686701, -33.81453397),
    }));

    var newProject = new INSITEProject(); //({name:name_});
    newProject.name = name_;
    var data = new INSITEDataset(); // TODO: AC: replace the code chunk below with the new INSITEData({path:url_, type:INSITEDataType.TILE3D, heightOffset:heightOffset_}) syntax as soon as I figure it out
    data.path = url_;
    data.type = INSITEDataType.ORTHO;
    data.dataObject = layer;
    newProject.data.push(data);
    INSITEProjects.push(newProject);

    return layer;
}

export function addHeightToCartesian(cartesian, heightOffset_) {

    heightOffset_ = isNaN(heightOffset_)? 0 : Number(heightOffset_) || 0;

    if(!cartesian){
        return cartesian;
    }

    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    cartographic.height += heightOffset_;

    return Cesium.Cartographic.toCartesian(cartographic, 
                Cesium.Ellipsoid.WGS84, 
                new Cesium.Cartesian3()
                );
}

export function setHeightToCartesian(cartesian, heightOffset_) {

    heightOffset_ = isNaN(heightOffset_)? 0 : Number(heightOffset_) || 0;

    if(!cartesian){
        return cartesian;
    }

    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    cartographic.height = heightOffset_;

    return Cesium.Cartographic.toCartesian(cartographic, 
                Cesium.Ellipsoid.WGS84, 
                new Cesium.Cartesian3()
                );
}

function addHeightToEntity(entity, heightOffset_) {

    heightOffset_ = isNaN(heightOffset_)? 0 : Number(heightOffset_) || 0;

    if(entity.polyline && heightOffset_) {

        let positions = [];
        
        entity.polyline.positions.getValue().forEach(function(item, index) {
            positions.push(addHeightToCartesian(item, heightOffset_));
        })

        entity.polyline.positions = positions;
    }

    if(entity.polygon) {

        entity.polygon.height += heightOffset_;
    }

    if(entity.ellipse) {

        entity.ellipse.height += heightOffset_;
    }

    if(entity.rectangle) {

        entity.rectangle.height += heightOffset_;
    }

    if(entity.corridor) {

        entity.corridor.height += heightOffset_;
    }
}

function setHeightToEntity(entity, heightOffset_) {

    heightOffset_ = isNaN(heightOffset_)? 0 : Number(heightOffset_) || 0;

    if(entity.polyline) {

        let positions = [];
        
        entity.polyline.positions.getValue().forEach(function(item, index) {
            positions.push(setHeightToCartesian(item, heightOffset_));
        })

        entity.polyline.positions = positions;
    }

    if(entity.polygon) {

        entity.polygon.height = heightOffset_;
    }

    if(entity.ellipse) {

        entity.ellipse.height = heightOffset_;
    }
    
    if(entity.rectangle) {

        entity.rectangle.height = heightOffset_;
    }

    if(entity.corridor) {

        entity.corridor.height = heightOffset_;
    }

}

function makeEntityClampToGround(entity) {

    if(entity.polyline) {
        //setHeightToEntity(entity, 0);
        entity.polyline.clampToGround = true;
    }

    if(entity.billboard) {

        entity.billboard.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    } 

    if(entity.corridor) {
        
        entity.corridor.outline = false;
        
        if(!entity.corridor.fill 
            || (entity.corridor.fill && !entity.corridor.fill.getValue())) {
            entity.corridor.fill = true;
            if(!entity.corridor.material) {
                entity.corridor.material = Cesium.Color.BLUE.withAlpha(0.5);
            }
        }

        if(entity.corridor.height === 0 
            || (entity.corridor.height && entity.corridor.height.getValue() === 0)){
            entity.corridor.height = undefined;
        }

        entity.corridor.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    }  

    if(entity.label) {

        entity.label.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    }

    if(entity.model) {

        entity.model.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    }

    if(entity.point) {

        entity.point.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    }

    if(entity.rectangle) {
        
        entity.rectangle.outline = false;
        
        if(!entity.rectangle.fill 
            || (entity.rectangle.fill && !entity.rectangle.fill.getValue())) {
            entity.rectangle.fill = true;
            if(!entity.rectangle.material) {
                entity.rectangle.material = Cesium.Color.BLUE.withAlpha(0.5);
            }
        }

        if(entity.rectangle.height === 0 
            || (entity.rectangle.height && entity.rectangle.height.getValue() === 0)){
            entity.rectangle.height = undefined;
        }

        entity.rectangle.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    }

    if(entity.ellipse) {

        entity.ellipse.outline = false;
        
        if(!entity.ellipse.fill 
            || (entity.ellipse.fill && !entity.ellipse.fill.getValue())) {
            entity.ellipse.fill = true;
            if(!entity.ellipse.material) {
                entity.ellipse.material = Cesium.Color.BLUE.withAlpha(0.5);
            }
        }

        if(entity.ellipse.height === 0 
            || (entity.ellipse.height && entity.ellipse.height.getValue() === 0)){
            entity.ellipse.height = undefined;
        }

        entity.ellipse.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    } 

    if(entity.polygon) {
        entity.polygon.perPositionHeight = false;
        entity.polygon.outline = false;
        
        if(!entity.polygon.fill 
            || (entity.polygon.fill && !entity.polygon.fill.getValue())) {
            entity.polygon.fill = true;
            if(!entity.polygon.material) {
                entity.polygon.material = Cesium.Color.BLUE.withAlpha(0.5);
            }
        }

        if(entity.polygon.height === 0 
            || (entity.polygon.height && entity.polygon.height.getValue() === 0)){
            entity.polygon.height = undefined;
        }

        entity.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    } 

}

export function inSiteLoadKML(viewer, url_, name_, heightOffset_, _clampToGround) {
    let kmlPromise = viewer.dataSources.add(Cesium.KmlDataSource.load(url_, {camera:viewer.scene.camera, canvas:viewer.scene.canvas}));    
    _clampToGround = !!_clampToGround;
    var newProject = new INSITEProject(); //({name:name_});
    newProject.name = name_;
    var data = new INSITEDataset(); // TODO: AC: replace the code chunk below with the new INSITEData({path:url_, type:INSITEDataType.TILE3D, heightOffset:heightOffset_}) syntax as soon as I figure it out
    data.path = url_;
    data.type = INSITEDataType.KML;   
    newProject.data.push(data);
    INSITEProjects.push(newProject);

    kmlPromise.then(function(kml) {

        kml.entities.values.forEach(function(item, index) {

            if(_clampToGround) {

                //only polyline, polygon, ellipse, rectangle and corridor are supported
                makeEntityClampToGround(item);
            } else {

                //add the height offset to the entity
                //only polyline, polygon, ellipse, rectangle and corridor are supported
                addHeightToEntity(item, heightOffset_);
            }
                      
        })

        data.dataObject = kml;
    });
}

/// TEMP: adding this function as a temp thing for the Jemena demo, will re-do properly later, as part of the move to multi-dataset projects
export function insiteLoadMeshObject(viewer, url_, name_, lat, lon, height, scale_, heading) {
    var newProject = new INSITEProject();
    newProject.name = name_;
    var data = new INSITEDataset(); // TODO: AC: replace the code chunk below with the new INSITEData({path:url_, type:INSITEDataType.TILE3D, heightOffset:heightOffset_}) syntax as soon as I figure it out
    data.path = url_;
    data.type = INSITEDataType.OBJ3D;   
    newProject.data.push(data);
    INSITEProjects.push(newProject);

    var position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    var heading  = Cesium.Math.toRadians(heading);
    var pitch = 0;
    var roll  = 0;
    var hpr   = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    data.dataObject = viewer.entities.add({
        name : url_,
        position : position,
        orientation : orientation,
        model : {
            uri : url_,
            scale : scale_,
        }
    });

}
/// END TEMP


export function inSiteGetProject(name) {
    return INSITEProjects.find(x => x.name === name); // could be null
}

function getMidPoint(left, right){

    const result = new Cesium.Cartesian3();

    result.x = (left.x + right.x) * 0.5;
    result.y = (left.y + right.y) * 0.5;
    result.z = (left.z + right.z) * 0.5;

    return result;
}

function flyPointToData(start, end, duration, endData) {

    let firstDestination = start;
    let secondDestination = end;
    let distance = Cesium.Cartesian3.distance(firstDestination, secondDestination);

    let midPoint = getMidPoint(firstDestination, secondDestination);

    firstDestination = Cesium.Cartographic.fromCartesian(midPoint);
    secondDestination = Cesium.Cartographic.fromCartesian(secondDestination);

    firstDestination.height = distance;
    secondDestination.height = 500;
     

    viewer.camera.flyTo({
        duration: duration/2,
        destination : Cesium.Cartographic.toCartesian(firstDestination),
        orientation: {
              heading : Cesium.Math.toRadians(0.0),
              pitch : Cesium.Math.toRadians(-90),
              roll : 0.0
        },
        easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
        complete : function() {
            setTimeout(function() {
                
                 viewer.flyTo(endData, {
                    duration: duration/2,
                    offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(0.0), Cesium.Math.toRadians(-90), 0.0),
                });

            }, 10);
        }
    });
    
}

export function inSiteJumpToLocation(name, duration) { // 'Ausgrid: Frenchs Forest'
    
    if(insiteActiveProject === name) return;

    duration = isNaN(duration)?0:Number(duration);

    let project = inSiteGetProject(name);
    if (!project) {
      console.log("error: location '" + name + "' not found in INSITEProjects");
      return;
    }

    let previousProject = inSiteGetProject(insiteActiveProject);;

    insiteActiveProject = name;

    // TODO: the code below currently assumes one dataset in each project, needs expanding to the combined volume of all datasets within a project, i.e. fix all instances of "project.data[0]"
    switch (project.data[0].type) {
        case INSITEDataType.ORTHO:
            
            let layer = project.data[0].dataObject;
            if(duration){
                viewer.camera.flyTo({  duration:duration, destination : Cesium.Rectangle.fromDegrees(150.77727425, -33.82400461, 150.79686701, -33.81453397) });  // TEMP    
            }
            else{
                viewer.camera.setView({  destination : Cesium.Rectangle.fromDegrees(150.77727425, -33.82400461, 150.79686701, -33.81453397) });  // TEMP
            }
            
            break;
        case INSITEDataType.TILE3D:
            let tileset = project.data[0].dataObject;
            tileset.readyPromise.then(function(tilesetData) {
                if(duration) {
                    insiteTopDownView();
                   
                    setTimeout(function() {

                        let firstDestination = previousProject.data[0].center;
                        let secondDestination = project.data[0].center;
                        
                        flyPointToData(firstDestination, secondDestination, duration, tilesetData);

                    }, 300);

                } else {
                    viewer.camera.viewBoundingSphere(tilesetData.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0));
                    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
                }
            
            });
            break;
        case INSITEDataType.KML:
            
            if(!duration){

                viewer.zoomTo( project.data[0].dataObject, 
                    new Cesium.HeadingPitchRange(Cesium.Math.toRadians(0.0), Cesium.Math.toRadians(-90), 0.0)
                    ).then(function() {
                    
                    //trick to get the center for kml source
                    //right now don't know how to get center from kml data
                    if(!project.data[0].center){

                            project.data[0].center = getCurrentMapCenter();

                            if(project.data[0].center) {

                                siteMarkers.create({
                                   center: project.data[0].center
                                })
                            }
                    }
                });

            } else {

                let firstDestination = previousProject.data[0].center;
                let secondDestination = project.data[0].center;

                if(firstDestination && secondDestination) {

                    flyPointToData(firstDestination, secondDestination, duration, project.data[0].dataObject);
                } else {

                    viewer.flyTo( project.data[0].dataObject, {
                    duration: duration,
                    offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(0.0), Cesium.Math.toRadians(-90), 0.0)
                    }).then(function() {
                        
                        //trick to get the center for kml source
                        //right now don't know how to get center from kml data
                        if(!project.data[0].center){

                                project.data[0].center = getCurrentMapCenter();

                                if(project.data[0].center) {

                                    siteMarkers.create({
                                       center: project.data[0].center
                                    })
                                }
                        }
                    });
                }
            }
            break;
    }

    insiteLoadAnnotations(insiteActiveProject);
}

export function inSiteShowHideEntitiesByType(show, type) {
 //inSiteType : "cameraPosition",
    var id;
    for (id in viewer.entities.values) {
        var entity = viewer.entities.values[id]
        //console.log("entity: " + entity);
        if (entity.hasOwnProperty("inSiteType")) {
          //console.log("  inSiteType: " + entity.inSiteType);
          if (entity.inSiteType == "cameraPosition") {
            entity.show = show;
          }
        }
    }
}

export function inSiteShowEntitiesByType(type) {
    inSiteShowHideEntitiesByType(true, type);
}

export function inSiteHideEntitiesByType(type) {
    inSiteShowHideEntitiesByType(false, type);
}

export function ImageSource(filename, x, y, z, heading, pitch, roll) {
    this.filename = filename;
    this.x = x;
    this.y = y;
    this.z = z;
    this.heading = heading;
    this.pitch = pitch;
    this.roll = roll;
}

export function createModel(url_, lat, lon, height, scale_, heading) {
    //viewer.entities.removeAll();

    var position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    var heading  = Cesium.Math.toRadians(heading);
    var pitch = 0;
    var roll  = 0;
    var hpr   = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    var entity = viewer.entities.add({
        name : url_,
        position : position,
        orientation : orientation,
        model : {
            uri : url_,
            scale : scale_,
        }
    });
}

export function insiteConsole(text) {
  document.getElementById('statusBar').innerHTML = text; 
  // TODO: and log it somewhere...
  // TODO: allow for expansion of this to a multi-line text area to see previous messages
}

/*function angleBetweenVectors(first, second) {
  // note: I think this code has not been tested, written for camera angle matching but we used quaternions in the end
  // We are using the dot for the angle.
  // Then the cross and the dot for the sign.
  const a = new Cesium.Cartesian3();
  const b = new Cesium.Cartesian3();
  const c = new Cesium.Cartesian3();
  Cesium.Cartesian3.normalize(first, a);
  Cesium.Cartesian3.normalize(second, b);
  Cesium.Cartesian3.cross(a, b, c);

  const cosine = Cesium.Cartesian3.dot(a, b);
  const sine = Cesium.Cartesian3.magnitude(c);

  // Sign of the vector product and the orientation normal
  const angle = Math.atan2(sine, cosine);
  return angle;
};*/
export function getURLParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

