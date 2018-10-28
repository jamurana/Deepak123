
import * as inSiteM from './inSite';
import * as inSiteData from './insite_data';
import * as inSiteLib from './insite_lib';
import * as inSiteAnnotation from './insite_annotation';
import * as inSiteUI from './insite_UI';
import * as inSiteCamera from './inSite_camera';
import * as inSiteConfig from './insite_config';
import {INSITEUserData} from './inSite_userdata';
import {siteMarkers} from './site_marker';
import {areaMeasurement} from './areaMeasurement';
import {cameraOrbit} from './cameraOrbit';
import {imagepanner} from './imagepanner';
import {contextMenuController} from './insite_context-menu';


function referenceIt(arrOfFunctions, refObject, option){

	if(refObject instanceof Object &&
	 	(arrOfFunctions instanceof Array || 
	 	arrOfFunctions instanceof Object)){

		for(let index in arrOfFunctions){

			if(arrOfFunctions.hasOwnProperty(index)){

				let item = arrOfFunctions[index];
				if(option instanceof Object){

					let typeOfItem = typeof item;
					if(option["filterOnType"] && option["allowedTypes"] instanceof Array){
						if(option["allowedTypes"].indexOf(typeOfItem) == -1){

							continue;
						}
					}

					if(option["filterOnName"]){
						
						if(option["allowedNames"] instanceof Array 
							&& option["allowedNames"].indexOf(index) == -1){

							continue;
						}

						if(option["notallowedNames"] instanceof Array 
							&& option["notallowedNames"].indexOf(index) !== -1){

							continue;
						}
					}
					
				}

				refObject[index] = item;
			}
			
		}
	}
}

window["areaMeasurement"] = areaMeasurement;
window["INSITEUserData"] = INSITEUserData;
window["siteMarkers"] = siteMarkers;
window["cameraOrbit"] = cameraOrbit;
window["imagepanner"] = imagepanner;
window["contextMenuController"] = contextMenuController;

/**

It's not recommanded to use "string" type data in `allowedTypes` array

*/

referenceIt(inSiteData, window);
referenceIt(inSiteConfig, window);
referenceIt(inSiteLib, window);
referenceIt(inSiteAnnotation, window);
referenceIt(inSiteM, window, {
	filterOnType: true,
	allowedTypes:["function","object"],
	filterOnName: true,
	notallowedNames:["handler","handler2"] //things that you don't want in global scope
});
referenceIt(inSiteUI, window, {
	filterOnType: true,
	allowedTypes:["function","object"],
});
referenceIt(inSiteCamera, window);

$(function() {

    let menuItem = [];
	let move = new contextMenuController.contextData("move", "Move");
	let del = new contextMenuController.contextData("delete", "Delete");
	
	menuItem.push(move);
	menuItem.push(del);

	var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
	            
    /**
     * Registering the click events
     */
    handler.setInputAction(
		    function (e) {

		    		let pickedEntity = move.pickedEntity;
		    		if (Cesium.defined(pickedEntity) 
				            && pickedEntity.hasOwnProperty("inSiteType") 
				            && pickedEntity.hasOwnProperty("annotation")
				            && pickedEntity.annotation.type  === INSITEAnnotationType.POINT) {

		    			var clickCartesian = getClickPositionCartesian(viewer, e.position);

			            if (clickCartesian) {
			                
				            pickedEntity.annotation.points = [clickCartesian];
				            pickedEntity.position = clickCartesian.clone();
				            move.pickedEntity = undefined;

				            insiteConsole("Pin moved");
						} else {
		                
		                	insiteConsole('Globe was not picked');
		            }
		        }
		    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	move.clickListener = function(position) {

		var pickedObject = viewer.scene.pick(position);

		if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
	        if (pickedObject.id.hasOwnProperty("inSiteType") 
	        	&& pickedObject.id.hasOwnProperty("annotation")) {
				move.pickedEntity = pickedObject.id;

				//deselecting all toolbar controls
				toolbarDeselectAll();

				activeTool = undefined;
				insiteConsole("Click on a new position to move the pin");
	        }
		}
	}

	del.clickListener = function(position) {

		var pickedObject = viewer.scene.pick(position);

		if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
	        if (pickedObject.id.hasOwnProperty("inSiteType") && pickedObject.id.hasOwnProperty("annotation")) {
	            
	            insiteDeleteAnnotation(insiteActiveProject, pickedObject.id.annotation);
	            insiteSaveAnnotations(insiteActiveProject); // TEMP? not sure this is the best place and covers all cases
	            inSiteRefreshEntitiesFromAnnotations();
	        }
		}
	}

	contextMenuController.init("#cesiumPanel", "#rightclick-context-menu", menuItem);
	
});