var test_mode = ('update_url' in chrome.runtime.getManifest()) ? false : true; // If loaded from Web Store instead of local folder than getManifest has update_url property
var running_script = "background";
var tab_id = false; // Will be id of Speech Recognition tab window when it is open
var tab_url = false; // Will be url of Speech Recognition tab window
var window_id = false; // Version 1.2.0 - Will be window id of Speech Recognition tab
var last_active_tab = false;
var beep = new Audio("audio/beep.mp3");
var low_beep = new Audio("audio/lowbeep.mp3");

// Listen to message from content or sr.js script
chrome.runtime.onMessage.addListener(
	function listen_to_content(obj, sender, sendResponse) {
		//tab_id = sender.tab.id; // Get id of sender
    	//if (test_mode) console.log(tab_id);
    	
    	if (obj.hasOwnProperty("beep"))
		{
			beep.playbackRate = 1;
			beep.play();
		}
		if (obj.hasOwnProperty("low_beep"))
		{
			low_beep.play();
		}
		if (obj.hasOwnProperty("end_beep"))
		{
			beep.playbackRate = 1.75;
			beep.play();
		}
		//send_to_content(obj);
    	
      	sendResponse({farewell: "From background: I got the object."});
  });




/* Open a new tab using chrome.tabs
	chrome.tabs can only be used by background.js
*/
// Called when a user clicks on the browserAction icon in the toolbar
chrome.browserAction.onClicked.addListener(function(tab) {
	//chrome.tabs.create({"url": "http://seabreezecomputers.com/rater"});
	if (tab_id == false)
		open_sr_page(); // Open speech recognition page if it is not open
	else if (sra.settings['click_to_close']) // Version 1.2.0
		chrome.tabs.remove(tab_id);
	else
	{
		//var active_toggle = sra.settings['start_in_background'] ? false : true;
		chrome.tabs.update(tab_id, {active: true}); // Focus on the page if it is not focused
		chrome.windows.update( window_id, {focused: true}); // Version 1.2.0 - Focus on the window
	}
	//console.log("clicked");
}); 

function open_sr_page() {
	var active_toggle = sra.settings['start_in_background'] ? false : true;
	// Found out I don't really need chrome.extension.getURL. It understands relative paths
    //chrome.tabs.create({"url":chrome.extension.getURL("sr.html"),"selected":true}, function(tab){
    chrome.tabs.create({"url":"sr.html","selected":active_toggle}, function(tab){
        console.log(tab); // Version 1.3.2 test
		tab_id = tab.id;
        tab_url = tab.pendingUrl || tab.url; // Version 1.3.2 - Chrome 79 added PendingUrl on 12/17/2019 - https://developer.chrome.com/extensions/tabs
		window_id = tab.windowId; // Version 1.2.0
        //updateBadge(); // Version 1.1.8 - Removed
		chrome.browserAction.setBadgeText({text: "..."}); // Version 1.1.8 - Initializing...
		chrome.browserAction.setBadgeBackgroundColor({"color": [255, 0, 0, 100]}); 
    });
}



// get the currently active tab
/*chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
  console.log(tabs[0]);
}); */

// Find out if any tab is removed
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (tabId == tab_id) // sr.html tab has been closed
    {
    	tab_id = false;
    	updateBadge();
    }
	//console.log(tabId);
});

// Find out if any tab has been updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if (tabId == tab_id) // sr.html tab has been updated
    if (tab.url != tab_url) // And they changed the url of sr.html to another page!
    {
    	tab_id = false;
    	updateBadge();
    }
	//chrome.browserAction.setBadgeText({text: newText, tabId: tab.id});
});

// Find out when a tab has been activated 
// So this is called when a tab is switched to 
chrome.tabs.onActivated.addListener(function(activeInfo) {
  	
  	updateBadge(activeInfo.tabId);
	last_active_tab = activeInfo.tabId;
  	// how to fetch tab url using activeInfo.tabid
  	chrome.tabs.get(activeInfo.tabId, function(tab){
     	//console.log(tab.url);
  });
}); 


// Find out if a tab has been created
chrome.tabs.onCreated.addListener(function(activeInfo) {
    updateBadge(activeInfo.tabId);
	last_active_tab = activeInfo.tabId;
    //chrome.browserAction.setBadgeText({text: newText, tabId: tab.id});
});


function updateBadge(tabId)
{
	if (tab_id != false) // if speech recognition window is open
  	{
  		//chrome.browserAction.setBadgeText({text: "On", tabId: tabId});
  		chrome.browserAction.setBadgeText({text: "On"}); // Removed tabID to affect every tab
		chrome.browserAction.setBadgeBackgroundColor({"color": [255, 0, 0, 100]}); 
		
		if (sra.settings.use_wakeup_phrase && !sra.settings.wakeup_timeout) // Listening for wakeup phrase
		{	
			chrome.browserAction.setBadgeText({text: 'On'}); // Removed tabID to affect every tab
			chrome.browserAction.setBadgeBackgroundColor({"color": [200, 200, 0, 200]}); // yellow, transparency
		}	
		else if (sra.settings.use_wakeup_phrase) // Detected wakeup phrase
		{
			chrome.browserAction.setBadgeText({text: 'On'}); // Removed tabID to affect every tab
			chrome.browserAction.setBadgeBackgroundColor({"color": [255, 0, 0, 100]}); // red, transparency	
		}
		
		if (sra.settings.sr_audio_pause) // pausing because of audio being played in a tab
		{	
			chrome.browserAction.setBadgeText({text: 'Off'}); // Removed tabID to affect every tab
			chrome.browserAction.setBadgeBackgroundColor({"color": [200, 200, 0, 200]}); // yellow, transparency
		}
		
		if (sra.settings.prevent_display_sleep)
			chrome.power.requestKeepAwake("display"); 
		else if (sra.settings.prevent_system_sleep)
			chrome.power.requestKeepAwake("system"); 
		else
			chrome.power.releaseKeepAwake(); // Allow system to sleep again	
				
	}
	else // if speech recognition window is closed 
	{
		chrome.browserAction.setBadgeText({text: ""});	// Remove "On" badge
		
		if (sra.settings.prevent_system_sleep || sra.settings.prevent_display_sleep)
			chrome.power.releaseKeepAwake(); // Allow system to sleep again
	}
}


function processObject(obj)
{
	// Called from storage.js
	for (var key in obj)
	{
		if (obj.hasOwnProperty(key))
		{
			if (typeof(obj[key])=="object")
			{ 
				processObject(obj[key]);
			}
			else
			{
				if (key.match(/^use_wakeup_phrase/i)) // this will match if it is true or false .oldValue .newValue
					updateBadge();	
				if (key.match(/^prevent_display_sleep/i)) // this will match if it is true or false .oldValue .newValue	
					updateBadge();
				if (key.match(/^prevent_system_sleep/i)) // this will match if it is true or false .oldValue .newValue	
					updateBadge();
			}
		}
	}
}


// Version 1.0.4 - Check whether new version is installed and display notification
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        console.log("This is a first install!");
        //alert(JSON.stringify(details));
    }else if(details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
        var extName = chrome.runtime.getManifest().name;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        //alert(JSON.stringify(details));
        var string = "Updated from " + details.previousVersion + " to " + thisVersion + ".\n"+
        			"FEATURES:\n"+
        			"* Export/Import custom commands.\n"+
        			"* (Play (song)) is no longer in commands, but is only in custom commands.\n"+
					"";
        if (thisVersion == "1.0.5") alert(string);
    }
});


function start_all() {
	// if we haven't got chrome.storage yet then call this function later
	if (!storage_ready)
	{
		setTimeout(function()
		{
			start_all();
		} , 200);
		return;
	}
	
	if (sra.settings['start_with_chrome'])
		open_sr_page();
}

/* If we closed Chrome with the Speech Recognition Anywhere tab left open
	then when we start Chrome again the badge is left to "On". So we need
	to call update badge when background is first loaded to turn it off
*/
updateBadge();

window.onload = start_all;

