/// NOTE: this file will not be loaded from here, it is only here as a template/example of a dataconfig
/// file, to be saved to DATA/dataconfig/default.js (or other custom name to be loaded by ?config=xxx)


// load in our custom 3D tiles
// TODO: datasets should be linked to a profile, not all loaded for everyone
//inSiteLoad3DTiles(viewer, 'DATA/Telstra Exchange Baulkham Hills/Scene/Telstra_Exchange_Baulkham_Hills.json', 'Telstra Exchange Baulkham Hills', 44);
inSiteLoad3DTiles(viewer, 'DATA/AusGrid/Beacon_Hill_demo/model/Ausgrid_Cesium.json', 'Ausgrid Frenchs Forest', 39.35, "DATA/AusGrid/Beacon_Hill_demo/model/cameras.xml");
//inSiteLoad3DTiles(viewer, 'DATA/Golf Course Solar/Golf_Course_Solar.json', 'Golf Course Solar', 115);
//inSiteLoad3DTiles(viewer, 'DATA/3D_tiles/aurecon_bridge/Cesium.json', 'Aurecon Bridge', 135.2);
//inSiteLoad3DTiles(viewer, 'DATA/3D_tiles/mobile_tower/cesium.json', 'mobile tower', 25);
//inSiteLoad3DTiles(viewer, 'DATA/3D_tiles/blacktown_sports_park/Cesium.json', 'Blacktown Sports Park', 29);
inSiteLoad3DTiles(viewer, 'DATA/BCC/BCC_basin/model/Cesium.json', 'Basin 6.1', 24);
//inSiteLoad3DTiles(viewer, 'DATA/BCC/Binks_Cottage/model/Cesium.json', 'Binks Cottage', 24);

// load in our own tiled imagery
//inSiteLoadOrtho(viewer, 'DATA/tiles/erskine_png/', 'Erskine Park', 18, 22);

// TEMP - test loading in a KML
//viewer.dataSources.add(Cesium.KmlDataSource.load('http://localhost:8080/DATA/ausgrid_FF_extent.kml', {camera:viewer.scene.camera, canvas:viewer.scene.canvas}));
//inSiteLoadKML(viewer, 'DATA/St_George_grid.kmz', "St George power network");
//inSiteLoadKML(viewer, 'DATA/GHD_hunter_water_floodgates.kmz', "Hunter River 33 Floodgates");

// set the initial view
// TODO: again, this should be linked to the profile, probably default to a global view, or last viewed location
inSiteJumpToLocation('Ausgrid Frenchs Forest');
