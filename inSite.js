
/*import * from 'cesium-navigation';*/
import {INSITEUserData} from './inSite_userdata';

export var insiteUserData = new INSITEUserData();

Cesium.BingMapsApi.defaultKey = 'Aly0c2_nf6zG10QQP5tuuVCPKzFS-Kg9-UC2yJ79HdzF74tIOmdyW-jcV9UFxzt3';

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyYzdkMjlmNC00MTcxLTRmZjUtOTc3MS1jMzVjNDFiZjBkYzEiLCJpZCI6MjQ0NSwiaWF0IjoxNTMzMjY3MDI5fQ.lVlrdWByf5dvtRGX0fEWpCoQPvO8qO4c8Sy6APhP5aI';

export var defaultImageryProvider = new Cesium.BingMapsImageryProvider({
    url : 'https://dev.virtualearth.net',
    mapStyle : Cesium.BingMapsStyle.AERIAL_WITH_LABELS
});


// DEPRECATED -- https://cesium.com/blog/2018/03/01/introducing-cesium-world-terrain/
// delete this commented-out chunk after 1st September 2018
export var defaultTerrainProvider = new Cesium.EllipsoidTerrainProvider();
export var terrainProvider;
if (Cesium.VERSION >= 1.45) {
    terrainProvider = Cesium.createWorldTerrain()
} else {
    terrainProvider = new Cesium.CesiumTerrainProvider({
        url : 'https://assets.agi.com/stk-terrain/world',
        requestWaterMask : false, // required for water effects
        requestVertexNormals : true // required for terrain lighting
    });   
}

export var viewer = new Cesium.Viewer('cesiumContainer',{
    animation:false, 
    timeline:false, 
    baseLayerPicker:false, 
    homeButton:false,
    sceneModePicker:false,
    enableLighting:true, 
    shadows: false,
    //shadows: Cesium.ShadowMode.RECEIVE_ONLY, 
    depthTestAgainstTerrain:true, 
    imageryProvider: defaultImageryProvider, 
    terrainProvider: terrainProvider,
    showWaterEffect : false,
    selectionIndicator : true,
    infoBox : false,
    //geocoder: true,
});

//this will make the primitives such as 3D tiles data, billboards, polylines, labels, etc. disappear underneath it
//viewer.scene.globe.depthTestAgainstTerrain = true;

export var creditContainer = viewer.scene.frameState.creditDisplay.container;
viewer.scene.frameState.creditDisplay.destroy();
viewer.scene.frameState.creditDisplay = new Cesium.CreditDisplay(creditContainer, "    |    ");
viewer.scene.frameState.creditDisplay.addDefaultCredit(new Cesium.Credit('AUAV    |    ',   '', 'https://www.auav.com.au'));
viewer.scene.frameState.creditDisplay.addDefaultCredit(new Cesium.Credit('CESIUM    |    ', '', 'http://cesiumjs.org/'));

viewer.scene.screenSpaceCameraController.minimumZoomDistance = 0.2;

export var pinBuilder = new Cesium.PinBuilder();

//viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);   // TEMP: add 3D tiles inspector widget

// add compass widget
export var options = {};
options.defaultResetView = Cesium.Rectangle.fromDegrees(71, 3, 90, 14);
options.enableCompass= true;
options.enableZoomControls= false;
options.enableDistanceLegend= true;
options.enableCompassOuterRing= true;
viewer.extend(Cesium.viewerCesiumNavigationMixin, options);


// TEMP - load in the wind turbine model
//createModel('http://localhost:8080/DATA/wind_turbine.glb', 0, 0.01);
//createModel('http://localhost:8080/DATA/mod_wind_turbine.glb', 0, 0.1);
//createModel('http://localhost:8080/DATA/mod_wind_turbine_blade1.glb', 0, 0.1);



// show data output in top-left, e.g. project, lat/lon coords under mouse pointer, etc
export var coordsDisplay = document.createElement('div');
coordsDisplay.id = 'divUpperLeft';
coordsDisplay.innerHTML = "";
document.getElementById("cesiumContainer").appendChild(coordsDisplay);
export var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

export var dragging = false;

handler.setInputAction(function(){
    dragging = true;
}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

handler.setInputAction(function(){
    dragging = true;
}, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);

handler.setInputAction(function(){
    dragging = false;

    if ($("#imagePanel").is(":visible")) {
        insiteUpdateImagePanel();
    }
}, Cesium.ScreenSpaceEventType.LEFT_UP);

handler.setInputAction(function(){
    dragging = false;

    if ($("#imagePanel").is(":visible")) {
        insiteUpdateImagePanel();
    }
}, Cesium.ScreenSpaceEventType.MIDDLE_UP);


export function insiteUpdateDataDisplay(movement) {
    var longitudeString = "";
    var latitudeString  = "";
    var xString         = "";
    var yString         = "";
    var altitudeString  = "";
    var camString = "(heading: " + Cesium.Math.toDegrees(viewer.camera.heading).toFixed(6) + ", pitch: " + Cesium.Math.toDegrees(viewer.camera.pitch).toFixed(6) + ", roll: " + Cesium.Math.toDegrees(viewer.camera.roll).toFixed(6) +")"; // TEMP
    var projectString = "";
    if (movement) {
        var cartesian = getClickPositionCartesian(viewer, movement.endPosition);
        if (cartesian) {
            var cartographic    = Cesium.Cartographic.fromCartesian(cartesian);
            longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(8);
            latitudeString  = Cesium.Math.toDegrees(cartographic.latitude ).toFixed(8);
            xString         = cartesian.x.toFixed(8);
            yString         = cartesian.y.toFixed(8);
            altitudeString  = cartographic.height.toFixed(4);
        }
    }
    insiteActiveProject = getNearestProjectFromCamera();
    if (insiteActiveProject) {
        projectString = insiteActiveProject;
    }
    var text =
    'Project: ' + projectString + '<br>' +
    'Cam Dir: ' + camString + '<br>' +
    'Lon:     ' + longitudeString + '<br>' +
    'Lat:     ' + latitudeString  + '<br>' +
    'X:       ' + xString + '<br>' +
    'Y:       ' + yString + '<br>' +
    'Alt:     ' + altitudeString + "m" + '<br>' 
    ;       
    coordsDisplay.innerHTML = text;

    if ($("#imagePanel").is(":visible") && dragging) {
        insiteUpdateImagePanel(dragging);
    }
}
handler.setInputAction(insiteUpdateDataDisplay, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
$( document ).ready(function() {
    insiteUpdateDataDisplay();
});



// MEASUREMENT TOOLS
// TODO: distance tool needs to take into account curvature of the earth for longer distances
// TODO: need to refactor how this works, a lot of specific logic and details embedded in a very general event handler here
// export var activeTool = undefined;
window["activeTool"] = undefined;
export var panelsOpen = []
export var insiteAnnotationEntityIDs = []
export var isMidAction = false;
export var measureFirstPos = false;
export var handler2 = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler2.setInputAction(function(click) 
{
    //hiding the context menu
    contextMenuController.setLocation(undefined);
    
    // handle clicking on entities, e.g. camera positions
    var pickedObject = viewer.scene.pick(click.position);
    var pickedAnnotationType = false;
    if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
        // clicking a camera position -- update the image panel to show that camera's image
        if (pickedObject.id.hasOwnProperty("inSiteType")) {
          if (pickedObject.id.inSiteType == "cameraPosition") {
            image = pickedObject.id.image;
            insiteConsole("### camera: " + image); // TEMP
            setImageSource("panImage", image);
          }
          var insiteAnnotationTypes = ["annotationPoint", "annotationLineRun", "annotationLineRise", "annotationLine", "annotationLabel", "annotationAngle", "annotationArea"];
            //TEMP FOR JEMENA
            insiteAnnotationTypes.push("annotationLineBuried");
          if (insiteAnnotationTypes.includes(pickedObject.id.inSiteType)) {
            pickedAnnotationType = pickedObject.id.inSiteType;
          }
        }
    }

    var clickCartesian = getClickPositionCartesian(viewer, click.position);

    if (!clickCartesian)
        return;

    if ((activeTool == "select") && !pickedAnnotationType) {
        $("#infopanel").hide();
    }

    let project = inSiteGetProject(insiteActiveProject);

    if ((activeTool == "point") && project && !pickedAnnotationType) {
        var cartographic = Cesium.Cartographic.fromCartesian(clickCartesian);
        insiteConsole("Position: " + Cesium.Math.toDegrees(cartographic.latitude).toFixed(8) + ", " + Cesium.Math.toDegrees(cartographic.longitude).toFixed(8) + ", Height: " +  cartographic.height.toFixed(2));

            var annotation    = new INSITEAnnotation();
            annotation.type   = INSITEAnnotationType.POINT;
            annotation.points = [clickCartesian];

            project.annotations.push(annotation);
            inSiteRefreshEntitiesFromAnnotations();
            viewer.selectedEntity = viewer.entities.getById(annotation.entityID); 
        
    }

    //TEMP FOR JEMENA
    if ((activeTool == "buried_pipeline") && project && !pickedAnnotationType) {
        var cartographic = Cesium.Cartographic.fromCartesian(clickCartesian);
        var annotation    = new INSITEAnnotation();
        annotation.type   = INSITEAnnotationType.LINE_BURIED;
        annotation.points = [clickCartesian];

        project.annotations.push(annotation);
        inSiteRefreshEntitiesFromAnnotations();
        viewer.selectedEntity = viewer.entities.getById(annotation.entityID); 
        
    }

    if ((activeTool == "distance") && project && !pickedAnnotationType) {
        var dot = new Cesium.Entity({
            position : clickCartesian.clone(),
            point : { pixelSize:4, color:Cesium.Color.RED, outlineWidth: 1.0}});
        viewer.entities.add(dot);
        insiteAnnotationEntityIDs.push(dot.id);

        if (!isMidAction) { // first click
            measureFirstPos = clickCartesian;
        } else { // second click
            // TODO: move all this logic into INSITEAnnotation or insite_annotation.js as it will be needed in the annotation panel too
            // TODO: we can then merge the "distance" and "angle" tool code 
            
            var lineMeasureObj = insiteGetLineMeasurementInfo([measureFirstPos,clickCartesian]);
            var distanceString = insiteGetDistanceString(lineMeasureObj.distance);

            insiteConsole("Distance: " + distanceString);
            
            var annotation    = new INSITEAnnotation();
            annotation.type   = INSITEAnnotationType.LINE;
            annotation.points = [measureFirstPos,clickCartesian];
            annotation.label  = distanceString;

            project.annotations.push(annotation);

            /*
              make run and rise
            */
            let point1 =  Cesium.Cartographic.fromCartesian(clickCartesian);
            let point2 =  Cesium.Cartographic.fromCartesian(measureFirstPos);
            let tmpPoint = null;
            
            if(point1.height > point2.height) {

                tmpPoint = point2.clone();
                tmpPoint.height = point1.height;
                tmpPoint = Cesium.Cartographic.toCartesian(tmpPoint);

            } else {

                tmpPoint = point1.clone();
                tmpPoint.height = point2.height;
                tmpPoint = tmpPoint = Cesium.Cartographic.toCartesian(tmpPoint);
            }


            {
                //add first line

                var lineMeasureObj = insiteGetLineMeasurementInfo([clickCartesian, tmpPoint]);
                var distanceString = insiteGetDistanceString(lineMeasureObj.distance);

                var annotationLineRise    = new INSITEAnnotation();
                annotationLineRise.type   = INSITEAnnotationType.LINE_RISE;
                annotationLineRise.points = [clickCartesian, tmpPoint];
                annotationLineRise.label  = distanceString;

                project.annotations.push(annotationLineRise);

            }

            {
                //add second line

                var lineMeasureObj = insiteGetLineMeasurementInfo([measureFirstPos, tmpPoint]);
                var distanceString = insiteGetDistanceString(lineMeasureObj.distance);

                var annotationLineRun    = new INSITEAnnotation();
                annotationLineRun.type   = INSITEAnnotationType.LINE_RUN;
                annotationLineRun.points = [measureFirstPos, tmpPoint];
                annotationLineRun.label  = distanceString;

                project.annotations.push(annotationLineRun);

            }


            inSiteRefreshEntitiesFromAnnotations();            
            viewer.selectedEntity = viewer.entities.getById(annotation.entityID);
        }
        isMidAction = !isMidAction; // toggle state
    }

    if ((activeTool == "angle") && project && !pickedAnnotationType) {
        var dot = new Cesium.Entity({
            position : clickCartesian,
            point : { pixelSize:4, color:Cesium.Color.GREEN, outlineWidth: 1.0 }});
        viewer.entities.add(dot);
        insiteAnnotationEntityIDs.push(dot.id);

        if (!isMidAction) { // first click
            measureFirstPos = clickCartesian;
        } else { // second click
            // TODO: move all this logic into INSITEAnnotation or insite_annotation.js as it will be needed in the annotation panel too
            // TODO: we can then merge the "distance" and "angle" tool code 

            var lineMeasureObj = insiteGetLineMeasurementInfo([measureFirstPos,clickCartesian]);

            insiteConsole("Slope: " + lineMeasureObj.slopeString);

            var annotation    = new INSITEAnnotation();
            annotation.type   = INSITEAnnotationType.LINE;
            annotation.points = [measureFirstPos,clickCartesian];
            annotation.label  = lineMeasureObj.slopeString;

            project.annotations.push(annotation);

            inSiteRefreshEntitiesFromAnnotations();            
            viewer.selectedEntity = viewer.entities.getById(annotation.entityID);
        }
        isMidAction = !isMidAction; // toggle state
    }

    if (activeTool == "path") {
        //place holder
    }

    if (activeTool == "area") {
        //place holder
    }

}, Cesium.ScreenSpaceEventType.LEFT_CLICK);


// RIGHT CLICK
handler2.setInputAction(function(click) {
    // TODO: make a context menu, with option for delete, other things?
    var pickedObject = viewer.scene.pick(click.position);
    if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
        if (pickedObject.id.hasOwnProperty("inSiteType") && pickedObject.id.hasOwnProperty("annotation")) {
            
            if(pickedObject.id.annotation.type  === INSITEAnnotationType.POINT) {

                contextMenuController.setActive("move", true);
            } else {
                contextMenuController.setActive("move", false);
            }

            contextMenuController.setLocation(click.position);
            viewer.selectedEntity = pickedObject.id;
        } 
    } else {
            contextMenuController.setLocation(undefined);
    }
  
}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);


// SELECTION CHANGED
viewer.selectedEntityChanged.addEventListener(function(entity) {  
    console.log("## selectedEntityChanged");
    if (entity && entity.hasOwnProperty("inSiteLabelEntityID")) {
        console.log(" intercepted label selection")
        viewer.selectedEntity = viewer.entities.getById(entity.inSiteLabelEntityID);  // TODO, this mostly works, but the selection reticle doesn't show up
    } else 
    if (entity && entity.hasOwnProperty("inSiteType")) {
        var annotationTypes = ["annotationPoint","annotationLineRun","annotationLineRun","annotationLineRise","annotationLine","annotationPath","annotationArea"]; // TEMP, this needs to be defined in insite_data.js and used globally, also with an isAnnotation() helper
        //TEMP FOR JEMENA
        annotationTypes.push("annotationLineBuried");
        if (annotationTypes.includes(entity.inSiteType)) {
            insiteShowAnnotationPanel(entity); // or viewer.selectedEntity
        }
    }
    insiteSaveAnnotations(insiteActiveProject); // TEMP? not sure this is the best place and covers all cases
});


// double-click to center view
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK); // removes default behavior of douvle-click to select entity
export var doubleClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
doubleClickHandler.setInputAction(function(click) {
    var clickCartesian = getClickPositionCartesian(viewer, click.position);
    if (!clickCartesian)
        return;
    var movebackDistance = Cesium.Cartesian3.distance(viewer.camera.position, clickCartesian) * 0.333;
    var halfWayPoint = new Cesium.Cartesian3();
    Cesium.Cartesian3.lerp(viewer.camera.position, clickCartesian, 0.666, halfWayPoint);
    viewer.camera.setView({
        destination : clickCartesian,
        orientation: {
            heading : viewer.camera.heading,
            pitch : viewer.camera.pitch,
            roll : 0.0
        }});
    viewer.camera.moveBackward(movebackDistance);
}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);


// camera move callback
viewer.camera.percentageChanged = 0.0001;
viewer.camera.changed.addEventListener(function() {
    if ($("#imagePanel").is(":visible")) {
        insiteUpdateImagePanel(dragging);
    }
}.bind(viewer.camera));


// set up to hide the "Loading..." overlay
/*var insiteLoaded = false;
function inSiteHideLoadingScreen(numTilesToLoad) {
    console.log(numTilesToLoad);
    if (numTilesToLoad === 0) {
        insiteLoaded = true;
        //document.getElementById("loadingOverlay").style.display = "none";
        $("#loadingOverlay").hide();
    }
}
var helper = new Cesium.EventHelper();
helper.add(viewer.scene.globe.tileLoadProgressEvent, inSiteHideLoadingScreen);*/



