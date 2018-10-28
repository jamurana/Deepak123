/// load JS config files
///
/// We load the global pre-load config script first, then the data config script, and finally the global post-load config script
/// This will be expanded later to handle pulling in specific portal and industry-specific config layers too
//import * as inSiteData from './insite_data_m';
// import {INSITEProjects, insiteActiveProject} from './insite_data_m';
//import * as inSiteLib from './inSite_lib_m';
// import {insiteLoadAnnotations} from './insite_annotation_m';

export function insiteLoadGlobalPreConfig() {
  /// runs the pre-load config script, and on success then runs the data config script
    let globalPreConfigFile = "globalconfig/pre_load.js";
    $.getScript(globalPreConfigFile)
    .done(function(script, textStatus) {
      insiteLoadDataConfig();
    })
    .fail(function( jqxhr, settings, exception ) {
      let errorMsg = "Error loading inSite global config script: " + globalPreConfigFile + ", exception: " + exception;
      insiteConsole(errorMsg);
      alert(errorMsg);
      console.error(exception);
    });
    
} 

export function insiteLoadGlobalPostConfig() {
    let globalPostConfigFile = "globalconfig/post_load.js";
    $.getScript(globalPostConfigFile)
    .done(function(script, textStatus) {

    })
    .fail(function( jqxhr, settings, exception ) {
      let errorMsg = "Error loading inSite global config script: " + globalPostConfigFile + ", exception: " + exception;
      insiteConsole(errorMsg);
      alert(errorMsg);
      console.error(exception);
    });
}

export function insiteLoadDataConfig(configname) {
/// load the config script from DATA/dataconfig/, and on success run the post-load config script
/// you can pass in a config file basename (i.e "xxx" becomes "DATA/dataconfig/xxx.js"), otherwise it will look for a
/// config parameter in the URL (e.g "?config=xxx"), and finally falling back to the default config

    if (!configname) {
      configname = getURLParameterByName("config");
    }
    // the insiteServerToken var will only exist if it has been passed in from the server  
    if (typeof insiteServerToken !== 'undefined') {
      console.log("insiteServerToken: " + insiteServerToken);
      if (insiteServerToken) { // passed in from server-side back end
        configname = insiteServerToken; 
      }
    }
    if (!configname) {
      configname = "default";
    }

    configname = 'DATA/dataconfig/' + configname + '.js';
    console.log("running dataconfig script: '" + configname + "'");

    $.getScript(configname)
    .done(function(script, textStatus) {
      insiteLoadGlobalPostConfig();    
    })
    .fail(function( jqxhr, settings, exception ) {
        let errorMsg = "Error loading inSite config script: " + configname + ", exception: " + exception;
        insiteConsole(errorMsg);
        alert(errorMsg);
        console.error(exception);
    });
}

export function insiteSetClientLogo(image_url, link_url) {
/// loads a client logo to the top-right corner
    $(".navbar-brand").html("AUAV inSite™ <a href=\"" + link_url + "\" target=_blank><img height=55px src='" + image_url + "'></img></a>");
}

// call them in cascading order when the page is finished loading
$( document ).ready(function() {

    insiteLoadGlobalPreConfig();
});

