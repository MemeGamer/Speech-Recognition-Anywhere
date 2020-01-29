// Detect if browser supports text-to-speech
var tts = ('speechSynthesis' in window) ? true : false;


/* I decided not to use chrome.tts for chrome extensions 
	because it uses the same voices as window.speechSynthesis
	but it doesn't have window.speechSynthesis.onvoiceschanged
	so I had to use a setTimeout
*/
/*
setTimeout(function(){
	// Requires "tts" permission in manifest.json 
	chrome.tts.getVoices(
		function(voices) {
		if (test_mode) console.table(voices);
			for (var i = 0; i < voices.length; i++) {
				
			}
	});
}, 3000);
*/

// Setup pitch and rate input event
settings_form.tts_pitch.addEventListener('input', function() {tts_change();}, false);
settings_form.tts_rate.addEventListener('input', function() {tts_change();}, false);
settings_form.select_voice.addEventListener('change', function() {tts_rate_max();}, false); // Version 1.3.2
settings_form.tts_test_btn.addEventListener('click', function() {say("This is a test.");}, false);


function tts_rate_max() { // Version 1.3.2 - Microsoft voices allow rate up to 10. Google voices only allow rate up to 2
	if (document.settings_form.select_voice.value.match(/^Microsoft/))
		settings_form.tts_rate.max = 10; // Also had to change to max="10" in sr.html
	else { // A Voice by Google can only be a max rate of 2
		if (settings_form.tts_rate.value > 2)
			settings_form.tts_rate.value = 1;
		settings_form.tts_rate.max = 2;
		document.getElementById("rate_dis").innerHTML = settings_form.tts_rate.value; // Display rate on screen
		settings_form.tts_rate.dispatchEvent(new Event("input")); // Fire event so it is saved in storage
	}	
}


function tts_change() {
	el = event.target; // Target element of click
	
	if (el.name == "tts_pitch")
		document.getElementById("pitch_dis").innerHTML = el.value;
	else if (el.name == "tts_rate")
		document.getElementById("rate_dis").innerHTML = el.value;
		
	settings_form.tts_test_btn.disabled = false;	
}

if (tts)
{
	// wait on voices to be loaded before fetching list
	if (speechSynthesis.onvoiceschanged !== undefined) // Firefox does not need or use onvoiceschanged (chrome only does)
	window.speechSynthesis.onvoiceschanged = function() {
		if (document.settings_form.select_voice.options.length == 0) // don't create the list again if chrome thinks the voice changed
		{
		  	var voice_array = window.speechSynthesis.getVoices();
		  	//if (test_mode) console.table(voice_array);
		  	
		  	for (i = 0; i < voice_array.length ; i++) {
		  		document.settings_form.select_voice.options[i] = new Option(voice_array[i].name, voice_array[i].name); // text, value
				if (i == sra.settings.select_voice) {// Version 1.3.2 - Make it display the voice that is saved in settings
					document.settings_form.select_voice.selectedIndex = sra.settings.select_voice;
					tts_rate_max();
				}
		  	}
		}
	};
}


function say(that, sender)
{
	if (typeof sender !== 'undefined' && typeof sender.tab !== 'undefined') sender_tab_id = sender.tab.id;
	if (typeof that == "string") {
		var that_array = that.split("|"); // Split that by |
		var that = [that_array[Math.floor(Math.random() * that_array.length)]]; // Get random array position
	}
	/*else if (Array.isArray(that)) 
		text = that.shift(); // Remove 1st element from array
	*/
	window.speechSynthesis.cancel(); // Version 1.2.0 - Bug in speechSynthesis - If text is too long it breaks and does not work until restarting browser. cancel() will fix the error.
	tts_index = 0;
	
	if (test_mode) console.log(that);
	if (tts && that)
	for (var i = 0; i < that.length; i++)
	{
		var text = that[i];
		
		var voicelist = settings_form.select_voice;
		//msg.onend = ""; // Remove old msg.onend if we had one
		var msg = new SpeechSynthesisUtterance();
		//if (!text.match(/[\.\!\?\n]$/)) text += ".\n"; // Add period to end of sentence if not there.
		//text = text.replace(/(\w{2,})(\s{2,}|\n)/g, "$1.\n") // Version 1.2.2 - Add period if there is 2 or more letters and 2 spaces or a newline without a period // Version 1.2.5 - Not needed anymore with separating each text node
		text = text.replace(/([a-z])(\n)([A-Z])/g, "$1.$2$3") // Version 1.2.5 - If there is lowercase letter, CR, uppercase letter put a period in between.
		text = text.replace(/(,|;|:|—)\s*([a-z]|\n)/gi, function($0,$1,$2,$3) {
			return $1 + ". " +$2.toUpperCase(); 
		}); // Version 1.2.5 - speechSynthesis is terrible at punctuation.
		msg.text = text;
		//msg.voice = voicelist.options[voicelist.selectedIndex].value;
		msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == voicelist.value; })[0];
		//msg.voice = settings_form.select_voice.value;
		msg.pitch = settings_form.tts_pitch.value;
		msg.rate = settings_form.tts_rate.value;
		//msg.lang = "en-GB"; // Only works if you don't set msg.voice above
		//msg.gender = "male"; // Does not work
		console.log(msg); // Version 1.2.5 - onend and onstart would only be called a couple of times in live mode (test_mode == false) because of a bug in Chrome and speechSynthesis. When I console.log the msg then it works and tts_highlight then works because onend is called
		
		// Version 1.2.0 is below:
		msg.onerror = function(event) {
			window.speechSynthesis.cancel();
   			document.getElementById("error").innerHTML += '<p>An error has occurred with the speech synthesis: ' + event.error;
   		}
		msg.onstart = function(event) { change_tts_speaking(true); resumeInfinity(); 
			console.log(event); // Version 1.2.5 - Chrome speechSynthesis bug also needs this
			var obj = { "command" : "highlight_speak", option: tts_index}; // highlight next speak element
			if (sender_tab_id) // Version 1.2.6
				chrome.tabs.sendMessage(sender_tab_id, obj, function(response) { // Send to tab that sent us the say command
					//if (test_mode) console.log(JSON.stringify(response));
				});
			tts_index++;
		};
		msg.onresume = function() { change_tts_speaking(true); resumeInfinity(); };
		msg.onpause = function() { /* change_tts_speaking(false); */ clearTimeout(timeoutResumeInfinity); };
		msg.onend = function(event) { 
			//sr_audio_pause = false; // Turn speech recognition back on
			//if (recognition) recognition.start(); 
			console.log(event); // Version 1.2.5 - Chrome speechSynthesis bug also needs this
			//if (!window.speechSynthesis.pending) // If there are no msgs in the queue left to speak // Version 1.2.4???
			{
				change_tts_speaking(false);
				clearTimeout(timeoutResumeInfinity);
			}
			if (typeof that != "undefined" && Array.isArray(that) && that.length > tts_index) {
				/*tts_index++;
				var obj = { "command" : "highlight_speak", option: tts_index}; // highlight next speak element
				chrome.tabs.sendMessage(sender_tab_id, obj, function(response) { // Send to tab that sent us the say command
					//if (test_mode) console.log(JSON.stringify(response));
				});*/
				/*setTimeout(function() { // I can't have setTimeout here because it will fire after pressing pause
					say(that); 
				}, 1500); // Pause for 1 seconds between paragraphs
				*/
			}
		};
		
		//msg.onboundary = function(event){ if (test_mode) console.log(event); }
		
		window.speechSynthesis.speak(msg);
	}
}

// https://stackoverflow.com/a/40508243/4307527
var timeoutResumeInfinity; // Version 1.2.0
var tts_paused = false; // Version 1.2.0 - window.speechSynthesis.paused is always false even when paused. Broken API
var sender_tab_id;
var tts_index;
//var msg = ""; // SpeechSynthesisUtterance needed in say() to stop onend from using old 'that' array

function resumeInfinity() { // Version 1.2.0
	// If we keep calling resume() during talking then Chrome won't stop the speechSythesis in the middle.
    window.speechSynthesis.resume();
	tts_paused = false;
    timeoutResumeInfinity = setTimeout(resumeInfinity, 2000);
}


function stopSpeaking(keyword) {
	if (Array.isArray(keyword)) keyword = keyword[0];
	if (keyword.match(/^(Stop|Pause)/i) || (keyword === "" && tts_paused == false)) {
		window.speechSynthesis.pause(); // Version 1.2.0
		setTimeout(function() { tts_paused = true; }, 1000); // Version 1.2.4 - Added setTimeout
		clearTimeout(timeoutResumeInfinity);	
		change_tts_speaking(false);
	}
	else {
		resumeInfinity();
		//change_tts_speaking(true);
	}
}

var tts_speaking_timer; // Version 1.2.3 - So it doesn't focus on text box when talking ends but is still in memory

function change_tts_speaking(bit) {
	sra.settings.tts_speaking = bit; // Change sra object
	var obj = { settings : sra.settings };
	if (test_mode) console.log("Settings object: "+JSON.stringify(obj));
	clearTimeout(tts_speaking_timer);
	if (bit == false) // Version 1.2.3 - Wait 1 second to turn off speaking flag
		tts_speaking_timer = setTimeout(function() { save_to_storage(obj); }, 1500, obj); // Version 1.2.4 - Added obj at end
	else
		save_to_storage(obj);
}



