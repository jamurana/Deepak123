// defines the custom datatypes used throughout inSite


export var INSITEProjects = []; // array of INSITEProject objects
export var insiteActiveProject = null;

export function INSITELocation()
/// data type for a 3D global location, initially using lat/lon/height, but might support different spatial refs later
/// TODO: consider skipping this in favour of just using cartesian3 throughout? need to consider different coordinate systems though
{
	this.lat      = 0;     // position longitude (TODO: always store in lat/lon? or cartesian?)
	this.lon      = 0;     // position longitude (TODO: always store in lat/lon? or cartesian?)
	this.height   = 0;     // position height (TBD ASL/AHD)
}

export function INSITEOrientation()
// data type for heading/pitch/roll
{
	this.heading  = 0;         // heading in degrees
	this.pitch    = 0;         // pitch in degrees
	this.roll     = 0;         // roll in degrees
}

export function INSITEPhoto()
/// data for a photo including position, orientation and other necessary camera details
{
	this.filename    = "";        // e.g. photos/DJI_0010.JPG, relative to the ROOT data location
	this.res_x       = 0;         // pixel resolution in width
	this.res_y       = 0;         // pixel resolution in height
	this.fov         = 0;         // fov in degrees (TBD on horz/vert/diagonal)
	this.location    = undefined; // location as an INSITELocation object
	this.orientation = undefined; // orientation as an INSITEOrientation object
}

export function INSITEDataset() 
// a single complete dataset element, e.g. one ortho map, one DEM, one 3D tile set, one pano, etc.
{
	this.path = "";              // e.g. tiles3D/ausgrid/ausgrid.json, panos/some_client/some_site/index.html
	this.type = undefined;       // one of the INSITEDataType enum
	
	this.heightOffset = 0.0;     // height offset for loading the data into the globe. This will be a temporary hack in most cases, keep it as an easy fix for now

	this.dataObject = undefined; // object containing the live data, which will be type dependent, e.g. if TILE3D, this will be a Cesium.Cesium3DTileset object
	this.photos = [];            // array of INSITEPhoto objects which make up this dataset (some datasets might not be photo based, e.g. VIDEO, DOC, POINTS, etc)

	this.center = undefined;
}

export var INSITEDataType = {
	ORTHO:   1, // ortho image tiles
	DEM:     2, // DEM terrain tiles
	TILE3D:  3, // Cesium 3D tile set
	OBJ3D:   4, // 3D model e.g glTF
	POINTS:  5, // pointcloud, e.g. LAZ
	KML:     6, // KML or KMZ file
	PANO:    7, // single stitched pano (with HTML code)
	VIDEO:   8, // video file
	DOC:     9, // e.g. PDF report, etc
};

export function INSITEAnnotationComment()
/// comment to an annotation, supporting a comment thread per annotation
{
	this.authorName  = "";
	this.authorEmail = "";
	this.timestamp   = undefined;
	this.commentHTML = "";         // comment content, in plain text or with HTML formatting (including linking to other annotations with @X syntax, e.g. "as we can see in @23")
}

export var INSITEAnnotationType = {
	POINT:    1,
	LINE:     2,
	PATH:     3,
	AREA:     4,
	LINE_RISE: 5,
	LINE_RUN: 6,
	LINE_BURIED: 7,	//TEMP FOR JEMENA
};

export function INSITEAnnotation()
/// annotation, e.g. point comment, polygon comment, etc
{
	this.index           = undefined; // 1-based unique index for annotations, to support the @1, @2, etc linking
	this.timestamp       = undefined; 
	this.name            = undefined; // human name, e.g. "rusted king bolt"
	this.type            = undefined; // one of the INSITEAnnotationType types
	this.points          = [];        // single point for pin, array of two for line, etc, as INSITELocation object(s) -- or cartesian3s?
	this.comments        = [];        // array of INSITEAnnotationComment objects
	this.cam_location    = undefined; // location of view camera when annotation was made, as an INSITELocation object
	this.cam_orientation = undefined; // orientation of view camera when annotation was made, as an INSITEOrientation object
	this.label           = "";        // text label to display, e.g. line distance, slope, pin name, etc

	this.entityID        = undefined; // store the entity ID when added to the cesium entity list
}

export function INSITEProject() 
/// one or more datasets which is considered to be one complete 'site', 'project', etc
{
	this.guid = undefined;
	this.name = "";        // unique name for this project, e.g. "Ausgrid: Frenchs Forest"
	this.show = true;
	this.data = [];        // array of INSITEData objects
	this.annotations = []; // array of INSITEAnnotation objects  -- TBD on whether this should be associated with the project or individual datasets

	this.cam_location    = undefined; // location of default view camera, as an INSITELocation object
	this.cam_orientation = undefined; // orientation of default view camera, as an INSITEOrientation object

	this.center = function() {
		if (this.data.length > 0) {
			return this.data[0].center; // TEMP, should be centroid of all dataset centers, but this will do for now...
		} else {
			return null;
		}
	}
}



