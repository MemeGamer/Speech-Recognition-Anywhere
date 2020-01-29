
var test_mode = ('update_url' in chrome.runtime.getManifest()) ? false : true; // If loaded from Web Store instead of local folder than getManifest has update_url property
var running_script = "sr";
var the_title = ""; // Used to keep track of title when changing title of window for errors
var sr_msg = (document.getElementById('sr_msg')) ? document.getElementById('sr_msg') : false ;
//var current_tab_id = ""; // Current tab we are sending to
// Detect if browser supports speech-recognition
var sr = ('webkitSpeechRecognition' in window) ? true : false;
var speechstart_timer = false;
var beeped = false; // keep track if we already beeped for this wakeup phrase
var net_err_timer; // Version 1.1.2


function update_title(new_title)
var recognition = new webkitSpeechRecognition(); // Version 0.98.1

function start_sr()
{

	setTimeout(function() { // Version 1.1.6 - Added setTimeout to see if Initializing is still happening 1 minute later
		if (sr_msg && sr_msg.innerHTML.match(/^Initializing/i)) {
			error += chrome.i18n.getMessage("network_error"); // Version 1.1.6 // https://support.google.com/chrome/answer/3296214
	  		document.getElementById('error').innerHTML = error;
		}
	} , 60000);

	if (sr) // If speech recognition is available (Chrome only??)
	{
		create_analyser();
		var sr_sound_level = (document.getElementById('sr_sound_level')) ? document.getElementById('sr_sound_level') : false ;
		var recognizing = false;
		var final_transcript = "";
		var final_transcript2 = ""; // Version 1.0.1 - Needed to display auto_punctuation in sr.html without sending it to commands
		//var recognition = new webkitSpeechRecognition();
	  	recognition.continuous = false; // Version 0.98.4 - Changed to false
		recognition.interimResults = true;
		recognition.lang = document.settings_form.select_language.value; // Version 0.98.1
		recognition.start();

		recognition.onstart = function() {
			console.log(new Date().toLocaleString()+" Started Recognizing");
			recognition.lang = document.settings_form.select_language.value; // Version 0.98.1
			if (test_mode) console.log(recognition.lang);
		    recognizing = true;
		    if (document.getElementById("error") && document.getElementById("error").innerHTML.match(/network/i)) { // Version 1.1.6 - Was matching more than "network"
		    	clearTimeout(net_err_timer); // Verison 1.1.2
				net_err_timer = setTimeout(function() { // Version 1.1.2 - Added setTimeout
					document.getElementById("error").innerHTML = ""; // Version 1.1.0 - Erase network error msg because speech is working again.
				} , 2500); // Version 1.1.3 - Changed from 500 to 2500
		    }
	  	};

	  	recognition.onend = function() {
			recognizing = false;
			console.log(new Date().toLocaleString()+" Stopped Recognizing");
			recognition.start();
			/*setTimeout(function()
			{
				recognition.start();
				return;
			} , 1);*/

		};

		recognition.onaudiostart = function() {if (sra.settings.sr_audio_pause) recognition.stop(); /* Version 1.0.8 */ console.log(new Date().toLocaleString()+' Audio capturing started'); if (sr_msg && sr_msg.innerHTML.match(/^Initializing/i)) {sr_msg.innerHTML = ""; updateBadge(); } /* Version 1.1.8 */ }; /* Version 1.1.0 */
		recognition.onsoundstart = function() {if (sra.settings.sr_audio_pause) recognition.stop(); /* Version 1.0.8 */ console.log(new Date().toLocaleString()+' Some sound is being received');}
		recognition.onspeechstart = function() {
			console.log(new Date().toLocaleString()+' Speech has been detected');
			if (sra.settings.sr_audio_pause) recognition.stop(); // Version 1.0.8
			clearTimeout(speechstart_timer);
			speechstart_timer = setTimeout(function()
			{
				/* If the web speech API detects speech but then pauses for a few seconds without receiving
					a result then we are going to get a network error in about a minute or two. So to try to stop
					the network error let's stop and start recognition
				*/
				recognition.stop();
				console.log(new Date().toLocaleString()+' Stopped recognition to prevent network error');
				/* Apparently I don't need to call recognition.start() here because even though
					I manually stopped recognition recognition.onend is still called and the function
					there restarts recognition.
				*/
				return;
			} , 4000);
		}
		recognition.onspeechend = function() {console.log(new Date().toLocaleString()+' Speech has stopped being detected');}
		recognition.onsoundend = function() {console.log(new Date().toLocaleString()+' Sound has stopped being received');}
		recognition.onaudioend = function() {console.log(new Date().toLocaleString()+' Audio capturing ended');}

		recognition.onnomatch = function() {console.log('Speech not recognised');}

		recognition.onerror = function(event) {
			var error = chrome.i18n.getMessage("speech_recognition_error") + event.error + ". "; // Version 1.1.6 - Added + ". "
	  		console.log(new Date().toLocaleString()+" "+error);
	  		//if (test_mode) final_span.innerHTML += event.error;
	  		if (event.error.match(/network/i))
	  		{
	  			error += chrome.i18n.getMessage("network_error"); // Version 1.1.3 // https://support.google.com/chrome/answer/3296214
	  			document.getElementById('error').innerHTML = error;
	  		}
		}

		recognition.onresult = function(event) {
		    var interim_transcript = '';
		    clearTimeout(speechstart_timer);
		    for (var i = event.resultIndex; i < event.results.length; ++i) {
		    	if (event.results[i].isFinal) {
		        	final_transcript += event.results[i][0].transcript;
		        	//console.log(event.results[i][0].transcript);
		        	//send_to_content({ "speech" : event.results[i][0].transcript });
		      	} else {
		        	interim_transcript += event.results[i][0].transcript;
		      	}
		    }
		    if (interim_transcript.length > 0)
		    {
				interim_transcript = replace_mistakes(interim_transcript);
				var re = new RegExp("^(?: *?)"+sra.settings.wakeup_phrase,'i'); // match at beginning with optional spaces in front
				if ( (sra.settings.use_wakeup_phrase && interim_transcript.match(re)) || (sra.settings.wakeup_timeout && !sra.settings.sr_audio_pause))
				{
					if (!beeped && sra.settings.wakeup_beep)
					{
						beeped = true;
						//new Audio("audio/beep.mp3").play(); // Audio plays here, but does not do it the first time unless sr.html tab is the active tab
						send_to_background({ "beep" : true }); // So we will play the beep in background.js instead
					}
					updateBadge();

					if (sra.settings.use_wakeup_timeout)
						var seconds = 20000; // 20 seconds
					else
						var seconds = 3000; // 2 seconds // 2/27/2017 - Version 0.98.5 - 3 seconds

					// Only require wakeup phrase again in 20 seconds
					clearTimeout(sra.settings.wakeup_timeout);
					sra.settings.wakeup_timeout = setTimeout(function()
					{
						sra.settings.wakeup_timeout = false;
						var obj = { settings : sra.settings };
						if (test_mode) console.log("Settings object: "+JSON.stringify(obj));
						save_to_storage(obj);
						updateBadge();
						beeped = false;
						if (sra.settings.wakeup_low_beep)
							send_to_background({ "low_beep" : true }); // So we will play the beep in background.js instead
					} , seconds);

					var obj = { settings : sra.settings }; // Save sra.settings.wakeup_timeout to storage
					if (test_mode) console.log("Settings object: "+JSON.stringify(obj));
					save_to_storage(obj);

				}
				if (!sra.settings.disable_interim && (!window.speechSynthesis.speaking || tts_paused)) send_to_content({ "interim" : interim_transcript });
			}
		    if (final_transcript.length > 0 && !sra.settings.sr_audio_pause)
			{
				check_spans(); // Version 0.99.9
				final_transcript = replace_mistakes(final_transcript);
				if (sra.settings.remove_auto_capitalize) final_transcript = remove_auto_caps(final_transcript); // Version 1.1.8
				final_transcript = final_transcript.replace(/([\!\?\.]\s+)([a-z])/g, function(m, $1, $2) {
					return $1+$2.toUpperCase(); // Version 1.2.2 - Capitalize first letter after .?! Google was not if you started speech with "period are you there"
				});
				var re = new RegExp("^(?: *?)"+sra.settings.wakeup_phrase,'i'); // match wakeup_phrase at beginning with optional spaces in front
				if ( (sra.settings.use_wakeup_phrase && final_transcript.match(re)) || !sra.settings.use_wakeup_phrase || sra.settings.wakeup_timeout)
				{
					if (sra.settings.use_wakeup_phrase)
					{
						final_transcript = final_transcript.replace(re , ""); // Remove wakeup phrase from final_transcript
					}

					var custom_command_found = custom_command_search(final_transcript); // Version 1.0.4 // Version 1.0.6 - Moved lines below wakeup phrase
					if (custom_command_found && custom_command_found != true) // Version 1.0.4 - Allow word replace in sr.html text box
						final_transcript = custom_command_found;

					if (final_transcript.length > 0) {
						if (!custom_command_found && !command_search(final_transcript) && !virtual_assistant_search(final_transcript) && !sra.settings.disable_speech2text)
							send_to_content({ "speech" : auto_punctuation(final_transcript) });
						else if (sra.settings.disable_speech2text && (!window.speechSynthesis.speaking || tts_paused))
							send_to_content({ "interim" : "Speech-To-Text is disabled in Settings." }); // Version 0.99.7
						else if (!sra.settings.disable_interim && (!window.speechSynthesis.speaking || tts_paused))
							send_to_content({ "interim" : final_transcript });

						if (sra.settings.end_beep) // Version 1.1.2
							send_to_background({ "end_beep" : true }); // So we will play the beep in background.js instead
					}
				}
				else if ( (sra.settings.use_wakeup_phrase && !final_transcript.match(re)) )
				{
					if (!sra.settings.disable_interim) // Version 1.2.8 - Don't send if they disabled the yellow speech bubble
						send_to_content({ "interim" : "Listening for wakeup phrase: "+sra.settings.wakeup_phrase });
				}
				// Print in textbox on sr.js
				if (document.activeElement == document.getElementById('speech_div') && final_span.innerHTML != "") { // Version 0.99.9 - final_span is contenteditable
		    		final_transcript2 = capitalize(document.getElementById('speech_div'), auto_punctuation(final_transcript));
					document.execCommand("InsertHTML", false, final_transcript2); // so insert final_transcript at cursor
				}
				else {
					if (document.activeElement == document.getElementById('speech_div')) document.getElementById('speech_div').blur();
					final_transcript2 = capitalize2(final_span.innerText, auto_punctuation(final_transcript));
					final_span.innerHTML += linebreak(final_transcript2);
				}
			}
			check_spans(); // Version 0.99.9
		    interim_span.innerHTML = linebreak(interim_transcript);
		    // scroll speech div to bottom
		    document.getElementById('speech_div').scrollTop = document.getElementById('speech_div').scrollHeight;
		    //console.log(interim_transcript);
			//console.log(final_transcript);
			final_transcript = "";

			if (!sra.settings.sr_audio_pause)
			if ( (sra.settings.use_wakeup_phrase && interim_transcript.match(re)) || !sra.settings.use_wakeup_phrase || sra.settings.wakeup_timeout)
			{
				chrome.power.requestKeepAwake("display"); // Request to wake up screen
				chrome.power.releaseKeepAwake(); // Allow screen to sleep again
				if (sra.settings.prevent_display_sleep)
					chrome.power.requestKeepAwake("display");
				else if (sra.settings.prevent_system_sleep)
					chrome.power.requestKeepAwake("system");
			}
	    };

	 	var two_line = /\n\n/g;
		var one_line = /\n/g;
		 function linebreak(s) {
	  		return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
		}

		/*var first_char = /\S/;
		function capitalize(s) {
	  		return s.replace(first_char, function(m) { return m.toUpperCase(); });
		}*/


	}

}


function check_spans() {
	// Version 0.99.9 - Since speech_div is contenteditable now the user can accidentally erase
	// final_span and interim_span. So we need to recreate them if that happens
	if (!document.getElementById('final_span')) {
		var final_span = document.createElement('span');
		final_span.id = "final_span";
		document.getElementById('speech_div').appendChild(final_span);
	}
	if (!document.getElementById('interim_span')) {
		var interim_span = document.createElement('span');
		interim_span.id = "interim_span";
		interim_span.style.color = "#666666";
		document.getElementById('speech_div').appendChild(interim_span);
	}

}

function create_analyser()
{
	// This function creates an audio analyser (volume meter)
	navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	navigator.getUserMedia({audio:true, video:false}, function(stream){ // Version 1.0.8 - Was navigator.webkitGetUserMedia
		audioContext = new AudioContext();
	    analyser = audioContext.createAnalyser();
	    microphone = audioContext.createMediaStreamSource(stream);
	    javascriptNode = audioContext.createScriptProcessor(256, 1, 1);

	    analyser.smoothingTimeConstant = 0.3;
	    analyser.fftSize = 2048;

	    microphone.connect(analyser);
	    analyser.connect(javascriptNode);
	    javascriptNode.connect(audioContext.destination);

	    /*canvasContext = document.getElementById("test");
	    canvasContext= canvasContext.getContext("2d");*/

	    javascriptNode.onaudioprocess = function() {
	        var array =  new Uint8Array(analyser.frequencyBinCount);
	        analyser.getByteFrequencyData(array);
	        var values = 0;

	        var length = array.length;
	        for (var i = 0; i < length; i++) {
	            values += array[i];
	        }

	        var average = values / length;
	       	/* canvasContext.clearRect(0, 0, 60, 130);
	        canvasContext.fillStyle = '#00ff00';
	        canvasContext.fillRect(0,130-average,25,130); */
	        var sr_sound_level = (document.getElementById('sr_sound_level')) ? document.getElementById('sr_sound_level') : false ;
	        sr_sound_level.style.width = average + "px";
	    }

	}, function (){console.log(new Date().toLocaleString()+" Error getting audio stream from getUserMedia")}

	);
}

function send_to_background(obj)
{
	chrome.runtime.sendMessage(obj, function(response) {
		if (test_mode) console.log(response.farewell);
	});
}

var wait_for_me = false; // Version 1.2.0

function send_to_content(obj)
{
	if (sra.settings.sr_audio_pause) return;

	// get the currently active tab
	if (sra.settings.chrome_windows) var cur_tab_obj = { active: true, lastFocusedWindow: true}; // Version 1.2.0
	else var cur_tab_obj = { active: true, currentWindow: true}; // Version 1.2.0
	chrome.tabs.query(cur_tab_obj, function (tabs) {
		var active_tab = tabs[0].id;
	/*	if (active_tab == current_tab_id) // if we are alreay sending to this tab
		{
			// wait until we are done sending current message
			setTimeout(function(){
				send_to_content(obj);
			}, 200);
		}*/
		if (test_mode) console.log(tabs[0].url);
		if (tabs[0].url.match(/^chrome:\/\/newtab/i) || (tabs[0].url.match(/^https:\/\/www.google.com/i) && wait_for_me)) {// Version 0.99.8 - Redirect to Google newtab that allows content.js
			chrome.tabs.update(tabs[0].id, {"url": "https://www.google.com"}, function (tab) {
				setTimeout(function(){ // Version 1.2.0
					wait_for_me = false;
					send_to_content(obj); // Then call send_to_content(obj) again after content.js injected
				}, 400);

			}); // Version 1.1.2 - Redirect to google.com
			wait_for_me = true;
			return; // Version 1.2.0
		}
			//chrome.tabs.update(tabs[0].id, {"url": "https://www.google.com/_/chrome/newtab"}); // Version 1.1.2 - Chrome no longer allows content scripts in this newtab either - https://codereview.chromium.org/2978953002/

		if (tabs[0].url.match(/^chrome|\/webstore/i) && (tabs[0].url != window.location.href)) // if current tab is not the speech recognition tab
		document.getElementById('error').innerHTML = chrome.i18n.getMessage("chrome_pages_error"); // Version 1.1.3

		// Version 0.98.9 - 8/17/2017 - Communicate with Google Docs
    /*	if (tabs[0].url.match(/docs.google/i) && obj.hasOwnProperty("speech")) {
    		var xhr = new XMLHttpRequest();
    		// https://script.google.com/macros/s/AKfycbwD5W8jfje3R_0QySa62lZQqW6hJpMJsXLeHX_r9JKxDaGDx2_J/exec
    		// https://script.google.com/macros/s/AKfycbwkCQDD61un0LhokS5AaP3zk_2ToG5EYPym_tU8RiMJZGRV99zH/exec
    		var my_app = "https://script.google.com/macros/s/AKfycbwD5W8jfje3R_0QySa62lZQqW6hJpMJsXLeHX_r9JKxDaGDx2_J/exec?speech="+obj.speech;
    		xhr.open("GET", my_app);
			xhr.onreadystatechange = function handleResponse() {
				if (xhr.readyState == 4) {
			    	var result = xhr.responseText;
			  	}
			}
			xhr.responseType = "text";
			xhr.send(null);
			return;
    	} */

		else if (tabs[0].url != window.location.href) // if current tab is not the speech recognition tab
		chrome.tabs.sendMessage(active_tab, obj, function(response) {

		if (chrome.runtime.lastError)
    	{
            console.log('ERROR: ' + chrome.runtime.lastError.message);

        /* Above gets "ERROR: Could not establish connection. Receiving end does not exist"
			if you run it on chrome://extensions/ page or if the extension is just installed
			and the page has not been refreshed */
			if (chrome.runtime.lastError.message.match(/Receiving end does not exist/i))
			{
				if (!tabs[0].url.match(/^chrome|\/webstore/i))
					document.getElementById('error').innerHTML = chrome.runtime.lastError.message+
					chrome.i18n.getMessage("chrome_runtime_error"); // Version 1.1.3

				/*  Inject content.js in active tab.
					Need "permissions": ["activeTab"] in manifest.json for this to work
				*/
				 if (!tabs[0].url.match(/^(chrome:\/\/newtab|https:\/\/www.google.com\/_\/chrome\/newtab)/i))
				 chrome.tabs.executeScript(tabs[0].id, {file: "storage.js"}, function() {
					 if (chrome.runtime.lastError)
            			console.error(chrome.runtime.lastError.message);
				 	chrome.tabs.executeScript(tabs[0].id, {file: "content.js"}, function() {
        				if (chrome.runtime.lastError) {
            				console.error(chrome.runtime.lastError.message);
        				}
        				else
        				{
        					setTimeout(function(){
								send_to_content(obj); // Then call send_to_content(obj) again after content.js injected
							}, 300);
        				}
        			});
   				 });

			}
			else // Another error
			{
				// Highlight the speech recognition tab by first getting the current tab id
	            chrome.tabs.getCurrent(function(tab) {
	            	chrome.tabs.update(tab.id, {highlighted: true});
	  			});

				document.getElementById('error').innerHTML = chrome.runtime.lastError.message+
					chrome.i18n.getMessage("chrome_runtime_error"); // Version 1.1.3
				// Put an X on the current tab to let user know there is an error
				chrome.browserAction.setBadgeText({text: "", tabId: tabs[0].id});
				// Then switch to speech recognition tab??? Won't work unless I know tab_id
				//chrome.tabs.update(tab_id, {active: true});
				document.title = "Error:"+the_title;
				window.onfocus = function() {
					document.title = the_title;
					setTimeout(function(){
						document.getElementById('error').style.backgroundColor = "#2222FF";
					}, 500)
					setTimeout(function(){
						document.getElementById('error').style.backgroundColor = "transparent";
					}, 1000);
					window.onfocus = null;
				};

			}
		}
		else // No error
		{
			if (test_mode) console.log(JSON.stringify(response));
			// No error so wipe out error messages
			setTimeout(function(){
				document.getElementById('error').innerHTML = "";
			}, 5000);

			if (response.hasOwnProperty("command"))
			{
				if (window[obj.command])
					window[obj.command](obj.option);
			}

			if (response.hasOwnProperty("color"))
			{
				if (response["color"] == "reset")
					document.getElementById('fontcolor').value = "#FFEEDD";
				else
					document.getElementById('fontcolor').value = response["color"];
			}
			if (response.hasOwnProperty("background-color"))
			{
				if (response["background-color"] == "reset")
					document.getElementById('bgcolor').value = "#FFEEDD";
				else
					document.getElementById('bgcolor').value = response["background-color"];
			}
		}
  	});
  	//current_tab_id = false;

	});

}


// Find out if any tab has been updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    //console.log(JSON.stringify(changeInfo));
    //console.log(JSON.stringify(tab));

    if (sra.settings.use_wakeup_phrase && !sra.settings.wakeup_timeout) // Listening for wakeup phrase
    	sr_msg.innerHTML = sr_msg.innerHTML = "Listening for wakeup phrase: "+sra.settings.wakeup_phrase;
    else if (sr_msg && sr_msg.innerHTML.match(/^Listening for wakeup phrase/i))
		sr_msg.innerHTML = "";

	if ( (changeInfo.hasOwnProperty("mutedInfo") && changeInfo.mutedInfo.muted) ||
		 (changeInfo.hasOwnProperty("audible") && changeInfo.audible == false) )
	{
		// All of this is not needed. Because we are repeating it down below
		if (sr_msg && sr_msg.innerHTML.match(/^Speech Recognition output is paused/i))
			sr_msg.innerHTML = "";

		chrome.browserAction.setBadgeText({text: "On"}); // Removed tabID to affect every tab
		chrome.browserAction.setBadgeBackgroundColor({"color": [255, 0, 0, 100]});
		sra.settings.sr_audio_pause = false; // Change sra object
		var obj = { settings : sra.settings };
		if (test_mode) console.log("Settings object: "+JSON.stringify(obj));
		save_to_storage(obj);
	}

	// See if any tabs are playing audio and are not muted
	chrome.tabs.query({ audible: true, muted: false }, function (tabs) {

		if (tabs.length > 0 && sra.settings.pause_for_audio) // We found some tabs that are playing audio
		{
			if (sr_msg) sr_msg.innerHTML = "Speech Recognition output"+
				" is paused in the other tabs until all tabs have stopped playing audio. (See settings)";
			chrome.browserAction.setBadgeText({text: 'Off'}); // Removed tabID to affect every tab
			chrome.browserAction.setBadgeBackgroundColor({"color": [200, 200, 0, 200]}); // yellow, transparency
			sra.settings.sr_audio_pause = true; // Change sra object
			var obj = { settings : sra.settings };
			if (test_mode) console.log("Settings object: "+JSON.stringify(obj));
			save_to_storage(obj);
    	}
    	else if (sra.settings.sr_audio_pause) // no tabs are playing audio
    	{
    		if (sr_msg && sr_msg.innerHTML.match(/^Speech Recognition output is paused/i))
			sr_msg.innerHTML = "";

			chrome.browserAction.setBadgeText({text: "On"}); // Removed tabID to affect every tab
			chrome.browserAction.setBadgeBackgroundColor({"color": [255, 0, 0, 100]});
			sra.settings.sr_audio_pause = false; // Change sra object
			var obj = { settings : sra.settings };
			if (test_mode) console.log("Settings object: "+JSON.stringify(obj));
			save_to_storage(obj);
    	}
    });

	//chrome.browserAction.setBadgeText({text: newText, tabId: tab.id});
});

// Find out if any tab has been closed - Version 1.1.1
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {

	// See if any tabs are playing audio and are not muted
	chrome.tabs.query({ audible: true, muted: false }, function (tabs) {

		if (tabs.length > 0 && sra.settings.pause_for_audio) // We found some tabs that are playing audio
		{
			if (sr_msg) sr_msg.innerHTML = "Speech Recognition output"+
				" is paused in the other tabs until all tabs have stopped playing audio. (See settings)";
			chrome.browserAction.setBadgeText({text: 'Off'}); // Removed tabID to affect every tab
			chrome.browserAction.setBadgeBackgroundColor({"color": [200, 200, 0, 200]}); // yellow, transparency
			sra.settings.sr_audio_pause = true; // Change sra object
			var obj = { settings : sra.settings };
			if (test_mode) console.log("Settings object: "+JSON.stringify(obj));
			save_to_storage(obj);
    	}
    	else if (sra.settings.sr_audio_pause) // no tabs are playing audio
    	{
    		if (sr_msg && sr_msg.innerHTML.match(/^Speech Recognition output is paused/i))
			sr_msg.innerHTML = "";

			chrome.browserAction.setBadgeText({text: "On"}); // Removed tabID to affect every tab
			chrome.browserAction.setBadgeBackgroundColor({"color": [255, 0, 0, 100]});
			sra.settings.sr_audio_pause = false; // Change sra object
			var obj = { settings : sra.settings };
			if (test_mode) console.log("Settings object: "+JSON.stringify(obj));
			save_to_storage(obj);
    	}
    });
});


chrome.idle.onStateChanged.addListener(function(newState) {
	if (test_mode) console.log(new Date().toLocaleString()+" "+newState);
  	if (test_mode) final_span.innerHTML += newState;
  	if(newState == "idle") {
  		/* Chrome goes to idle even if we are using the web speech API, I suppose
  		because we are not using the mouse or keyboard. This causes web speech API "network" error.
		So how do we tell Chrome that we are using the web speech API so it should
		not go to "idle"? */
  	}
	if(newState == "locked") {
   	 // Reset the state as you wish

  	}
});


//chrome.power.requestKeepAwake("system");

chrome.runtime.onMessage.addListener(
	function(obj, sender, sendResponse) {
		if (test_mode) console.log(JSON.stringify(obj));

		if (obj.hasOwnProperty("command"))
			{
				if (window[obj.command]) {
					if (obj.command == "say")
						window[obj.command](obj.option, sender);
					else
						window[obj.command](obj.option);
				}
			}
		if (obj.hasOwnProperty("wakeup_timeout"))
		{
			wakeup_timeout = false;
			updateBadge();
		}

    });


function updateBadge(tabId)
{
	if (sra.settings.use_wakeup_phrase && !sra.settings.wakeup_timeout) // Listening for wakeup phrase
	{
		chrome.browserAction.setBadgeText({text: 'On'}); // Removed tabID to affect every tab
		chrome.browserAction.setBadgeBackgroundColor({"color": [200, 200, 0, 200]}); // yellow, transparency
		sr_msg.innerHTML = sr_msg.innerHTML = "Listening for wakeup phrase: "+sra.settings.wakeup_phrase;
	}
	else // Detected wakeup phrase or not using wakeup phrase
	{
		chrome.browserAction.setBadgeText({text: 'On'}); // Removed tabID to affect every tab
		chrome.browserAction.setBadgeBackgroundColor({"color": [255, 0, 0, 100]}); // red, transparency
		sr_msg.innerHTML = "";
	}

	if (sra.settings.sr_audio_pause) // pausing because of audio being played in a tab
	{
		chrome.browserAction.setBadgeText({text: 'Off'}); // Removed tabID to affect every tab
		chrome.browserAction.setBadgeBackgroundColor({"color": [200, 200, 0, 200]}); // yellow, transparency
		if (sr_msg) sr_msg.innerHTML = "Speech Recognition output"+
				" is paused in the other tabs until all tabs have stopped playing audio. (See settings)";
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
			}
		}
	}
}


function virtual_assistant_search(speech)
{
	var new_tab = false;
	var url = "https://www.google.com/search?gs_ivs=1&inm=vs&q="+speech;
	if (sra.settings.virtual_assistant_mode == false) return false;

	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		var active_tab = tabs[0];
		if (active_tab.url == window.location.href || active_tab.url.match(/https?:\/\/(www\.)?google\./i) || active_tab.url.match(/chrome:\/\/newtab/i)) // if current tab is sr.html or google.com
		{
			if (active_tab.url == window.location.href) // if current tab is the speech recognition tab
				new_tab = true;

			if (new_tab)
			{
				chrome.tabs.create({"url":url,"active":true}, function(tab){
			        /* tab_id = tab.id;
			        tab_url = tab.url;
			        updateBadge(); */
			    });
			}
			else
			{
				// Change url of current tab
				chrome.tabs.update(active_tab.id, {"url": url});
			}
			return true;
		}
		else
			return false;
	});
}


function replace_mistakes(speech)
{

	for (var key in replace_words_obj)
	{
		//var re = new RegExp("\\b"+key+"\\b",'i'); // insensative case search: 'i'; beginning of string: ^
		var re = new RegExp("(^| )"+key+"(\\b| )",'ig'); // insensative case search: 'i'; beginning of string: ^ // Version 1.2.2 - Added 'g'
		speech = speech.replace(re, replace_words_obj[key]);
	}
	return speech;
}


function setup_menus()
{
	var submenu_btns = document.getElementsByClassName("submenu_btn");
	for (var i = 0; i < submenu_btns.length; i++)
	{
		submenu_btns[i].addEventListener('click', function() {submenu();}, false);
	}

}


function submenu()
{
	var element = event.target;

	while (element.parentNode && element.nodeName != "BUTTON")
		element = element.parentNode;

	var submenu = document.getElementById(element.getAttribute("data-menu"));

	// First display the div or close the div
	if (submenu.style.display != "inline-block")
		submenu.style.display = "inline-block";
	else
		submenu.style.display = "none";

	// Second change the right arrow into a down arrow or vice-versa
	var string = event.target.innerHTML;

	for (var i = 0; i < string.length; i++)
	{
		if(string.charCodeAt(i) == "9654")
		{
			string = string.substr(0, i) + String.fromCharCode(9660) + string.substr(i+1);
		}
		else if(string.charCodeAt(i) == "9660")
		{
			string = string.substr(0, i) + String.fromCharCode(9654) + string.substr(i+1);
		}
	}
	event.target.innerHTML = string;
}


function setup_forms()
{
	var all_forms = document.forms;
	for (var i = 0; i < all_forms.length; i++)
	{
	    if (all_forms[i].name == "settings_form" || all_forms[i].name == "custom_commands_form")
	    	all_forms[i].onsubmit = function() { return false; };

		for (var j = 0; j < all_forms[i].length; j++)
	    {
			all_forms[i][j].addEventListener('click', function() {formclick();}, false);
				if (sra.settings.hasOwnProperty(all_forms[i][j].name))
				{
					all_forms[i][j].checked = sra.settings[all_forms[i][j].name];
				}
			}
			else if (all_forms[i][j].type.match(/^(text|range)$/i))
			{
				all_forms[i][j].addEventListener('input', function() {formclick();}, false);
				if (sra.settings.hasOwnProperty(all_forms[i][j].name) && sra.settings[all_forms[i][j].name] != false)
				{
					all_forms[i][j].value = sra.settings[all_forms[i][j].name];
					if (all_forms[i][j].name.match(/^tts/)) { // Make sure tts_pitch and tts_rate display the variable
						var new_event = new Event('input'); // By firing an 'input' event on the element
						all_forms[i][j].dispatchEvent(new_event);
					}
				}

				// In custom_commands_form: Add references to sra.custom_commands objects
				if (all_forms[i].name == "custom_commands_form")
				{
					var num = all_forms[i][j].name.replace(/\D/g,''); // Replace everything that is not a digit in the name
					var name = all_forms[i][j].name.replace(/[\d_]/g,''); // Replace everything that is a digit or underscore in the name
					//all_forms[i][j].object_ref = sra_custom_commands[num]; // Did not work! Created a copy of the object instead of a reference
					sra.custom_commands[num].number = parseInt(num);
				}
			}
			else if (all_forms[i][j].type.match(/^(select)/i)) // could be select-one or select-multiple
			{
				all_forms[i][j].addEventListener('change', function() {formclick();}, false);
				if (sra.settings.hasOwnProperty(all_forms[i][j].name) && sra.settings[all_forms[i][j].name] != false)
				{
					all_forms[i][j].selectedIndex = sra.settings[all_forms[i][j].name];
					if (all_forms[i][j].name.match(/^(select_language)$/i))
					{
						recognition.stop();
						recognition.lang = document.settings_form.select_language.value; // Version 0.98.1
					}
				}
			}

		}
	}
}

function formclick()
{
	el = event.target; // Target element of click
	if (el.form.name == "settings_form") // if dealing with the settings form
	{
		if (sra.settings.hasOwnProperty(el.name)) // If the form elements name is also a key in settings object
		{
			if (el.type.match(/^(checkbox)$/i))
				sra.settings[el.name] = el.checked; // Change sra object
			else if (el.type.match(/^(text|range)$/i))
				sra.settings[el.name] = el.value; // Change sra object
			else if (el.type.match(/^(select)/i)) // could be select-one or select-multiple
				sra.settings[el.name] = el.selectedIndex; // Change sra object
			var obj = { settings : sra.settings };
			if (test_mode) console.log("Settings object: "+JSON.stringify(obj));
			save_to_storage(obj);
		}
	}
	else if (el.form.name == "custom_commands_form") // if dealing with the settings form
	{
		if (test_mode) console.log(el.value);
		if (el.name.match(/^add/i)) { add_custom_command(); return; }
		if (el.name.match(/^export/i)) { export_commands(); return; }
		if (el.name.match(/^import_btn/i)) { document.getElementById('import_div').style.display = 'block'; return; }
		if (el.name.match(/^import_start/i)) { import_commands(); return; }
		var num = parseInt(el.name.replace(/\D/g,'')); // Replace everything that is not a digit in the name
		var name = el.name.replace(/[\d_]/g,''); // Replace everything that is a digit or underscore in the name
		if (el.name.match(/^delete/i)) { document.getElementById('confirm_span_'+num).style.display = 'inline'; return; } // Version 1.1.5
		if (el.name.match(/^no_/i)) { document.getElementById('confirm_span_'+num).style.display = 'none'; return; } // Version 1.1.5
		//sra.custom_commands[num][name] = el.value; // Old way using array position (which makes deleting difficult)
		//el.object_ref[name] = el.value; // New way which uses an object reference. Did not work because object_ref is a copy
		for (var i = 0; i < sra.custom_commands.length; i++) // loop through commands
		{
			if (sra.custom_commands[i].number == num)
			{
				if (el.type.match(/^(checkbox)$/i))
					sra.custom_commands[i][name] = el.checked; // Change sra object
				else if (el.type.match(/^(text)$/i))
					sra.custom_commands[i][name] = el.value;
				else if (el.type.match(/^(submit)$/i)) { // Version 1.1.5 - The default type for buttons in Chrome is "submit"
					if (el.name.match(/^yes_/)) {
						el.parentNode.parentNode.style.display = 'none'; // Hide custom_commands_box from screen
						var removed = sra.custom_commands.splice(i, 1); // Delete/Remove 1 element from array
						console.log(removed); // Could be used to undo deletion with: sra_commands.splice(removed.number, 0, removed);
					}
				}
			}
		}
		var obj = { custom_commands : sra.custom_commands };
		if (test_mode) console.log("custom_commands object: "+JSON.stringify(obj));
		save_to_storage(obj);
	}

}


function print_commands(cmds_array)
{
	var cmds_div = document.getElementById("commands_div");
	var string = "<table>";

	for (var i = 0; i < cmds_array.length; i++) // loop through commands
	{
		if (cmds_array[i].heading)
			string += "<tr><th colspan='2'>"+cmds_array[i].heading+"</th></tr>";
		if (cmds_array[i].description)
			string += "<tr><td colspan='2'>"+cmds_array[i].description+"</td></tr>";
		if (cmds_array[i].speech)
		{
			string += "<tr><td>"+cmds_array[i].speech+"</td>";
			string += "<td>"+cmds_array[i].output+"</td></tr>";
		}
	}

	string += "</table>";

	cmds_div.innerHTML = string;
}


function print_custom_commands()
{
	var cmds_div = document.getElementById("custom_commands_div2");
	var string = "";

	//string += "<form name='custom_commands_form'>"; // Version 1.1.3
	/*string += "<button name='add1' title='Add Custom Voice Command'>+ Add</button>";
	string += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	string += "<button name='export' title='Export Custom Commands'>Export</button>";
	string += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	string += "<button name='import_btn' title='Import Custom Commands'>Import</button>";
	string += "<div style='display:none' id='import_div'>";
	string += "<span><b>Step 1</b><br />";
	string += "<label><input type='radio' name='import_type' value='append' checked>Append to Custom Commands</label><br \>";
	string += "<label><input type='radio' name='import_type' value='overwrite'>Overwrite Custom Commands</label><br \>";
	string += "</span><span><b>Step 2</b><br />";
	string += "<input name='import_file' type='file' accept='text/plain'>";
	string += "<button name='import_start' title='Start Import'>Start Import</button> <span id='import_error'></span>";
	string += "</span></div>";*/

	for (var i = 0; i < sra.custom_commands.length; i++) // loop through commands
	{
		if (sra.custom_commands[i].phrase)
		{
			/*var input_el = document.createElement("input");
			input_el.type = "text";
			input_el.value = sra.custom_commands[i].phrase; */
			string += "<div class='custom_commands_box'>";
			string += "<b>Phrase</b>: <input name='phrase_"+i+"' type='text' value='"+sra.custom_commands[i].phrase.replace(/'/g,"&apos;")+"'>";
			string += " <b>Action</b>: <input name='action_"+i+"' type='text' value='"+sra.custom_commands[i].action.replace(/'/g,"&apos;")+"'><br>"; // Version 0.99.7 - Added replace
			string += "<b>Description</b>: <input name='description_"+i+"' type='text' value='"+sra.custom_commands[i].description.replace(/'/g,"&apos;")+"'>"; // Version 0.99.7 - Added replace
			string += "<label title='Enable/Disable'> <b>Enable</b>: <input type='checkbox' name='enable_"+i+"'";
			if (sra.custom_commands[i].enable == true) string += ' checked';
			string += "></label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
			string += "<button name='delete_"+i+"' title='Delete Custom Voice Command'>Delete</button>"; // Version 1.1.5
			string += "<span id='confirm_span_"+i+"' style='display:none;'> Are you sure? "; // Version 1.1.5
			string += "<button name='yes_"+i+"'>Yes</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name='no_"+i+"'>No</button></span>"; // Version 1.1.5
			string += "</div>";
		}
	}

	//string += "<form name='custom_commands_form'>"; // Version 1.1.3
	//string += "<button name='add' title='Add Custom Voice Command'>+ Add</button>"; // Version 1.1.3

	//string += "</form>"; // Version 1.1.3

	cmds_div.innerHTML = string;

}

function add_custom_command()
{
	var string = "";
	var num = sra.custom_commands[sra.custom_commands.length - 1].number; // Get the last number used
	num = parseInt(num) + 1;
	var command_obj = { phrase : "", action : "", description : "", enable: true, number : num };
	//sra.custom_commands.unshift(command_obj); // Add new command to front of custom_commands array of objects
	sra.custom_commands.push(command_obj); // Add new command to back of custom_commands array of objects

	var div = document.createElement("div");
	div.className = "custom_commands_box";
	string += "<b>Phrase</b>: <input name='phrase_"+num+"' type='text'>";
	string += " <b>Action</b>: <input name='action_"+num+"' type='text'><br>";
	string += "<b>Description</b>: <input name='description_"+num+"' type='text'>";
	string += "<label title='Enable/Disable'> <b>Enable</b>: <input type='checkbox' name='enable_"+num+"' checked></label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	string += "<button name='delete_"+num+"' title='Delete Custom Voice Command'>Delete</button>"; // Version 1.1.5
	string += "<span id='confirm_span_"+num+"' style='display:none'> Are you sure? "; // Version 1.1.5
	string += "<button name='yes_"+num+"'>Yes</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name='no_"+num+"'>No</button></span>"; // Version 1.1.5
	string += "</div>";
	div.innerHTML = string;
	document.custom_commands_form.add.parentNode.insertBefore(div,document.custom_commands_form.add);


	// Add eventListener to all 3 new inputs (skip 0 because it is the add button)
	var elems = document.custom_commands_form.elements;
	for (i = elems.length - 8; i < elems.length; i++) { // Version 1.1.7 - Was i = num; Changed because with deleting, num is sometimes bigger than the length of form elements
		if (elems[i].type.match(/^(text)$/i))
			elems[i].addEventListener('input', function() {formclick();}, false);
		if (elems[i].type.match(/^(checkbox|submit)$/i))
			elems[i].addEventListener('click', function() {formclick();}, false);
		if (elems[i].name.match(/^phrase/i) && i > (elems.length - 9))
			elems[i].focus();

	}
}

// Version 0.99.9 - Taken from content.js
function lastLetter(el)
{
	/* return the letter right before the caret
		in a textarea or other element */
	//var el = document.activeElement;

	// First check for input or textarea element
	if ('selectionStart' in document.activeElement)
	{
		/* Chrome throws error on selectionStart for type email or number */
		try {
			var start = el.selectionStart;
			var end = el.selectionEnd;
			//console.log(start);
			return(el.value.charAt(start-1));
		} catch(err) {
			return "";
		}
	}
	else // Now Get cursor position of another type of element
	{
		var precedingChar = "", sel, range, precedingRange;
	    if (window.getSelection) {
	        sel = window.getSelection();
	        if (sel.rangeCount > 0) {
	            range = sel.getRangeAt(0).cloneRange();
	            range.collapse(true);
	            range.setStart(el, 0);
	            precedingChar = range.toString().slice(-1);
	        }
	    } else if ( (sel = document.selection) && sel.type != "Control") {
	        range = sel.createRange();
	        precedingRange = range.duplicate();
	        precedingRange.moveToElementText(el);
	        precedingRange.setEndPoint("EndToStart", range);
	        precedingChar = precedingRange.text.slice(-1);
	    }
	    //if (test_mode) console.log(precedingChar);
	    return precedingChar;
	}
}


function capitalize(el, text) {

	var cap = false; // Should first letter be capitalized?
	var space = false; // Should a space be added to the beginning of the text
	var first_char = /\S/;

	/* Don't capitalize inputs with type email|search|password or
		name = "username|email|login" */
	if (el.nodeName == "INPUT")
	{
	 	/* Chrome will not use selectionStart on type email or number.
		We need to check for valid types before using it */
		var valid_type = el.type.match(/^(text|password|search|tel|url)$/);

		if (!el.type.match(/email|search|password/i)
			&& !el.name.match(/username|email|login/i))
			if ( (el.value.length == 0) || (valid_type && el.selectionStart == 0) )
			{
				cap = true;
				text = text.replace(/^ /, ""); // Remove space from beginning of text if it exists
			}
	}
	else if (el.nodeName == "TEXTAREA")
	{
		if (el.value.length == 0 || el.selectionStart == 0 || lastLetter(el).match(/[\n\.!\?]/))
		{
			cap = true;
			text = text.replace(/^ /, ""); // Remove space from beginning of text if it exists
		}
		else if (lastLetter(el) != " ")
			space = true;
	}
	else // Any contentEditable element
	{
		if (el.innerHTML.length == 0 || lastLetter(el) == "" || lastLetter(el).match(/[\n\.!\?]/))
		{
			cap = true;
			text = text.replace(/^ /, ""); // Remove space from beginning of text if it exists
		}
		else if (lastLetter(el) != " ")
			space = true;
	}

	// If last letter was a line feed or an end of sentence character .!?
	if (lastLetter(el).match(/[\n\.!\?]/))
		cap = true;
	if (lastLetter(el).match(/[\.!\?]/))
		space = true;

	if (cap == true)
		text = text.replace(first_char, function(m) { return m.toUpperCase(); }); // Capitalize first letter
		/* Note: Above we are capitalizing first letter found not first character because
		speech recognition may have returned /n or /n/n as the first characters */
	if (space == true && !text.match(/^[ \n\.!\?,]/)) // if there is not already a space or .!?, at beginning of string
		text = " "+text; // Add space to beginning of text


	return (text);
}


// Renamed function in Version 0.99.9 from capitalize to capitalize2
function capitalize2(surroundingText, text) {
 	// Version 0.98.9 - 8/17/2017 - Detect when to capitalize on SRA Tab
 	surroundingText = surroundingText.replace(/ $/, ""); // Remove space from end of surroundingText if it exists
	//console.log(surroundingText +","+text);
	var cap = false; // Should first letter be capitalized?
	var space = false; // Should a space be added to the beginning of the text
	var first_char = /\S/;
	var lastLetter = surroundingText.slice(-1);

	if (lastLetter == "" || lastLetter.match(/[\n\.!\?]/)) {
		cap = true;
		text = text.replace(/^ /, ""); // Remove space from beginning of text if it exists
	}

	if (surroundingText.length > 0 && (lastLetter != " " || lastLetter.match(/[\n\.!\?]/)))
		space = true;

    if (cap == true)
		text = text.replace(first_char, function(m) { return m.toUpperCase(); }); // Capitalize first letter

    if (space == true && !text.match(/^[ \n\.!\?,]/)) // if there is not already a space or .!?, at beginning of string
		text = " "+text; // Add space to beginning of text

	return(text);
}


setup_menus();
document.getElementById('instructions_btn').click(); // Open instructions submenu
print_commands(sra.commands);
//print_custom_commands();


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
	if (sra.settings.tts_speaking) // Version 1.2.0 - Just in case they close sr.html while it is reading a page
		change_tts_speaking(false);
	print_custom_commands();
	setup_forms();
	update_title();
	change_language();
	start_sr();

}

//window.onload = start_all; // Version 1.1.6 - Removed - It seems is was waiting for seabreezecomputers.com iframe
document.addEventListener("DOMContentLoaded", start_all, false); // Version 1.1.6
