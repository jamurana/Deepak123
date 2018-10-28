
function insiteAnnotationNameChange() { 
// note: initially tried .change() but it didn't fire when selecting between entities so can leave changes unsaved
    if (viewer.selectedEntity) {
      var annotation = viewer.selectedEntity.annotation;
      annotation.name = $("#annotation_name").val();
      console.log("Annotation name saved: " + annotation.name)
    }
}

export function insiteGetDistanceString(d){
      
      d = Number(d);

      if(d >= 1e3) {

        return (d * 0.001 ).toFixed(2).toString() + "km";
      } else {

        return d.toFixed(2).toString() + "m";
      }
}

export function insiteGetLineMeasurementInfo(points) {

  let returnObj = {};

  if((points instanceof Array) === false || points.length < 2) {
    return returnObj;
  }

  var pos1Cartographic = Cesium.Cartographic.fromCartesian(points[0]);
  var pos2Cartographic = Cesium.Cartographic.fromCartesian(points[1]);

  var firstpointFlat  = Cesium.Cartographic.clone(pos1Cartographic, new Cesium.Cartographic);
  var secondpointFlat = Cesium.Cartographic.clone(pos2Cartographic, new Cesium.Cartographic);
  firstpointFlat.height  = 0.0;
  secondpointFlat.height = 0.0;
  var ellipsoidGeodesic1 = new Cesium.EllipsoidGeodesic(pos1Cartographic, pos2Cartographic);
  var hDistance = ellipsoidGeodesic1.surfaceDistance;
  returnObj.run = hDistance;

  var vDistance = (pos2Cartographic.height - pos1Cartographic.height);
  returnObj.rise = Math.abs(vDistance);

  var slope = (vDistance / hDistance) * 100;
  var degrees = Cesium.Math.toDegrees(Math.atan(vDistance / hDistance));
  var slopeString = degrees.toFixed(2) + "° (" + slope.toFixed(2) + "%)";
  returnObj.slopeDegrees = degrees.toFixed(2);
  returnObj.slopePercentage = slope.toFixed(2);
  returnObj.slopeString = slopeString;

  var ellipsoidGeodesic2 = new Cesium.EllipsoidGeodesic(pos1Cartographic, pos2Cartographic);
  returnObj.surfaceDistance = ellipsoidGeodesic2.surfaceDistance;

  returnObj.distance = Cesium.Cartesian3.distance(points[0], points[1]);
  returnObj.distanceString = insiteGetDistanceString(returnObj.distance);

  return returnObj;
}

function insiteGetLineInfoFromAnnotation(annotation) {

  return insiteGetLineMeasurementInfo(annotation.points);
}

function insiteGetBodyFromAnnotation(annotation) {

  let defaultrResult = '<b>Annotation:</b> <br> \
         <br> \
         <form class="annotation_form" action="javascript:void(0);"> \
           <label>Name:</label><br> \
           <input id="annotation_name" type="text" autocomplete="off"><br><br> \
           <label>Comments:</label><br> \
           <textarea id="annotation_desc" type="text" rows=4 disabled>(comments are not active yet)</textarea> \
         </form>';

  let result = '';

  let annotationType = annotation.type;

  let name = annotation.name || "";
  let comments = annotation.comments instanceof Array? annotation.comments.join("\n") : (annotation.comments || "");
  let label = annotation.label || "";

  switch(annotationType) {
    //TEMP FOR JEMENA
    case INSITEAnnotationType.LINE_BURIED:
    {
      let pointLocationString = '';

      let coor = (annotation.points instanceof Array 
                    && annotation.points.length > 0) ? annotation.points[0] : null;

      if(coor) {
        let cartographic    = Cesium.Cartographic.fromCartesian(coor);
        let longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(8);
        let latitudeString  = Cesium.Math.toDegrees(cartographic.latitude ).toFixed(8);
        let altitudeString  = cartographic.height.toFixed(4);

        pointLocationString = "<label>Longitude: <span>" + longitudeString + "</span></label><br>";
        pointLocationString += "<label>Latitude: <span>" + latitudeString + "</span></label><br>";
        pointLocationString += "<label>Height: <span> " + altitudeString + "</span></label><br>";
      }
      
      result = '<b>Pipeline Depth Tool:</b> <br> <br> ' + 
         '<form class="annotation_form" action="javascript:void(0);"> ' + 
           pointLocationString +
           '<label>Elevation Profile:</label><br> ' + 
           '<img class="img-annotation" src="images/TEMP_pipeline_depth_tool_mockup.png"></img><BR>' +
           '<label>Cross-Section:</label><br> ' + 
           '<img class="img-annotation" src="images/TEMP_pipeline_depth_tool_mockup2.png"></img>' +
         '</form>';
       }
      break;
    case INSITEAnnotationType.POINT:

      let pointLocationString = '';

      let coor = (annotation.points instanceof Array 
                    && annotation.points.length > 0) ? annotation.points[0] : null;

      if(coor) {
        let cartographic    = Cesium.Cartographic.fromCartesian(coor);
        let longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(8);
        let latitudeString  = Cesium.Math.toDegrees(cartographic.latitude ).toFixed(8);
        let altitudeString  = cartographic.height.toFixed(4);

        pointLocationString = "<label>Longitude: <span>" + longitudeString + "</span></label> <br>";
        pointLocationString += "<label>Latitude: <span>" + latitudeString + "</span></label> <br>";
        pointLocationString += "<label>Height: <span> " + altitudeString + "</span></label> <br>";
      }
      
      result = '<b>Annotation:</b> <br> <br> ' + 
         '<form class="annotation_form" action="javascript:void(0);"> ' + 
           '<label>Name:</label><br> ' + 
           '<input id="annotation_name" type="text" value="' + name + '" autocomplete="off"><br><br> ' + 
           pointLocationString +
           '<label>Comments:</label><br> ' + 
           '<textarea id="annotation_desc" type="text" rows=4 disabled>(comments are not active yet)' + 
           '</textarea> ' + 
         '</form>';
      break;
    case INSITEAnnotationType.LINE_RISE:
    case INSITEAnnotationType.LINE_RUN:
    case INSITEAnnotationType.LINE:

      let lineLocationString = '';
      let lineObj = (annotation.points instanceof Array 
                    && annotation.points.length > 0) ? insiteGetLineInfoFromAnnotation(annotation) : null;

      if(lineObj) {

        lineLocationString = "<label>Slope: <span>" + lineObj.slopeString + "</span></label> <br>";
        lineLocationString += "<label>Rise in metre: <span>" + lineObj.rise.toFixed(2) + "</span></label> <br>";
        lineLocationString += "<label>Run in metre: <span>" + lineObj.run.toFixed(2) + "</span></label> <br>";
        
        if(lineObj.distance >= 1e6) {

          lineLocationString += "<label>Distance in km(accounting curve): <span>" + (lineObj.surfaceDistance/1e3).toFixed(2)  + "</span></label> <br>";
        }

        if(lineObj.distance >= 1e3) {
          lineLocationString += "<label>Distance in km: <span>" + (lineObj.distance/1e3).toFixed(2)  + "</span></label> <br>";
        } else {
          lineLocationString += "<label>Distance in meter: <span>" + lineObj.distance.toFixed(2) + "</span></label> <br>";
        }
        
      }

      result = '<b>Annotation:</b> <br> <br> ' + 
         '<form class="annotation_form" action="javascript:void(0);"> ' +           
           '<label>Name:</label><br> ' + 
           '<input id="annotation_name" type="text" value="' + name + '" autocomplete="off"><br><br> ' + 
           lineLocationString +
           '<label>Comments:</label><br> ' + 
           '<textarea id="annotation_desc" type="text" rows=4 disabled>(comments are not active yet)' + 
           '</textarea> ' + 
         '</form>';
      break;
    case INSITEAnnotationType.AREA:

      let areaLocationString = '';
      let areaObj = (annotation.points instanceof Array 
                    && annotation.points.length > 0) ? areaMeasurement.getArea(annotation.points) : null;

      if(areaObj) {

        areaLocationString = "<label>Area in hectares: <span>" + areaObj.areaInHectare + "</span></label> <br>";
        
        if(areaObj.areaInMeter >= 1e6) {
          areaLocationString += "<label>Area in square km: <span>" + (areaObj.areaInMeter/1e6).toFixed(2)  + "</span></label> <br>";
        } else {
          areaLocationString += "<label>Area in square meters: <span>" + areaObj.areaInMeter + "</span></label> <br>";
        }
        
      }

      result = '<b>Annotation:</b> <br> <br> ' + 
         '<form class="annotation_form" action="javascript:void(0);"> ' +           
           '<label>Name:</label><br> ' + 
           '<input id="annotation_name" type="text" value="' + name + '" autocomplete="off"><br><br> ' + 
           areaLocationString +
           '<label>Comments:</label><br> ' + 
           '<textarea id="annotation_desc" type="text" rows=4 disabled>(comments are not active yet)' + 
           '</textarea> ' + 
         '</form>';
      break;
    default:{

    }
  }

  return (result || defaultrResult);

}

export function insiteShowAnnotationPanel(entity) {

  var cachedHeight = 0;
  var cachedWidth  = 0;
  let infoBody = '<b>Annotation:</b> <br> \
         <br> \
         <form class="annotation_form" action="javascript:void(0);"> \
           <label>Name:</label><br> \
           <input id="annotation_name" type="text" autocomplete="off"><br><br> \
           <label>Comments:</label><br> \
           <textarea id="annotation_desc" type="text" rows=4 disabled>(comments are not active yet)</textarea> \
         </form>';

  if($("#infopanel").resizable( "instance" )) {
    cachedWidth  = $("#annotation_desc").width();
    cachedHeight = $("#annotation_desc").height();
  }
  
  
  if (entity && entity.hasOwnProperty("annotation")) {

    infoBody = insiteGetBodyFromAnnotation(entity.annotation);
    /*var annotation = entity.annotation;
    $("#annotation_name").val(annotation.name);*/
  } else {
    console.log("Error: insiteShowAnnotationPanel() passed null entity or missing annotation property");
  }

  $("#infopanel>.nano-content").html(infoBody);
  $("#infopanel").show();
  $("#annotation_name").keyup(insiteAnnotationNameChange);


  if($("#infopanel").resizable( "instance" )) {
    $("#infopanel").resizable( "destroy" );
    //$("#annotation_desc").width(cachedWidth);
    //$("#annotation_desc").height(cachedHeight);
  }
  $("#infopanel").resizable({
                          resizeHeight: false,
                          autoHide:     false,
                          containment:  "#appContainer",
                          //alsoResize:   "#annotation_desc",
                          minHeight:    300,
                          minWidth:     250,
                          handles:      "se",
                        });

  $("#annotation_name").focus();

  $("#infopanel").nanoScroller({ scroll: 'top' });
}

export function inSiteRefreshEntitiesFromAnnotations() {
    insiteClearAllEntities();

    let project = inSiteGetProject(insiteActiveProject);
    project.annotations.forEach(function (annotation) {
        //if (!annotation.entityID) {
        //    annotation.entity = annotation.createEntity();
        //}
        var entity = viewer.entities.add(insiteCreateAnnotationEntity(annotation));
        annotation.entityID = entity.id;
        insiteAnnotationEntityIDs.push(entity.id);
    });
}

export function insiteClearAllEntities() {
// removes all Cesium entities managed by inSite (does not remove the annotations, only the cesium entities for them)
  var id;
  for (id in insiteAnnotationEntityIDs) {
    viewer.entities.removeById(insiteAnnotationEntityIDs[id]);
  }
  insiteAnnotationEntityIDs.length = 0;
}

export function insiteDeleteAllProjectAnnotations(projectname) {
// TODO: currently clears them all with no confirmation, we will need to hook this into permissions to only
// delete the ones owned or allowed, and give a warning
    let project = inSiteGetProject(projectname);
    if (project) {
       project.annotations.length = 0;
    }
    insiteClearAllEntities();
    insiteSaveAnnotations(insiteActiveProject); // TEMP?
}

export function insiteDeleteAnnotation(projectname, annotation) {
    let project = inSiteGetProject(projectname);
    if (project) {
      var index = project.annotations.indexOf(annotation);
      if (index !== -1) {
        project.annotations.splice(index, 1);
      }
    }
}

export function insiteSaveAnnotations(projectname) {
/// this is likely only temporary, TBD when we explore the wider user data loading/saving
    console.log("saving annotations for project: " + projectname)
    let project = inSiteGetProject(projectname);
    if (project && project.annotations) {
        insiteUserData.setGlobalData("annotations:"+projectname, project.annotations);
        console.log("saved " + project.annotations.length + " annotations");
    }
}

export function insiteLoadAnnotations(projectname) {
/// this is likely only temporary, TBD when we explore the wider user data loading/saving
    console.log("loading annotations for project: " + projectname)
    let project = inSiteGetProject(projectname);
    if (project) {
        project.annotations = insiteUserData.getGlobalData("annotations:"+projectname);
        if (project.annotations == null) {
          project.annotations = []
        }
        console.log("loaded " + project.annotations.length + " annotations");
        inSiteRefreshEntitiesFromAnnotations();
    }
}

function insiteCreateAnnotationEntity(annotation) {
    var entity = null;
    switch (annotation.type) {
        //TEMP FOR JEMENA
        case INSITEAnnotationType.LINE_BURIED:
            entity = {
              position  : annotation.points[0],
              billboard : {
                  image : pinBuilder.fromColor(Cesium.Color.GREEN, 32).toDataURL(),
                  verticalOrigin : Cesium.VerticalOrigin.BOTTOM
              },
              inSiteType : "annotationLineBuried",
              annotation : annotation,
          };
          return entity;
        case INSITEAnnotationType.POINT:
            entity = {
              position  : annotation.points[0],
              billboard : {
                  image : pinBuilder.fromColor(Cesium.Color.ROYALBLUE, 32).toDataURL(),
                  verticalOrigin : Cesium.VerticalOrigin.BOTTOM
              },
              inSiteType : "annotationPoint",
              annotation : annotation,
          };
          return entity;
        case INSITEAnnotationType.LINE_RUN:
            entity = {
              polyline : {
                  positions : [annotation.points[0], annotation.points[1]],
                  width : 1,
                  material : new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.YELLOW.withAlpha(0.7),
                    dashLength: 16.0,
                    dashPattern: 255.0
                  }),
                  /*depthFailMaterial : new Cesium.PolylineGlowMaterialProperty({
                    color: new Cesium.Color(1.0, 0.0, 0.0, 0.3)
                  }),*/
              },
              inSiteType : "annotationLineRun",
              annotation : annotation,
            };
            if (annotation.label) {
              var midPoint = new Cesium.Cartesian3((annotation.points[0].x+annotation.points[1].x)/2.0, (annotation.points[0].y+annotation.points[1].y)/2.0, (annotation.points[0].z+annotation.points[1].z)/2.0);
              var label = new Cesium.Entity({
                  position : midPoint,
                  label : {
                      text : annotation.label,
                      style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                      fillColor: Cesium.Color.WHITE,
                      backgroundColor: Cesium.Color.BLACK,
                      showBackground: true,
                      scale : 0.4,
                      pixelOffset : new Cesium.Cartesian2(0, -20),
                      eyeOffset   : new Cesium.Cartesian3(0,0,-0.1),
                  },
                  inSiteType : "annotationLabel",
                  inSiteLabelEntityID: annotation.entityID,
              });
              var labelEntity = viewer.entities.add(label);
              insiteAnnotationEntityIDs.push(labelEntity.id);
             }
            return entity;
        case INSITEAnnotationType.LINE_RISE:
            entity = {
              polyline : {
                  positions : [annotation.points[0], annotation.points[1]],
                  width : 1,
                  material : new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.YELLOW.withAlpha(0.7),
                    dashLength: 16.0,
                    dashPattern: 255.0
                  }),
                  /*depthFailMaterial : new Cesium.PolylineGlowMaterialProperty({
                    color: new Cesium.Color(1.0, 0.0, 0.0, 0.3)
                  }),*/
              },
              inSiteType : "annotationLineRise",
              annotation : annotation,
            };
            if (annotation.label) {
              var midPoint = new Cesium.Cartesian3((annotation.points[0].x+annotation.points[1].x)/2.0, (annotation.points[0].y+annotation.points[1].y)/2.0, (annotation.points[0].z+annotation.points[1].z)/2.0);
              var label = new Cesium.Entity({
                  position : midPoint,
                  label : {
                      text : annotation.label,
                      style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                      fillColor: Cesium.Color.WHITE,
                      backgroundColor: Cesium.Color.BLACK,
                      showBackground: true,
                      scale : 0.4,
                      pixelOffset : new Cesium.Cartesian2(0, -20),
                      eyeOffset   : new Cesium.Cartesian3(0,0,-0.1),
                  },
                  inSiteType : "annotationLabel",
                  inSiteLabelEntityID: annotation.entityID,
              });
              var labelEntity = viewer.entities.add(label);
              insiteAnnotationEntityIDs.push(labelEntity.id);
             }
            return entity;
        case INSITEAnnotationType.LINE:
            entity = {
              polyline : {
                  positions : [annotation.points[0], annotation.points[1]],
                  width : 12,
                  outlineWidth: 1.0,
                  material : new Cesium.PolylineArrowMaterialProperty(Cesium.Color.RED),
                  depthFailMaterial : new Cesium.PolylineArrowMaterialProperty(new Cesium.Color(1.0, 0.0, 0.0, 0.3)),
              },
              inSiteType : "annotationLine",
              annotation : annotation,
            };
            if (annotation.label) {
              var midPoint = new Cesium.Cartesian3((annotation.points[0].x+annotation.points[1].x)/2.0, (annotation.points[0].y+annotation.points[1].y)/2.0, (annotation.points[0].z+annotation.points[1].z)/2.0);
              var label = new Cesium.Entity({
                  position : midPoint,
                  label : {
                      text : annotation.label,
                      style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                      fillColor: Cesium.Color.WHITE,
                      backgroundColor: Cesium.Color.BLACK,
                      showBackground: true,
                      //outlineWidth: 12,
                      scale : 0.6,
                      pixelOffset : new Cesium.Cartesian2(0, -20),
                      eyeOffset   : new Cesium.Cartesian3(0,0,-0.1),
                      //disableDepthTestDistance: 0.1,
                  },
                  inSiteType : "annotationLabel",
                  inSiteLabelEntityID: annotation.entityID,
              });
              var labelEntity = viewer.entities.add(label);
              insiteAnnotationEntityIDs.push(labelEntity.id);
          }
            return entity;
        case INSITEAnnotationType.AREA:
            entity = {
              polygon : {
                  hierarchy : annotation.points,
                  perPositionHeight: true,
                  outline: true,
                  outlineWidth : 3,
                  material: Cesium.Color.INDIANRED.withAlpha(0.6),
                  outlineColor: Cesium.Color.BLACK,
              },
              inSiteType : "annotationArea",
              annotation : annotation,
            };
            if (annotation.label) {
              var midPoint = Cesium.BoundingSphere.fromPoints(annotation.points).center;
              var label = new Cesium.Entity({
                  position : midPoint,
                  label : {
                      text : annotation.label,
                      style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                      fillColor: Cesium.Color.WHITE,
                      backgroundColor: Cesium.Color.BLACK,
                      showBackground: true,
                      //outlineWidth: 12,
                      scale : 0.6,
                      pixelOffset : new Cesium.Cartesian2(0, -20),
                      eyeOffset   : new Cesium.Cartesian3(0,0,-0.1),
                      //disableDepthTestDistance: 0.1,
                  },
                  inSiteType : "annotationLabel",
                  inSiteLabelEntityID: annotation.entityID,
              });
              var labelEntity = viewer.entities.add(label);
              insiteAnnotationEntityIDs.push(labelEntity.id);
          }
          return entity; 
      }

    
  }
