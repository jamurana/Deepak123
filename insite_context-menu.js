export let contextMenuController = (function(){

	function contextData(name, lable){
		this.name = name;
		this.lable = lable;
		this.active = true;
		this.clickListener = undefined;
	}

	let menuItems = {};
	let targetTagSelector = "";
	let menuTagSelector = ".custom-menu";

	let menuDisplayCondition = function() { return true;}

	let lastClickPosition = undefined;
	
	function setLocation(position) {

		if(!position) {
			lastClickPosition = undefined;
			$(menuTagSelector).hide();
		} else {
			lastClickPosition = position;
			$(menuTagSelector).show();
			$(menuTagSelector).css({top: position.y, left: position.x, position:'absolute'});
		}
	}

	function getItem(name) {

		return menuItems[name];
	}

	function setActive(name, active) {
		active = !!active;
		let item = menuItems[name];

		if(item instanceof contextData) {
			item.active = active;

			//reloading the view
			contextMenuController.refreshMenuItems();
			return item.active;
		} 

		return undefined;
	}
	
	function init(tagId, menuTag, menuItem) {

		if(tagId) {

			targetTagSelector = tagId;
			menuTagSelector = menuTag;

			if(menuItem instanceof Array) {

				menuItem.forEach(function(itm) {

					contextMenuController.addItem(itm);
				})
			}

			contextMenuController.refreshMenuItems();
		}
	}

	function addItem(itemObject) {

		if(itemObject instanceof contextData) {

			menuItems[itemObject.name] = itemObject;
		}
	}

	

	function refreshMenuItems() {

		if(!menuTagSelector){
			return;
		}

		let str = "";

		for(let key in menuItems) {

			let item = menuItems[key];
			if(menuItems.hasOwnProperty(key) && item instanceof contextData) {

				if(item.active) {

					str += '<li class="context-menu-item" ' + 
						'data-action = "' + item.name + '">'+
						item.lable + '</li>';
				} else {

					str += '<li class="context-menu-item disabled" ' + 
						'data-action = "' + item.name + '">'+
						item.lable + '</li>';
				}

				
			}
		}

		$(menuTagSelector).html(str);

		//add listeners
		
		// If the menu element is clicked
		$(menuTagSelector + " li").click(function(){
		    
		    let action = $(this).attr("data-action");

		    contextMenuController.triggerOnClickListener(action, [lastClickPosition]);
		  
		    // Hide it AFTER the action was triggered
		    $(menuTagSelector).hide(100);
		  });
	}

	function triggerOnClickListener(menuItemName, args) {

		let item = getItem(menuItemName);

		if(item instanceof contextData) {

			if(typeof item.clickListener === "function") {

				if(item.active) {

					item.clickListener.apply(null, args)
				}
			}

		}
	}

	let base = {
		init: function() {
			init.apply(this, arguments);
		},
		triggerOnClickListener: function() {
			triggerOnClickListener.apply(this, arguments);
		},
		refreshMenuItems: function() {
			refreshMenuItems.apply(this, arguments);
		},
		addItem: function() {
			addItem.apply(this, arguments);
		},
		setLocation: function() {
			setLocation.apply(this, arguments);
		},
		getItem: function() {
			return getItem.apply(this, arguments);
		},
		setActive: function() {
			return setActive.apply(this, arguments);
		},
		contextData: contextData
	}

	return base;

})();