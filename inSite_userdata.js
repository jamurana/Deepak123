// user data storage/retrieval at a user/project/client/global level

// TEMP: these will use HTML5 localstorage for now as a placeholder, and replace with suitable database/backend later, so they will all be browser specific not user/project/client/global specific


export function INSITEUserData() 
{
	// get/set just for the user
	this.getUserData = function(username, token) 
	{
		return JSON.parse(localStorage.getItem(token));
	};
	this.setUserData = function(username, token, value) 
	{
		localStorage.setItem(token, JSON.stringify(value));
	};

	// get/set for everyone accessing the project
	this.getProjectData = function(projectID, token) 
	{
		return this.getUserData(token); // TEMP
	};
	this.setProjectData = function(projectID, token, value) 
	{
		this.setUserData(token, value); // TEMP
	};

	// get/set data for everyone at a client portal level
	this.getClientData = function(clientID, token) 
	{
		return this.getUserData(token); // TEMP
	};
	this.setClientData = function(clientID, token, value) 
	{
		this.setUserData(token, value); // TEMP
	};

	// get/set data at a global level
	this.getGlobalData = function(token) 
	{
		return JSON.parse(localStorage.getItem(token)); // TEMP
	};
	this.setGlobalData = function(token, value) 
	{
		localStorage.setItem(token, JSON.stringify(value)); // TEMP
	};
}

