
// import {activeTool} from './inSite_m';

export var panelLeftInitWidth = $("#cesiumPanel").width();
export var OcesiumPanelWidth  = panelLeftInitWidth;

$(document).ready(function() {

  $(".splitter").show();

  // SHOW WELCOME POPUP if first time viewer
  var showInsiteWelcome = localStorage.getItem('showInsiteWelcome');
  if (showInsiteWelcome === null) {
        localStorage.setItem('showInsiteWelcome', 1);
        $("#welcomeBody").load("welcome.html");
        $("#welcomeModal").modal({keyboard: true})
  }
   
  $(".pullout").click(function() {
    inSiteToggleImagePanel();
  });

  let minWidth = 200;
  let maxWidth = $(document).width() - minWidth;
  
  $.widget("ui.resizable", $.ui.resizable, {
    resizeTo: function(newSize) {
        var start = new $.Event("mousedown", { pageX: 0, pageY: 0 });
        this._mouseStart(start);

        this.axis = 'e';
        var end = new $.Event("mouseup", {
            pageX: newSize.width - this.originalSize.width,
            pageY: newSize.height - this.originalSize.height
        });
        this._mouseDrag(end);
        this._mouseStop(end);
    }
});


  // panel resizer


  $(".panel-left").resizable({
     handleSelector: ".splitter",
     resizeHeight: false,     
     minWidth: minWidth,
     maxWidth: maxWidth,
     handles:"e",
     /*stop: function(event, ui) {
      var resized = $(this);
      var panelLeftWidth = $(".panel-left").width();
      var panelRightWidth = $(".panel-right").width();

      // hide right pannel when it can no longer fit
      var x = $("#imagePanel").position();

      console.log("imagePanel position1");
      console.log(x);

      if (x.top > 10 ) {
        console.log("can close")
        //inSiteToggleImagePanel();
        OcesiumPanelWidth = panelLeftInitWidth;
      }
      resized.queue(function() {
        resizeComplete(resized);
        $( this ).dequeue();
      });
    }*/
  });

  // set margin height for initial preivew image.
  var $section = $('#panContainer'); 
  var panImageHeight = $('#panImage').height();
  var windowHeight = $(document.body).height();
  if (panImageHeight < windowHeight) {
      var margintop = (windowHeight - panImageHeight) / 2;
      $('#panImage').parent().css('height',windowHeight);
      //$('#panImage').css('margin-top', margintop/2);
  }

  // set panzoom up.    
  var $section = $('#panContainer');
  $section.find('.panzoom').panzoom({
    $zoomIn: $section.find(".zoom-in"),
    $zoomOut: $section.find(".zoom-out"),
    $zoomRange: $section.find(".zoom-range"),
    $reset: $section.find(".reset"),
    startTransform: 'scale(1.1)',
    increment: 0.1,
    minScale: 0.5,
    //contain: 'true'
  }).panzoom('zoom');

  var $panzoom = $section.find('.panzoom').panzoom();  
  $panzoom.parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    
    $panzoom.panzoom('zoom', zoomOut, {
      animate: false,
      focal: e
    });

  });


  //initializing the area measurement tool with cesium viewer
  areaMeasurement.init(viewer);


  //window resize events

  //it was giving a error that resizeComplete is not defined so I have created a dummy function
  function resizeComplete(resized){


  }

    $(window).resize(function(e) {

        if(e.target !== window){
          return;
        }

        if ($("#imagePanel").is(":visible")) {

          let w = $(window).width() * 0.5;
          let h = $(window).height() - 50;
          let dimenation = { height: h, width: w };
          $(".panel-left").resizable("resizeTo", dimenation);

        }
        
    });

});

 // Image source switcher      
export function setImageSource(imageId, imageSrc, isMoving) {

  if(!imageSrc){
    $('#' + imageId).attr('src', "");
    $('#image-name > span').html("[no matching photos]");
    console.log("empty");
    return;
  }  

  let fileName = imageSrc || "";

  var index = fileName.lastIndexOf("/");

  if(index != -1){
    fileName = fileName.substr(index+1);
  }

  if (!isMoving) {
    $('#' + imageId).attr('src', imageSrc);
  } else {
    if (index != -1) {
      var tmpPath = imageSrc.substr(0,index) + "/thumbs/" + fileName;
      $('#' + imageId).attr('src', tmpPath);
    }
  }

  if (fileName) {
    if (isMoving) {
      $('#image-name > span').html(fileName + " [preview]");
    } else {
      $('#image-name > span').html(fileName);
    }
  } else {
    $('#image-name > span').html("[no matching photos]");
  } 

};

// MENU CALLBACKS
export var showCameraPositions = false; // TEMP var here, needs to be handled in a more extensible manner for different types
$('.dropdown-item').click(function(){
    var menuID = $(this).prop("id");
    switch (menuID) {
    case "layerMenuGlobe":
        let noOfLayers = viewer.scene.imageryLayers.length;

        for(let i = 0; i<noOfLayers; i++) {

          viewer.scene.imageryLayers.get(i).show = !viewer.scene.imageryLayers.get(i).show;
        }

        if(viewer.terrainProvider === terrainProvider) {
          
          viewer.terrainProvider = defaultTerrainProvider;
        } else{

          viewer.terrainProvider = terrainProvider;
        }

        break;
    case "layerMenuCameras":
        showCameraPositions = !showCameraPositions;
        inSiteShowHideEntitiesByType(showCameraPositions, "cameraPosition");
        break;
    case "menuTopDownView":
        insiteTopDownView();
        break;
    case "menuResetView":
        insiteResetView();
    }
});

$("#menuNavToDropdownParent").on("show.bs.dropdown", function (event) {
    insiteUpdateMenuProjects();
});

// KEYBOARD SHORTCUTS
$(document).keyup(function(e) {
     if (e.keyCode == 27) { // escape key is a special case, needs to be on keyup() rather than keypress()
        insiteSetTool("select");
        cameraOrbit.stop();
    }
});
$(document).keypress(function(event) {

  // only handle global keyboard events, prevents triggering on text input, etc
  // TODO: this might need tweaking later, e.g. shortcuts within other active elements
  if (document.activeElement != "[object HTMLBodyElement]")
    return; 

  //console.log("Handler for .keypress() called, key: " + event.which);
  //console.log("  document.activeElement: " + document.activeElement);

  switch(event.which) {
    case 32: // SPACEBAR
      inSiteToggleImagePanel();
      break;
    case 112: // 'P'
    case  80: // 'P'
      insiteSetTool("point");
      break;
    case 100: // 'd'
    case  68: // 'D'
      insiteSetTool("distance");
      break;
    case  97: // 'a'
    case  65: // 'A'
      insiteSetTool("area");
      break;
    case 115: // 's'
    case  83: // 'S'
      insiteSetTool("angle"); // slope
      break;
    case 111: // 'o'
      cameraOrbit.toggle()
      break;
  }
})

// TOOLBAR BUTTON CALLBACKS
export function toolbarDeselectAll() {
    $('#toolbar i').removeClass( 'active' );

    //reset measurement tool
    if (areaMeasurement.isInitialized()){            
      areaMeasurement.setActive(false);   
    }
}

export function insiteSetTool(tool) {
    toolbarDeselectAll();
    activeTool = tool;
    switch (tool) {
        case "select":
          $('#toolbar_select').addClass( 'active' );
          viewer.selectedEntity = null;
          $("#infopanel").hide();
          break;
        case "point":
          $('#toolbar_point').addClass( 'active' );
          break;
        case "distance":
          $('#toolbar_distance').addClass( 'active' );
          break;
        case "angle":
          $('#toolbar_angle').addClass( 'active' );
          break;
        case "area":
          $('#toolbar_area').addClass( 'active' );
          areaMeasurement.setActive(true);
          break;
          //TEMP FOR JEMENA
        case "buried_pipeline":
          $('#toolbar_buried_pipeline').addClass( 'active' );
          break;
        default:
          throw ("Unknown tool '" + tool + "' specified in insiteSetTool()");
          break;
    }
}

$('#toolbar_select').on('click', function(e) {
  //toolbarDeselectAll();
  //$(this).addClass( 'active' );
  //activeTool = "select";
  insiteSetTool("select");
});

$('#toolbar_point').on('click', function(e) {
  //toolbarDeselectAll();
  //$(this).addClass( 'active' );
  //activeTool = "point";
  insiteSetTool("point");
});

$('#toolbar_distance').on('click', function(e) {
  //toolbarDeselectAll();
  //$(this).addClass( 'active' );
  //activeTool = "distance";   
  insiteSetTool("distance");
});

$('#toolbar_area').on('click', function(e) {
  //toolbarDeselectAll();
  //$(this).addClass( 'active' );
  //activeTool = "area";
  //areaMeasurement.setActive(true);
  insiteSetTool("area");
});

$('#toolbar_angle').on('click', function(e) {
  //toolbarDeselectAll();
  //$(this).addClass( 'active' );
  //activeTool = "angle";
  insiteSetTool("angle");
});

$('#toolbar_trash').on('click', function(e) {
  toolbarDeselectAll();
  //insiteClearAllEntities();
  insiteDeleteAllProjectAnnotations(insiteActiveProject);
  activeTool = "";
  areaMeasurement.reset();
  $("#infopanel").hide();
});

$('#toolbar_layers').on('click', function(e) {
  e.stopPropagation();
  toolbarDeselectAll();
  onToolbarLayers(e);
  activeTool = "";
});

$('#toolbar_info').on('click', function(e) {
  toolbarDeselectAll();
  $(this).addClass( 'active' );
  onToolbarInfo(e);
  activeTool = "";
});

//TEMP FOR JEMENA
$('#toolbar_buried_pipeline').on('click', function(e) {
  insiteSetTool("buried_pipeline");
});

export function onToolbarLayers(e) {

    if ($("#panelLayers").is(":visible")) { // it is open, so we close it
      $("#panelLayers").hide();
      $('#toolbar_layers').removeClass( 'active' );
      // $("#toolbar_layers").css("z-index", "");
      // $("#toolbar_layers img").attr("src", "icons/layers.png");
    } else { // show the panel
      // $("#toolbar_layers img").attr("src", "icons/layers_selected.png");
      inSiteUpdateLayersList();
      var layerButtonPos = $("#toolbar_layers").offset();
      $("#panelLayers").css("left", layerButtonPos.left + 40);
      $("#panelLayers").css("top",  layerButtonPos.top);
      $("#panelLayers").show();
      $('#toolbar_layers').addClass( 'active' );
      let maxHeight = $(document).height() * 0.20;
      let minWidth = $(document).width() * 0.15;
      let maxWidth = $(document).width() * 0.40;
      $("#panelLayers").resizable({
                          resizeHeight: false,
                          autoHide:     false,
                          containment:  "#appContainer",
                          maxHeight:    maxHeight,
                          minWidth:     minWidth,
                          maxWidth: maxWidth,
                          handles:      "se",
                        });

      // $("#toolbar_layers").css("z-index", 15);
    }
}

export function insiteShowImagePanel() {
    //console.log("## showing image panel");
    insiteUpdateImagePanel();
    $("#imagePanel").show();
    $(".pullout").hide();
    $("#cesiumPanel").css("width", OcesiumPanelWidth);
}

export function insiteHideImagePanel() {
    OcesiumPanelWidth = $("#cesiumPanel").width();
    //console.log("## hiding image panel");
    $("#imagePanel").hide();
    $("#cesiumPanel").css("width", "100%"); 
    $(".pullout").show();
}

export function inSiteToggleImagePanel() {
  if ($("#imagePanel").is(":visible")) {
    insiteHideImagePanel();
  } else {
    insiteShowImagePanel();
  }
}

export function insiteUpdateImagePanel(isMoving) {

  isMoving = !!isMoving;
  // TODO: need to convert fov to vertical fov at some point
  // TODO: needs to use angle of view as well as position
  let cameraHPR =  new Cesium.HeadingPitchRoll(viewer.camera.heading, viewer.camera.pitch, viewer.camera.roll);
  var closestCam = inSiteFindClosestCameraMatch(viewer.camera.position, cameraHPR, viewer.camera.frustum.fov, viewer.entities); 
  if (closestCam) {
    setImageSource("panImage", closestCam.image, isMoving);

    // image rotation, implemented but still TBD on whether this is a good thing, or needs further work. It helps in some cases but not all, will disable for now pending further testing
    let photoRotate = false;
    if(photoRotate && !isMoving) {      
      let angleInDegree = Cesium.Math.toDegrees(closestCam.hpr.heading - cameraHPR.heading);
      angleInDegree = angleInDegree < 0 ? angleInDegree + 360 : angleInDegree;
      $('#panImage').css("transform", "rotate(" + angleInDegree + "deg)");
    }

  } else {
    setImageSource("panImage", "");
  }
}

export function inSiteToggleProjectVisibility(name) {
  let project = INSITEProjects.find(x => x.name === name);
  if (!project) {
    console.log("error: location '" + name + "' not found in INSITEProjects");
    return;
  }

  project.show = !project.show;
  project.data[0].dataObject.show = project.show; // TODO: currently assumes one dataset in each project, needs expanding to the combined volume of all datasets within a project
  inSiteUpdateLayersList();
}

export function inSiteUpdateLayersList() { 
  $("#panelLayersList").empty();
  var i;
  for (i in INSITEProjects) {
    let name = INSITEProjects[i].name;
    let checked = "";
    if (INSITEProjects[i].show) {
      checked = "checked";
    }
    let id = "layer_" + name;
    $("#panelLayersList").append("<li><label for='" + id + "' class=\"layerLabel\" onclick=\"inSiteToggleProjectVisibility(\'" + name + "\')\"><input id='" + id + "' type=\"checkbox\" " + checked + "> " + name + "</label></li>");

    $("#panelLayers").nanoScroller({ scroll: 'top' });
  }
}

export function insiteUpdateMenuProjects() {
  var theDiv = document.getElementById('menuNavToDropdown');
  $("#menuNavToDropdown").empty();
  var i;
  for (i in INSITEProjects) {
    var a = document.createElement('a');
    a.setAttribute('href',    "#");
    a.setAttribute('class',   "dropdown-item");
    a.setAttribute('onclick', "inSiteJumpToLocation(\"" + INSITEProjects[i].name + "\", 3.0)")
    a.innerHTML = INSITEProjects[i].name;
    theDiv.appendChild(a);
  }
}

export function getCurrentMapCenter() {

  var middlePos = new Cesium.Cartesian2($("#cesiumContainer").width() / 2.0, $("#cesiumContainer").height() / 2.0)
  return getClickPositionCartesian(viewer, middlePos);
}

export function insiteTopDownView() {
  var middlePos = new Cesium.Cartesian2($("#cesiumContainer").width() / 2.0, $("#cesiumContainer").height() / 2.0)
  var cartesianPosition = getClickPositionCartesian(viewer, middlePos);
    if (!cartesianPosition)
        return;

  let distance = Cesium.Cartesian3.distance(cartesianPosition, viewer.camera.position);

  viewer.camera.setView({
      destination : cartesianPosition,
      orientation: {
          heading : Cesium.Math.toRadians(0.0), // east, default value is 0.0 (north)
          pitch : Cesium.Math.toRadians(-90),    // default value (looking down)
          roll : 0.0                             // default value
      }
  });
  viewer.camera.moveBackward(distance);
}

export function insiteResetView() {
  inSiteJumpToLocation(insiteActiveProject);
}

