var sra = { 
	settings : { 
		"select_language" : false,
		"start_with_chrome" : false,
		"start_in_background" : false,
		"submit_search_fields" : false,
		"pause_for_audio" : false, /* should we pause speech recognition if audio is playing in a tab? */
		"sr_audio_pause" : false, /* is speech recognition paused because of audio playing in a tab */
		"virtual_assistant_mode" : false,
		"use_wakeup_phrase" : false,
		"wakeup_phrase" : false,
		"use_wakeup_timeout" : false,
		"wakeup_timeout" : false, 
		"wakeup_beep" : false,
		"wakeup_low_beep" : false,
		"end_beep" : false,
		"prevent_display_sleep" : false,
		"prevent_system_sleep" : false,
		"disable_interim" : false,
		"disable_speech2text" : false,
		"disable_commands" : false,
		"disable_autofocus" : false,
		"auto_punctuation" : false,
		"remove_auto_capitalize" : false,
		"select_voice" : false,
		"tts_pitch" : false,
		"tts_rate" : false,
		"tts_highlight" : false,
		"tts_scroll" : false,
		"tts_simple" : false, /* Version 1.2.3 - turn off reading of ARIA roles and tag names */
		"tts_speaking" : false, /* Version 1.2.0 - is tts screen reader speaking */
		"chrome_windows" : false, /* Version 1.2.0 - Allow SR in other chrome windows */
		"click_to_close" : false, /* Version 1.2.0 - Click icon 2nd time to close */
	}
}

var uri = window.location.hostname; // www.seabreezecomputers.com
var still_saving = false; // Needed for save_to_storage otherwise if called twice in a row we get the previous object before it is saved with local.set
var test_mode = ('update_url' in chrome.runtime.getManifest()) ? false : true; // If loaded from Web Store instead of local folder than getManifest has update_url property
var storage_ready = false; // It takes a while for chrome.storage.local.get to get the storage object


function get_from_storage(top_key)
{
	/* set top_key to null to get an object with all the storage values */
	chrome.storage.local.get(top_key, function(obj)
	{
	 	//if (typeof obj[top_key] == "undefined") return false; // key does not exist so return
	 	// or we could do
	 	//if (obj.hasOwnProperty(top_key) == false) return false; // key does not exist so return
	 	if (chrome.runtime.lastError) console.error(chrome.runtime.lastError); // Version 1.0.7
	    
		if (test_mode) console.log("Get from storage: "+JSON.stringify(obj));
	    /*
	    if (obj[top_key].hasOwnProperty("font_times"))
	    	change_fontsize(parseFloat(obj[top_key]["font_times"])); // turn into number
	    if (obj[top_key].hasOwnProperty("color"))
	    	change_fontcolor("color", obj[top_key]["color"]);
	    if (obj[top_key].hasOwnProperty("background-color"))
	    	change_fontcolor("background-color", obj[top_key]["background-color"]);
	    */
		// Merge with settings object
		mergeObject(sra, obj); 	
		storage_ready = true;   
	});
} // end function get_from_storage()


function save_to_storage(obj)
{		
	// Save to chrome.storage
	chrome.storage.local.set(obj, function() 
	{
	  	still_saving = false;
		if (test_mode) console.log("Saved to storage: "+JSON.stringify(obj));
	  	
		if(chrome.runtime.lastError)
	    {
	        console.log(chrome.runtime.lastError.message);
	        return;
	    } 
	});
} // end function save_to_storage(option_obj)


chrome.storage.onChanged.addListener(function(changes, namespace) {
	// The namespace is "sync", "local" or "managed"
	if (test_mode) console.log("Changes to storage: "+JSON.stringify(changes));
	for (key in changes) {
		var storageChange = changes[key];
 	 	/*console.log('Storage key "%s" in namespace "%s" changed. ' +
	              'Old value was "%s", new value is "%s".',
	              key,
	              namespace,
	              storageChange.oldValue,
	              storageChange.newValue); */
	    sra[key] = changes[key].newValue;
	    //if (test_mode) console.log("sra object: "+JSON.stringify(sra));
		// When deleted: Storage key "toggle" in namespace "local" changed. Old value was "Object", new value is "undefined".
		// When created: Storage key "toggle" in namespace "local" changed. Old value was "undefined", new value is "Object".
		/* NOTE: A new cookie only has newValue and no oldValue property
			NOTE: A deleted cookie only has an oldValue and no newValue propery */
	}
	if (typeof processObject === "function") processObject(changes);
});	

/* mergeObject(old_object, new_object) */
function mergeObject (o, ob) 
{
    for (var z in ob) 
	{ 
	  	if (ob.hasOwnProperty(z)) 
		{ 
			if (o[z] && typeof o[z] == 'object' && typeof ob[z] == 'object') 
				o[z] = mergeObject(o[z], ob[z]); 
			else 
				o[z] = ob[z]; 
		} 
	}	
    return o;
} // end function mergeObject (o, ob) 


//window.onload = get_from_storage;	
//chrome.storage.local.clear(); // Uncomment this to clear all of the local storage
get_from_storage(null);  // put null to see all objects saved


