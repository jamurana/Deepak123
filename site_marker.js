export var siteMarkers  = (function (){

	const DEFAULT_NEAR_CONST = 3000;			//in meter
	const DEFAULT_FAR_CONST  = 8000;			//in meter

	const MAX_TRANSPARENT_LIMIT = 1.0;
	const MIN_TRANSPARENT_LIMIT = 0.0;

	const ID_PREFIX = "pointerdata.";

	function createID(idValue){
		return ID_PREFIX + (idValue || new Date().getTime());
	}

	function pointerData(o){

		if(!o){
			return null;
		}

		let that = this;

		this.id      = createID(o.id);
		this.center  = o.center;
		this.near    = isNaN(o.nearValue) ? DEFAULT_NEAR_CONST:parseInt(o.nearValue);
		this.far     = isNaN(o.farValue)  ? DEFAULT_FAR_CONST :parseInt(o.farValue);
		this.visible = (o.visible === undefined || o.visible === null) ? true:!!o.visible;

		this.entity = Cesium.when(pinBuilder.fromMakiIconId('star', Cesium.Color.RED, 32), function(createdPin) {
		 		return viewer.entities.add({
						id: that.id,
				        position : that.center.clone(),        
				        billboard : {
							image : createdPin.toDataURL(),
							verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
							translucencyByDistance : new Cesium.NearFarScalar(that.near, MIN_TRANSPARENT_LIMIT, that.far, MAX_TRANSPARENT_LIMIT)
						},
						inSiteType : "projectMarker",
				});
		 });

		//adding it to list
		pointerDatasetMap[this.id] = this.entity;
	}

	let pointerDatasetMap = {};

	function isPointerVisible(o){
		if(!(o instanceof pointerData)){
			return false;
		}
		return o.visible;
	}

	function getPointerById(id){
		if(id){
			return pointerDatasetMap[id];
		}
	}

	function getEntityByPointerObject(o){
		if(o instanceof pointerdata){
			return o.entity;
		}
	}

	function getEntityById(id){
		if(id){
			return pointerDatasetMap[id].entity;
		}
	}	

	let base = {
		//pointerData: pointerData,
		create: function(o){
			return new pointerData(o);
		},
		getEntityById: getEntityById,
		getEntityByPointerObject: getEntityByPointerObject,
		getPointerById: getPointerById		
	};

	return base;
})();