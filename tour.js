export var tourController = (function(){

	const MAX_ANGLE = 360;		//in degree

	const MAX_TIME_INTERVAL = 100; //0.2 seconds

	const MIN_TIME_INTERVAL = 25; // 0.025 seconds

	const HEADING_INTERVAL = 1;

	const MIN_RANGE = 40;

	const MAX_RANGE = 120;

	const defaultRange = 80;

	let speedInterval = 5;

	let flyDuration = 10;

	const MAXIUM_HEIGHT = 20;

	var currentHeading = 0;

	let timeInterval = 0;
	let defaultTimeInterval = 80;

	let destination = null;

	let isRunning = false;

	let isPaused = false;

	function getTarget(project){

		if (!project) {
	      return null;
	    }

	    let target = null;

	    switch (project.data[0].type) {
	        case INSITEDataType.ORTHO:
	            target = project.data[0].dataObject;
	            //viewer.camera.setView({  destination : Cesium.Rectangle.fromDegrees(150.77727425, -33.82400461, 150.79686701, -33.81453397) });  // TEMP
	            break;
	        case INSITEDataType.TILE3D:
	            target = project.data[0].dataObject;
	            break;
	        case INSITEDataType.KML:
	            target = project.data[0].dataObject;
	            break;
	    }

	    return target;
	}

	function move(h){

		
		if(!(destination.data instanceof Array 
				&& destination.data.length > 0)){
			return;
		}

		var target = getTarget(destination);

		if(!target){
			return;
		}


		var p = viewer.scene.camera.pitch;
		var r = 0;
		
		if(destination.center){
			r = parseInt(Cesium.Cartesian3.distance(destination.center, viewer.camera.position));
		}

		if(r > MAX_RANGE || r < MIN_RANGE){

			r = defaultRange;
		}

		var hpr = new Cesium.HeadingPitchRange(Cesium.Math.toRadians(h), p, r);
		var opt = {
					duration: flyDuration,
					maximumHeight: MAXIUM_HEIGHT,
					offset: hpr
				}

		viewer.zoomTo(target, hpr);
		//viewer.flyTo(target, opt);
	}

	let timerObject = null;


	function getValidTimeinterval(time){

		if(time >= MIN_TIME_INTERVAL && time <= MAX_TIME_INTERVAL){

			return time;
		} else if(time < MIN_TIME_INTERVAL){
			return MIN_TIME_INTERVAL;
		} else if(time > MAX_TIME_INTERVAL){
			return MAX_TIME_INTERVAL;
		} else{
			return time;
		}
	}
	
	let base = {
		headingInterval : HEADING_INTERVAL,
		printStatus: function(){
			console.log("speedInterval: " + speedInterval);
			console.log("currentHeading: " + currentHeading);
			console.log("timeInterval: " + timeInterval);
		},
		setHeadingInterval: function(v){
			v = isNaN(v) ? 1: eval(v);

			v = v % MAX_ANGLE;

			this.headingInterval = v;
		},
		increaseSpeed: function(){

			this.pause();

			timeInterval = getValidTimeinterval(timeInterval - speedInterval);
			this.resume();

		},
		decreaseSpeed: function(){

			this.pause();
			timeInterval = getValidTimeinterval(timeInterval + speedInterval);
			this.resume();
		},
		getCurrentSpeed: function(){
			return speedFactor;
		},
		reset: function(){

			if(timerObject){
				
				this.clearTimer(timerObject);
				currentHeading = 0;
			}
			destination = null;
			this.headingInterval = 1;
		},
		start: function(interval, angle){
			return this.init(interval, angle);

		},
		stop: function(){
			return this.reset();
		},
		clearTimer: function(timerObject){

			if(timerObject){
				clearInterval(timerObject);
				timerObject = null;
			}
		},
		pause: function(){
			if(isPaused){
				return false;
			}

			this.clearTimer(timerObject);			
			isPaused = true;

			return true;
		},
		resume: function(){

			if(!isPaused){
				return false;
			}
			
			this.init(timeInterval, currentHeading);
			isPaused = false;

			return true;
		},
		init: function(interval, startAngle){
			let that = this;
			//reset the tour
			this.reset();

			if(!insiteActiveProject || !inSiteGetProject(insiteActiveProject)){

				throw "Can not found any project: " + insiteActiveProject;
			}

			if(!(inSiteGetProject(insiteActiveProject).data instanceof Array 
				&& inSiteGetProject(insiteActiveProject).data.length > 0)){

				throw "Can not found any data from project: " + insiteActiveProject;
			}

			destination = inSiteGetProject(insiteActiveProject);
			currentHeading = startAngle || 1;

			timeInterval = interval || defaultTimeInterval;
			timeInterval = getValidTimeinterval(timeInterval);
			
			timerObject = setInterval(function(){
		
				//console.log(currentHeading);
				move(currentHeading);
				currentHeading = (currentHeading + that.headingInterval) % MAX_ANGLE;
				//currentHeading = ((currentHeading + HEADING_INTERVAL) * speedFactor) % MAX_ANGLE;
				//console.log(currentHeading);
			}, timeInterval);

		},
	}

	return base;
})();