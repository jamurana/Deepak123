
export var areaMeasurement =  (function (){
	
	var staticDataSources = [];
	var active = false;
    var multi = true;
    var cesiumViewer = null;
    var noOfPoint = 4;    
    var pointsArray = [];
    var addedPolygonEntities = [];
    var addedPointEntities = [];
    var lastPolygonId =  null;
    var drawing = false;
    
    var polygonLocationData = {};
    
    const polygonIdTemplate = "area_polygon";
    const pointIdTemplate = "point";
    
    const MIN_POINTS = 3;
    
	var base = {
			checkInitilization: function () {
	            if (!Cesium) {
	                throw "Cesium is not initialized";
	            }
	            if (!cesiumViewer) {
	                throw "cesiumViewer is not initialized";
	            }
	        },
	        isInitialized: function(){
	        	try{
	        		this.checkInitilization();
	        		return true;
	        	}catch(err){

	        		console.log(err);
	        		return false;
	        	}
	        },
	        init: function (viewer) {
	            var points = 4;
	            var clickPositions = [];
	            
	            var that = this;

	            // initializing draw control

	            cesiumViewer = viewer;

	            // click
	            var handler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.scene.canvas);
	            
	            /**
	             * Registering the click events
	             */
	            handler.setInputAction(
                function (e) {
                    if (active) {
                    	
                        //var ellipsoid = viewer.scene.globe.ellipsoid;
                        //var cartesian = viewer.camera.pickEllipsoid(e.position, ellipsoid);
                        var cartesian = getClickPositionCartesian(cesiumViewer, e.position);
                        if (cartesian) {
                            //var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                            //var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(10);
                            //var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(10);
                            //insiteConsole(cartesian);
                            that.addPoint(cartesian);
                            //console.log("LEFT_CLICK called");
                        } else {
                            insiteConsole('Globe was not picked');
                        }
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);   
	           	            
	            handler.setInputAction(
                    function (e) {
                        if (active) {
                        	that.finish();
                        }
                        //console.log("RIGHT_CLICK called");
                    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	        },
	        finish: function () {
	            var that = this;

                //clearing the corner points
                //pointsArray = [];
                
                var currentPolygonId = that.getCurrentPolygonId();
                
                drawing = false;
                that.clearAddedPointEntities();
                
                if(polygonLocationData[currentPolygonId].pointsArray.length < MIN_POINTS){
                	
                	delete polygonLocationData[currentPolygonId];                	
                	alert("Unable to draw polygon as points must be >= " + MIN_POINTS);
                	return false;
                } else{
                	polygonLocationData[lastPolygonId].status = "drawn";
                	
                	//make the coordinate value static
                	that.updateFinalDrawData();
    	        	
                	return true
                }                
                
	            //finish the drawing
	        },
	        updateFinalDrawData: function(){
	        	var that = this;
	        	
	        	var entity = that.getPolygonById(lastPolygonId);	        	
	        	if(!entity){
	        		return false;
	        	}
	        	
	        	var center = Cesium.BoundingSphere.fromPoints(polygonLocationData[lastPolygonId].pointsArray).center;	    	                
                //center = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(center);
	        	
	        	entity.position = new Cesium.ConstantProperty(center);
	        	entity.polygon.hierarchy = new Cesium.ConstantProperty(polygonLocationData[lastPolygonId].pointsArray);
	        	
	        	//TO DO
	        	let text = entity.label.text.getValue();
				let project = inSiteGetProject(insiteActiveProject);
				var annotation    = new INSITEAnnotation();
	            annotation.type   = INSITEAnnotationType.AREA;
	            annotation.points = polygonLocationData[lastPolygonId].pointsArray;
	            annotation.label  = text;

	            project.annotations.push(annotation);

	            //cesiumViewer.entities.removeById(entity.id);

	            //that.clearPolygonById(lastPolygonId);

	            that.clearById(lastPolygonId);

	            inSiteRefreshEntitiesFromAnnotations();
	            viewer.selectedEntity = viewer.entities.getById(annotation.entityID);

	        	return true;
	        },
	        clearDataSources: function (datasources) {
	            var that = this;

	            for (var i in datasources) {
	                cesiumViewer.dataSources.remove(datasources[i]);
	            }

	            datasources = [];
	        },
	        reset: function () {
	            var that = this;
	            that.clearAll();
	            pointsArray.length = 0;
	        },
	        getCurrentPolygonId: function(){
	        	var that = this;
	        	 
	        	if(lastPolygonId && polygonLocationData[lastPolygonId].status === "drawing"){
	        		return lastPolygonId;
	        	} else{
	        		return polygonIdTemplate + "." + (addedPolygonEntities.length + 1);
	        	}	        	
	        	
	        },	        
	        getPolygonById: function(id){	        	
	        	var that = this;
	        	that.checkInitilization();
	            var flag = false;
	            
	            if (!id) {
	                return false;
	            }
	            
	            for (var i in addedPolygonEntities) {
	                if (addedPolygonEntities[i] == id) {
	                    flag = true;
	                    break;
	                }
	            }
	            
	            if (flag) {
	                return cesiumViewer.entities.getById(id);
	            }

	            return flag;
	        },
	        clearPolygonById: function(id){
	        	var that = this;
	        	that.checkInitilization();
	            var flag = false;
	            
	            if (!id) {
	                return false;
	            }
	            
	            for (var i in addedPolygonEntities) {
	                if (addedPolygonEntities[i] == id) {
	                    flag = true;
	                    break;
	                }
	            }
	            
	            if (flag) {
	                //removing the polygon
	                cesiumViewer.entities.removeById(id);

	                //remove polygon from array
	                var index = addedPolygonEntities.indexOf(id);
	                addedPolygonEntities.splice(index, 1);
	                //addedPolygonEntities.pop(id);

	                if (lastPolygonId == id) {
	                    lastPolygonId = null;
	                }
	            }

	            return flag;
	        },
	        clearById: function (id) {
	            var that = this;

	            that.checkInitilization();
	            var flag = false;

	            if (!id) {
	                return false;
	            }

	            for (var i in addedPolygonEntities) {
	                if (addedPolygonEntities[i] == id) {
	                    flag = true;
	                    break;
	                }
	            }

	            if (flag) {
	                var arr = [];
	                for (var i in addedPointEntities) {
	                    if (addedPointEntities[i].indexOf(id) !== -1) {
	                        //we now know that this point is for this polygon
	                        //removing this point
	                        cesiumViewer.entities.removeById(addedPointEntities[i]);

	                        //remove the id from the array
	                        arr.push(addedPointEntities[i]);
	                    }
	                }

	                //remove points id from array
	                for (var i in arr) {
	                    var index = addedPointEntities.indexOf(arr[i]);
	                    addedPointEntities.splice(index, 1);
	                }

	                //removing the polygon
	                cesiumViewer.entities.removeById(id);

	                //remove polygon from array
	                var index = addedPolygonEntities.indexOf(id);
	                addedPolygonEntities.splice(index, 1);
	                delete polygonLocationData[id]; 
	                
	                if (lastPolygonId == id) {
	                    lastPolygonId = null;
	                }
	            }

	            return flag;

	        },
	        clearAddedPointEntities: function(){
	        	var that = this;
	            that.checkInitilization();
	            
	          //remove points
	            for (var i in addedPointEntities) {
	                cesiumViewer.entities.removeById(addedPointEntities[i]);
	                // delete addedPolygonEntities[i];
	            }
	            
	            addedPointEntities = [];
	            
	            return true;
	        },
	        clearAll: function () {
	            var that = this;
	            that.checkInitilization();
	            var flag = false;

	            //remove points
	            for (var i in addedPointEntities) {
	                cesiumViewer.entities.removeById(addedPointEntities[i]);
	                // delete addedPolygonEntities[i];
	            }
	            if (addedPointEntities.length) {
	                flag = true;
	            }

	            //remove polygons
	            for (var i in addedPolygonEntities) {
	                cesiumViewer.entities.removeById(addedPolygonEntities[i]);
	                // delete addedPolygonEntities[i];
	            }

	            if (addedPolygonEntities.length) {
	                flag = true;
	            }
	            
	            addedPolygonEntities = [];
	            addedPointEntities = [];
	            polygonLocationData = {};	            
	            
	            lastPolygonId = null;
	            
	            return flag;
	        },
	        addPoint: function (cartesian) {
	            var that = this;
	            
	            if (active) {	            	
	                that.checkInitilization();
	                
	                if (multi === false && addedPolygonEntities.length && polygonLocationData[lastPolygonId].status === "drawn") {
		        		that.clearById(lastPolygonId);
		        		//or that.clearAll();
	                }
	                
	                var currentPolygonId = that.getCurrentPolygonId();	                
	                drawing = true;
	                 
	                that.drawPoint(cartesian, {});
	                
	                if(!polygonLocationData[currentPolygonId]){
	                	polygonLocationData[currentPolygonId] = {
	                			pointsArray: [],
	                			status: "drawing"
	                	};
	                }
	                console.log(polygonLocationData);
	                polygonLocationData[currentPolygonId].pointsArray.push(cartesian);
	                
	                pointsArray.push(cartesian);

                	if (polygonLocationData[currentPolygonId].pointsArray.length === MIN_POINTS) {
                		
	                    that.drawPolygon({
	                        //extrudedHeight: 0.0,
	                        outline: true,
	                        outlineWidth : 3,
	                        material: Cesium.Color.INDIANRED.withAlpha(0.6),
	                        outlineColor: Cesium.Color.BLACK, 
	                        inSiteType : "annotationArea",
	                    });
	                }
                	
                	if(polygonLocationData[currentPolygonId].pointsArray.length >= MIN_POINTS){
                		let resultObj = that.calculateANDSetArea(that.getPolygonById(lastPolygonId));

                		that.drawLabel(resultObj);
                	}

	                return true;
	            } else {
	                return false;
	            }

	        },
	        drawPoint: function (cartesian, obj) {
	            var that = this;

	            that.checkInitilization();

	            if (active) {
	                obj = obj || {};

	                obj.name = obj.name || 'Point';
	                obj.id = polygonIdTemplate + "." + (addedPolygonEntities.length + 1) + "_" + pointIdTemplate + "." + (addedPointEntities.length + 1);

	                var labelText = addedPointEntities.length + 1;
	                
	                labelText = labelText === 0 ? noOfPoint : labelText;

	                cesiumViewer.entities.add({
	                    id: obj.id,
	                    naem: obj.name,
	                    position: cartesian.clone(),
	                    point: {
	                        pixelSize: 4,
	                        color: Cesium.Color.RED,
	                        outlineColor: Cesium.Color.BLACK,
	                        outlineWidth: 1
	                    },
	                    label: {
	                        text: labelText + "",
	                        font: '14pt monospace',
	                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
	                        outlineWidth: 2,
	                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
	                        pixelOffset: new Cesium.Cartesian2(0, -9)
	                    },
	                    description: '<h4>point no ' + (addedPointEntities.length + 1) + '</h4>'
	                });

	                addedPointEntities.push(obj.id);

	                return true;
	            } else {
	                return false;
	            }


	        },
	        getArea: function(positions){
	        	var that = this;
	        	
	        	if(positions instanceof Array === false){
	        		return null;
	        	}

				// "indices" here defines an array, elements of which defines the indice of a vector
				// defining one corner of a triangle. Add up the areas of those triangles to get
				// an approximate area for the polygon
				
				var indices = Cesium.PolygonPipeline.triangulate(positions, []);
				var area = 0; // In square meters

				for (var i = 0; i < indices.length; i += 3) {
				  var vector1 = positions[indices[i]];
				  var vector2 = positions[indices[i+1]];
				  var vector3 = positions[indices[i+2]];

				  // These vectors define the sides of a parallelogram (double the size of the triangle)
				  var vectorC = Cesium.Cartesian3.subtract(vector2, vector1, new Cesium.Cartesian3());
				  var vectorD = Cesium.Cartesian3.subtract(vector3, vector1, new Cesium.Cartesian3());

				  // Area of parallelogram is the cross product of the vectors defining its sides
				  var areaVector = Cesium.Cartesian3.cross(vectorC, vectorD, new Cesium.Cartesian3());
				  
				  // Area of the triangle is just half the area of the parallelogram, add it to the sum.
				  area += Cesium.Cartesian3.magnitude(areaVector)/2.0;

				}
	        		        		
    			// area = area.toFixed(2);

    			var areaInHectare = (area / 1e4).toFixed(2);

    			let resultObj = {
    				areaInHectare: areaInHectare,
    				areaInHectareString: areaInHectare + "ha",
    				areaInMeter: 0,
    				areaInMeterString: undefined,
    			}
    			
    			resultObj.areaInMeter = area.toFixed(2);

    			if(area >= 1e6) {
    				area = area / 1e6;
    				resultObj.areaInMeterString = area.toFixed(2) + ' sqkm';
    			} else {
    				resultObj.areaInMeterString = area.toFixed(2) + ' sqm';
    			}

    			return resultObj;
	        },
	        calculateANDSetArea: function(entity) {
	        	var that = this;
	        	
	        	if(!entity || !entity.polygon || !entity.polygon.hierarchy){
	        		return null;
	        	}

	        	var hierarchy = entity.polygon.hierarchy;
	        	var positions = hierarchy.getValue();
				
				return that.getArea(positions);
	        },
	        drawPolygon: function (obj) {
	            var that = this;
	            var currentPolygonId = that.getCurrentPolygonId();
	            
	            obj = obj || {};

	            obj.name = obj.name || 'Red polygon on surface';
	            obj.id =  currentPolygonId;
	            obj.outline = obj.outline ? true : false;
	            obj.outlineColor = obj.outlineColor || Cesium.Color.WHITE;
	            obj.outlineWidth = obj.outlineWidth || 2;
	            obj.material = obj.material || Cesium.Color.RED.withAlpha(0.5);

	            if (active) {

	                that.checkInitilization();

	                var redPolygon = cesiumViewer.entities.add({
	                    id: obj.id,
	                    name: obj.name,
	                    position: new Cesium.CallbackProperty(function(){
	                    	var center = Cesium.BoundingSphere.fromPoints(polygonLocationData[currentPolygonId].pointsArray).center;	    	                
	    	                //center = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(center);
	    	                return center;
	                    }, false),
	                    polygon: {
	                        hierarchy: new Cesium.CallbackProperty(function(){	                        		
	                                return polygonLocationData[currentPolygonId].pointsArray;
	                            }, false),
	                        // Cesium.Cartesian3.fromDegreesArray(finalArray),
	                        material: obj.material,
	                        outline: obj.outline,
	                        outlineColor: obj.outlineColor,
	                        outlineWidth: obj.outlineWidth,
	                        //extrudedHeight: 0,
	                        //height: 0,
	                        perPositionHeight: true,
	                    },
	                    inSiteType : "annotationArea",
	                });
	                lastPolygonId = obj.id;
	                addedPolygonEntities.push(obj.id);	                
	            } else {
	                return false;
	            }
	        },
	        drawLabel: function(resultObj){
	        	
	        	var that = this;
	        	let label = undefined;

	        	var entity = that.getPolygonById(lastPolygonId);
	        	
	        	if(!entity){
	        		return false;
	        	}
	        	
	        	if(resultObj){

	        		label = resultObj.areaInHectareString + " / " + resultObj.areaInMeterString;
	        	}

	        	label = label || "No Label";
	            
	            if(entity.label){
	            	entity.label.text = label;
	            } else{
	            	entity.label = new Cesium.LabelGraphics({
		                text : label,
		                //verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
		                //horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
		                //pixelOffset: new Cesium.Cartesian2(10, 10),
		                //font : new Cesium.ConstantProperty('16px sans-serif'),
		                style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                      	fillColor: Cesium.Color.WHITE,
                      	backgroundColor: Cesium.Color.BLACK,
                      	showBackground: true,
                      	//outlineWidth: 12,
                      	scale : 0.6,
                    	pixelOffset : new Cesium.Cartesian2(0, -10),
                    	eyeOffset   : new Cesium.Cartesian3(0,0,-0.1),
		                //backgroundPadding: new Cesium.Cartesian2(7, 5)
		                //eyeOffset: new Cesium.Cartesian3(0,0,-200)
		                //horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
						//pixelOffsetScaleByDistance : new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 5)
	            	});
	            }
	            
	        }
	        
			
	};
	
	base["setActive"] = function(status){
		active = status;
	}
	
	base["getActive"] = function(){
		return active;
	}
	
	base["setNoOfPoint"] = function(data){
		noOfPoint = data;
	}
	
	base["getNoOfPoint"] = function(){
		return noOfPoint;
	}
	
	base["getLastPolygonId"] = function(){
		return lastPolygonId;
	}
	
	return base;	
	
})();

