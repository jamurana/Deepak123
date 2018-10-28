
export var cameraOrbit = (function (){

	const MAX_ANGLE = 360;		//in degree
	const MAX_TIME_INTERVAL = 100; //0.2 seconds
	const MIN_TIME_INTERVAL = 25; // 0.025 seconds
	const HEADING_INTERVAL  = 1;

	let speedInterval = 5;
	let flyDuration   = 10;
	let timeInterval  = 0;
	let defaultTimeInterval = 80;
	let destination   = null;
	let isPaused      = false;

	var currentHeading = 0;

	function getTarget(project) {
	    let target = null;
	    switch (project && project.data[0].type) {
	        case INSITEDataType.ORTHO:
	            target = project.data[0].dataObject;
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

	function move(h) {
		if (!(destination.data instanceof Array && destination.data.length > 0)){
			return;
		}

		var target = getTarget(destination);
		if (!target) {
			return;
		}

		var p = viewer.scene.camera.pitch;
		var r = 0;
		
		if (destination.data[0].center) {
			r = Cesium.Cartesian3.distance(destination.data[0].center, viewer.camera.position);
		}

		var hpr = new Cesium.HeadingPitchRange(Cesium.Math.toRadians(h), p, r);
		var opt = {
					duration: flyDuration,
					//maximumHeight: MAXIUM_HEIGHT,
					offset: hpr
				}

		viewer.zoomTo(target, hpr);
		//viewer.flyTo(target, opt);
	}

	let timerObject = null;

	function getValidTimeinterval(time) {
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
			console.log("speedInterval:  " + speedInterval);
			console.log("currentHeading: " + currentHeading);
			console.log("timeInterval:   " + timeInterval);
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
		stop: function() {
			if (timerObject) {		
				this.clearTimer(timerObject);
				currentHeading = 0;
			}
			destination = null;
			this.headingInterval = 1;
		},
		start: function(interval, angle) {
			return this.init(interval, angle);
		},
		toggle: function() {
			if (this.isRunning()) {
				this.stop();
			} else {
				this.start();
			}
		},
		isRunning: function() {
			return (destination != null);
		},
		clearTimer: function(timerObject) {
			if(timerObject){
				clearInterval(timerObject);
				timerObject = null;
			}
		},
		pause: function() {
			if(isPaused){
				return false;
			}
			this.clearTimer(timerObject);			
			isPaused = true;
			return true;
		},
		resume: function() {
			if(!isPaused){
				return false;
			}
			this.init(timeInterval, currentHeading);
			isPaused = false;
			return true;
		},
		init: function(interval, startAngle) {
			let that = this;
			this.stop();

			if(!insiteActiveProject || !inSiteGetProject(insiteActiveProject)){
				throw "Can not find current inSite project: " + insiteActiveProject;
			}
			if(!(inSiteGetProject(insiteActiveProject).data instanceof Array 
				&& inSiteGetProject(insiteActiveProject).data.length > 0)){
				throw "Can not find any dataset in inSite project: " + insiteActiveProject;
			}

			destination = inSiteGetProject(insiteActiveProject);
			currentHeading = Cesium.Math.toDegrees(viewer.scene.camera.heading);

			timeInterval = interval || defaultTimeInterval;
			timeInterval = getValidTimeinterval(timeInterval);
			
			timerObject = setInterval(function() {
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
