/// this config script is run after the dataconfig script file, for any post-load config to be done

console.log("post-config run, project count: " + INSITEProjects.length);

insiteLoadAnnotations(insiteActiveProject); // TEMP -- should either load them all here, or otherwise load per-project when navigating to it

insiteConsole("Ready");
