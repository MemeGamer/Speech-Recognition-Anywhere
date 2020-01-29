/* content.js */
// Only load content script if it has not been loaded before;
if (typeof content_script_loaded === 'undefined')
{

var running_script = "content";
var test_mode = ('update_url' in chrome.runtime.getManifest()) ? false : true; // If loaded from Web Store instead of local folder than getManifest has update_url property
var last_speech = "";
var tooltip_timer;
var mutation_num = 0; // The number of mutations that has taken place
var labels = []; // Holds an array of elements on the page and their labels
var wakeup_timeout = false; // Used in connection with sra.settings.wakeup_timeout

function observe(el)
{

	// create an observer instance
	var observer = new MutationObserver(function(mutations) {
	  mutations.forEach(function(mutation) {
	    //console.log(mutation);
	    /* For some reason chrome will hang sometimes if I do add_label(el)
	    	using mutation observer. So I commented it out */
	    /* for (var i = 0; i < mutation.addedNodes.length; i++)
	    	if (mutation.addedNodes[i].nodeType == 1) // Only send element nodes not text nodes
				add_label(mutation.addedNodes[i]); // Send addedNodes to add_label(el)
	    add_label(mutation.target); // Send target node to add_label(el)
	    */
	    mutation_num++; // Add to count of mutations
	    //if (test_mode) console.log("Mutations: "+mutation_num);
	  });    
	});
	 
	// configuration of the observer:
	var config = { attributes: true, childList: true, characterData: true, subtree: true };
	 
	// pass in the target node, as well as the observer options
	observer.observe(el, config);
}

//document.addEventListener('DOMContentLoaded', function () { // Version 1.2.8 - Added addEventLister to prevent: Uncaught TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.
	observe(document.body);
// }); // Version 1.3.0 - Removed because manifest is loading content at documentend so DOMContentLoaded is never called

function add_labels(keyword)
{
	/* Add text labels to buttons, links and elements that just have icons or images */
	if (Array.isArray(keyword)) 
	{
		keyword = keyword[0];
	}
	var dom = document.body; // start under body this time
	var all_elems = dom.getElementsByTagName("*");
	
	if (keyword.match(/^(hide|remove|ausblenden|entfernen|Ocultar|Eliminar|nascondi|rimuovi)/i))
	{
		for (var i = 0; i < labels.length; i++)
			labels[i].tooltip.style.display = "none";			
	}
	else
	{
		for (var i = 0; i < all_elems.length; i++)
		{
			var current_el = all_elems[i];
			add_label(current_el);
		}
		// if (test_mode) console.log(labels);
	}
}


function add_label(el)
{
	var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
	var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	var rect = el.getBoundingClientRect();
	var x = parseInt(el.getBoundingClientRect().left) + scrollLeft;
	var y = parseInt(el.getBoundingClientRect().bottom) + scrollTop;
	var current_label = null;
	
	if (isVisible(el))
	if ( ('title' in el && el.title.length > 0) ||
		 ('alt' in el && el.alt.length > 0)	||
		 (el.hasAttribute("aria-label") && el.getAttribute("aria-label").length > 0) ||
		 //(isTextInput(el) && el.value.length < 1 && el.placeholder.length < 1) // Version 1.3.0 - Removed
		 (isTextInput(el)) // Version 1.3.0 - Added because textareas and inputs were not getting labels
		)
	{
		// Find a label for this element
		var tag_number = 0; var label_text = "";
		var tags = document.body.getElementsByTagName(el.nodeName);
		for (var t = 0; t < tags.length; t++)
			if (el == tags[t]) { tag_number = t + 1; break; }
				label_text = el.nodeName + " " + tag_number; // Generic label. Ex: INPUT 5
		if ('title' in el && el.title.length > 0)
			label_text = el.title;
		else if (el.hasAttribute("aria-label") && el.getAttribute("aria-label").length > 0)
			label_text = el.getAttribute("aria-label");
		else if ('alt' in el && el.alt.length > 0)
			label_text = el.alt;
		else if ('placeholder' in el && el.placeholder.length > 0) // Version 1.3.0 for textareas and inputs
			label_text = el.placeholder;
		else if ('name' in el && el.name.length > 0)
			label_text = el.name.split(/[^A-Za-z0-9 ]/)[0]; // Get text up to _ or - or other non word character
		else if ('id' in el && el.name.length > 0)
			label_text = el.id.split(/[^A-Za-z0-9 ]/)[0]; // Get text up to _ or - or other non word character
			
		// Find a way to add a label to this element
		if ('placeholder' in el && el.placeholder.length < 1) // Version 1.3.0 - Added && el.placeholder.length < 1
			el.placeholder = label_text;
		else if ('innerText' in el && el.innerText.length <= 1)
		{
			// See if we already found a label for this element
			for (var i = 0; i < labels.length; i++)
			{
				if (el == labels[i].el)
					current_label = labels[i];
			}			
			
			if (!current_label)
			{	
				var tooltip = document.createElement('div');
				tooltip.style["font-size"] = "0.8em";
				tooltip.style.position = "absolute";
				tooltip.style.border = "1px solid black";
				tooltip.style.background = "#f0f0f0";
				tooltip.style.opacity = 0.55;
				tooltip.style.zIndex = "1999999999";
				//window.tooltip_timer = ""; // create a global tooltip_timer variable
				//document.body.appendChild(tooltip);
				document.body.insertBefore(tooltip, document.body.firstChild);
				tooltip.addEventListener('click', function() {
					setTimeout(function(){ 
						/* Gmail "Compose" button only works on "mouseup" event */
						var event = document.createEvent('MouseEvents');
						event.initEvent("mousedown", true, false); // try (click|mousedown|mouseup), bubble, cancelable
						el.dispatchEvent(event);
						event = document.createEvent('MouseEvents');
						event.initEvent("click", true, false); // try (click|mousedown|mouseup), bubble, cancelable
						el.dispatchEvent(event);
						event = document.createEvent('MouseEvents');
						event.initEvent("mouseup", true, false); // try (click|mousedown|mouseup), bubble, cancelable
						el.dispatchEvent(event);
					}, 250);
				}, false); 
				
				var obj = { "el" : el, "tooltip" : tooltip };
				labels.push(obj);
			}
			else
			{
				var tooltip = current_label.tooltip;
			}
			// Turn the tooltip off an on depending on if the element is visible or not
			tooltip.style.visibility = document.defaultView.getComputedStyle(el,null).getPropertyValue("visibility");
			tooltip.style.display = document.defaultView.getComputedStyle(el,null).getPropertyValue("display");
			tooltip.style.cursor = "pointer";
			tooltip.innerText = label_text;	
			tooltip.style.left = x + "px";
			if (tooltip.getBoundingClientRect().right >= (window.innerWidth - 10)) // If tooltip is too far to the right edge of screen
				tooltip.style.left = x - tooltip.getBoundingClientRect().width + "px"; //tooltip.style.left = x - 50 + "px";
			tooltip.style.top = y - 5 + "px";	
			
			// If tooltips are overlapping then move them up or down
			for (var i = 0; i < labels.length; i++)
			{
				if (labels[i].tooltip != tooltip)
				{
					var rect1 = tooltip.getBoundingClientRect();
					var rect2 = labels[i].tooltip.getBoundingClientRect();
					var overlap = !(rect1.right < rect2.left ||
	                				rect1.left > rect2.right || 
	                				rect1.bottom < rect2.top || 
	                				rect1.top > rect2.bottom)
	                if (overlap)
	                	tooltip.style.top = parseFloat(tooltip.style.top) + rect2.height + "px";
	            }
			}		
		}	
	}	
}

//setTimeout( "add_labels();", 2000);


function replace_mistakes(speech)
{
	var replace_obj = {
	"first" : 1, "second" : 2, "third" : 3, "3rd" : 3,
	"fourth" : 4, "4th" : 4, "fifth" : 5, "5th": 5, "v" : 5, "sixth" : 6, "6th" : 6,
	"seventh" : 7, "7th" : 7, "eighth" : 8, "8th" : 8, "ninth" : 9, "9th" : 9,
	"tenth" : 10, "10th" : 10, "eleventh" : 11, "11th" : 11, "twelfth" : 12, "12th" : 12,
	"thirteenth" : 13, "13th" : 13, "fourteenth" : 14, "14th" : 14, "fifteenth" : 15, "15th" : 15,
	"one" : 1, "two" : 2, "three" : 3, "four" : 4, "five" : 5, "six" : 6, "seven" : 7, "eight" : 8,
	"nine" : 9, "ten" : 10, "twice" : 2, "for" : 4, "to" : 2,
	"login" : "log in|login", "username" : "username|user name", "user id" : "userid|user id",
	"clothe" : "close", 
	};	
	
	for (var key in replace_obj)
	{
		var re = new RegExp("\\b"+key+"\\b",'i'); // insensative case search: 'i'; beginning of string: ^
		speech = speech.replace(re, replace_obj[key]);
	}
	return speech;
}

var num2words = function num2words(n, dash_or_space) {
  if (typeof dash_or_space === "undefined")
  	dash_or_space = "-";
  if (n == 0) return 'zero';
  var a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var b = ['', '', 'twenty', 'thirty', 'fourty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  var g = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion'];
  var grp = function grp(n) {
    return ('000' + n).substr(-3);
  };
  var rem = function rem(n) {
    return n.substr(0, n.length - 3);
  };
  var fmt = function fmt(_ref) {
    var h = _ref[0];
    var t = _ref[1];
    var o = _ref[2];

    return [Number(h) === 0 ? '' : a[h] + ' hundred ', Number(o) === 0 ? b[t] : b[t] && b[t] + dash_or_space || '', a[t + o] || a[o]].join('');
  };
  var cons = function cons(xs) {
    return function (x) {
      return function (g) {
        return x ? [x, g && ' ' + g || '', ' ', xs].join('') : xs;
      };
    };
  };
  var iter = function iter(str) {
    return function (i) {
      return function (x) {
        return function (r) {
          if (x === '000' && r.length === 0) return str;
          return iter(cons(str)(fmt(x))(g[i]))(i + 1)(grp(r))(rem(r));
        };
      };
    };
  };
  return iter('')(0)(grp(String(n)))(rem(String(n)));
};

	
function send_to_background(obj)
{	
	chrome.runtime.sendMessage(obj, function(response) {
		if (test_mode) console.log(response.farewell);
	});
}


function inject_script(obj) {
	// Version 1.1.1 - Inject code into head // Version 1.3.0 - Removed
	/* var actualCode = '(' + function(obj) {
	    if (window[obj.command])
			window[obj.command].apply(this, obj.option);
	} + ')(' + JSON.stringify(obj) + ');'; */
	// Version 1.3.0 - New way to enter a string as javascript code
	if (test_mode) console.log(obj);
	if (obj.option.length >= 1)
		var actualCode = obj.command + "(" + obj.option.join(",") + ")"; // Version 1.3.0 // Join option by ,
	else
		var actualCode = obj.command; // Version 1.3.0 // Because option is not there e.g. document.querySelectorAll(".r")[1].innerHTML += 1
	if (test_mode) console.log(actualCode);
	var script = document.createElement('script'); 
	script.textContent = actualCode;
	(document.head||document.documentElement).appendChild(script);
	//script.remove(); // Version 1.3.0 - Removed in case user wants to reuse variable e.g. var dog = document.getElementById(dog)
}


function script(option) {
	// Version 1.3.0 - script() command for javascript
	// convert html entities into text
	var element = document.createElement('div');
	element.innerHTML = option;
    option = element.textContent;
	inject_script({"command":option, "option":[]});	
}


// Listen to message from background script
// Listen to message from background script
chrome.runtime.onMessage.addListener(
	function(obj, sender, sendResponse) {
    	var response = ""; // Version 1.2.0
    	/* On Google webpages we are getting the message multiple times!!
    	 	So we need to compare times to see if we should skip some
    	*/
		var date = new Date();
		if (test_mode) console.log(JSON.stringify(obj));
		//console.log(document.activeElement);
			
		if (obj.hasOwnProperty("speech"))
		{
			var maximum = 11; var minimum = 1; // Version 1.0.6 - Add Free Trial Expired to speech randomly // Version 1.0.9 - Changed from 4 to 11
			var randomnumber = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
			if (randomnumber == 10) // Version 1.0.9 - Changed to 10
				if (sra.license.match(/expired/i)) obj.speech = chrome.i18n.getMessage(sra.license.replace(/ /g,"_")) + obj.speech; // Version 1.0.6	// Version 1.1.3 - Add chrome.i18n language support
			display_speech(document.activeElement, obj.speech);
		}
		if (obj.hasOwnProperty("interim"))
		{
			if (sra.license && sra.license.match(/expired/i)) obj.interim = sra.license + obj.interim; // Version 1.0.3
			speech_tooltip(document.activeElement, obj.interim);
		}
		if (obj.hasOwnProperty("command"))
		{
			/* if(obj.command == "switch_fields")
				switch_fields(obj.option);
			else if (obj.command == "switch_focus")
				switch_fields("any", obj.option); */

			
			if (window[obj.command])
				response = window[obj.command](obj.option); // Version 1.2.0 - Added response
			// Version 0.99.7 // Version 1.3.0 - Removed
			/* else if (obj.command.indexOf(".") != -1) {
				var splt = obj.command.split(".");
				if (test_mode) console.log(splt);
				if (splt.length == 2 && window[splt[0]] && window[splt[0]][splt[1]]) {
					var bit = window[splt[0]][splt[1]](obj.option); // Works with: document.execCommand(copy)
					if (test_mode) console.log("1: "+bit);
				}
				else if (splt[0][splt[1]]) {
					var phrase = splt[0][splt[1]](obj.option); // Works with: ibm.toUpperCase()
					if (test_mode) console.log("2: "+phrase);
					display_speech(document.activeElement, phrase);
				}
			} */
			else {
				inject_script(obj); // Version 1.1.1
			}
				
	
			/*else if (obj.command == "click_element")
				click_element(obj.option);
			else if (obj.command == "enter_key")
				enter_key(obj.option);
			else if (obj.command == "spacebar")
				spacebar(obj.option);	*/
		}
		if (obj.hasOwnProperty("wakeup_timeout"))
		{
			var seconds = obj.wakeup_timeout;
			clearTimeout(wakeup_timeout);
			wakeup_timeout = setTimeout(function()
			{
				wakeup_timeout = false;	
				chrome.tabs.sendMessage(tab_id, {"wakeup_timeout" : false });
			} , seconds); 
		}
    	if (obj.hasOwnProperty("button")) 
    	{
    		if (obj["button"] == "up") change_fontsize("up");
    		else if (obj["button"] == "down") change_fontsize("down");
    		else if (obj["button"] == "default") change_fontsize("default");	
    	}
    	else if (obj.hasOwnProperty("color")) 
    	{
    		if (obj["color"] == "reset")
    			change_fontcolor("background-color", obj["color"]);	// reset will do the next line also
			change_fontcolor("color", obj["color"]);
    	}
    	else if (obj.hasOwnProperty("bgcolor")) 
    	{
    		change_fontcolor("background-color", obj["bgcolor"]);
    	}
    	else if (obj.hasOwnProperty("send"))
		{
			if (obj["send"] == "colors")
			{
				var colors_obj = { "color" : current_color, "background-color" : current_bgcolor };
				sendResponse(colors_obj);
				return;
			}
		} 
		
      	if (response) 
			sendResponse(response); // Version 1.2.0
		else
			sendResponse({farewell: "From content: I got the object."});
  });



// wait on voices to be loaded before fetching list
var voice_array = [];
if (speechSynthesis.onvoiceschanged !== undefined) // Firefox does not need or use onvoiceschanged (chrome only does)
window.speechSynthesis.onvoiceschanged = function() {
	if (window.self === window.top) // Only load in top window not iframes
	if (voice_array.length == 0) // don't create the list again if chrome thinks the voice changed
	{
	  	voice_array = window.speechSynthesis.getVoices();
	  	if (test_mode) console.table(voice_array);
	}
};


// find on page - Version 0.99.0
function find_phrase(keyword) {

setTimeout(function(){ // Version 0.99.7 - Wait for tooltip to disappear so we don't find keyword there
	var found = window.find(keyword, false, false, false, false, false, true); // search downward
	console.log(keyword+" "+found);
	if (found == false)
		found = window.find(keyword, false, true, false, false, false, true); // search upward
	console.log(keyword+" "+found);
	}, 1000);
}


var speak_tries = 0;

function speak(that)
{
	if (Array.isArray(that)) that = that[0]; // Version 0.99.7
	var text = that;
	var that_array = that.match(/(".*?"|'.*?'|[^"'\+]+)(?=\s*\+|\s*$)/g); // split by + not in quotes
	for (var a = 0; a < that_array.length; a++) {
		var element_id = that_array[a].split(".")[0];
		var el = (element_id == "body") ? document.body : document.getElementById(element_id); 
		if (el) {
			//var el = document.getElementById(element_id);
			if (that_array[a].indexOf(".") != -1) {
				var tag = that_array[a].split(".")[1]; // img[0]
				tag = tag.split("[")[0]; // img
				var num = that_array[a].match(/\[(\d+)/)[1]; // 0
				if (el.getElementsByTagName(tag)[num])
					el = el.getElementsByTagName(tag)[num];
			}
			
			if ('title' in el && el.title.length > 0)
				text = el.title;
			else if (el.hasAttribute("aria-label") && el.getAttribute("aria-label").length > 0)
				text = el.getAttribute("aria-label");
			else if ('alt' in el && el.alt.length > 0)
				text = el.alt;
			else if ('innerText' in el && el.innerText.length > 0)
				text = el.innerText;
		}
		else if (speak_tries < 15) {
			speak_tries++;
			setTimeout(function()
			{
				speak(that);
				//if (test_mode) console.log(that);
			} , 500);
			return;
		}
		
		speak_tries = 0;
		
		var sentences = text.split(/[\.\!\?\n]/); // Version 0.99.7 - Split by sentences to not break speechSynthesis with long text
		//say(sentences);  // Version 1.2.0 - Removed. Now doing say in sr.html because of Chrome 71 stopping speechSynthesis in pages without interaction
		//return ({"command": "say", "option": text}); // Version 1.2.0 - Now doing say in sr.html. Won't work because of setTimeout above
		send_to_background({"command": "say", "option": text}); // Version 1.2.0 - Still goes to sr.html because it is a background script
		elem_array = [];
		elem_array.push(el);
		highlight_speak(0); // Highlight first element to speak if set in settings
	}

}


var elem_array = []; // To be used with read(that) // Version 1.2.0
var text_array = []; // Version 1.2.3 - Put outside of read function

function highlight_speak(index) { // Version 1.2.0
	// select or highlight the next element that is being read.
	if (typeof elem_array != "undefined" && elem_array.length > 0 && elem_array[index]) {
		//var elem = elem_array.shift(); // Return and remove first element
		var elem = elem_array[index];
		if (test_mode) console.log(elem);
		if (document.body.contains(elem)) { // Version 1.2.5 - To prevent 'The given range isn't in document.' at gmail main screen
			if (elem.parentNode.nodeName == "TEXTAREA" && elem.parentNode.readOnly)
				elem = elem.parentNode; // Version 1.2.5 - Can't select the text in a readOnly textarea
			if (sra.settings.tts_highlight) 
				select_node(elem); // select text being spoken
			if (elem.nodeType == 3) // Text node
				elem = elem.parentNode; // Can't scroll to a text node or add outline to text node so get the parent element
			if (sra.settings.tts_highlight)	// Version 1.2.4 - Forgot to check for tts_highlight here	
				highlight_element(elem); // Put outline around element
			if (sra.settings.tts_scroll) 
				scrollToPosition(elem);
		}
	}
}


function read(that) { // Verison 1.2.0
	/* Aria role="none" or role="presentation" just means you don't read that if it is an anchor or table element but you read the content still
		See: https://www.w3.org/TR/using-aria/#ariapresentation
	*/
	if (window.self !== window.top) // Only load in top window not iframes
		return;
	if (Array.isArray(that)) that = that.join(); // Version 1.2.3 - combine [images]+[ on screen] = "images on screen";
	
	var fathers = document.querySelectorAll("body");
	//var queryTags = [node.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading'], p, img"), 
	//	node.querySelectorAll("a, [role='link']"), node.querySelectorAll("li")];
	
	
	if (that.match(/all|entire|everything/i)) {
		fathers = document.querySelectorAll("body");
	}
	else if (that.match(/alert|notification|status/i)) {
		fathers = document.querySelectorAll("[role='alert'],[role='alertdialog'],[role='dialog'],[role='status'],[aria-live='polite'],[aria-live='assertive'][aria-live='rude']");
	}
	else if (that.match(/heading|title|headline/i)) {
		fathers = document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading']");
	}
	else if (that.match(/paragraph/i)) {
		fathers = document.querySelectorAll("p");
	}
	else if (that.match(/link/i)) {
		fathers = document.querySelectorAll("a, [role='link']");
	}
	else if (that.match(/button/i)) {
		fathers = document.querySelectorAll("button, [role='button'], [type='button']");
	}
	else if (that.match(/input/i)) {
		fathers = document.querySelectorAll("input");
	}
	else if (that.match(/textarea/i)) {
		fathers = document.querySelectorAll("textarea");
	}
	else if (that.match(/image|figure/i)) {
		fathers = document.querySelectorAll("img, figure, [role='img'], [role='figure']");
	}
	else if (that.match(/menu|nav/i)) {
		fathers = document.querySelectorAll("[role='navigation'][aria-label='Primary'], nav[aria-label='Primary']");
		if (fathers.length == 0) fathers = document.querySelectorAll("nav, [role='navigation']");
		if (fathers.length == 0) fathers = document.querySelectorAll("#topnav, .topnav, #navbar, .navbar, #menu, .menu, #nav, .nav");
		//if (node) queryTags = [node.querySelectorAll("a, [role='link']"), node.querySelectorAll("li")];
		//queryTags = [document.querySelectorAll("nav, [role='navigation']")];
	}
	else if (that.match(/page|webpage|^screen|article|website|site|main|content|text/i)) {
		fathers = document.querySelectorAll("[role='main'], main, article, [role='article']");
		if (fathers.length == 0) fathers = document.querySelectorAll("#main, .main, #content, .content");
		if (fathers.length == 0) fathers = document.querySelectorAll("[class^=main], [class^=content], #container, .container");
		if (fathers.length == 0) fathers = document.querySelectorAll("body");
		/*if (window.location.href.match(/mail.google/i) && document.querySelector(".gs")) // or try .a3s.aXjCH for gmail
			var first_tag = node.querySelectorAll("h1, h2, .gs");
		else
			var first_tag = node.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading'], p, img");
		queryTags = [first_tag, node.querySelectorAll("dt, dd, td"),
			node.querySelectorAll("a, [role='link']"), node.querySelectorAll("li"), document.querySelectorAll("body")];	*/
	}
	else if (that.match(/header|banner/i)) {
		fathers = document.querySelectorAll("header, [role='banner']");
		if (fathers.length == 0) fathers = document.querySelectorAll(".header, #header");
		//queryTags = [document.querySelectorAll("header, [role='banner']")];
		//if (node) queryTags = [node.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading'], p, img"), 
		//node.querySelectorAll("a, [role='link']"), node.querySelectorAll("li")];
	}
	else if (that.match(/footer|contentinfo/i)) {
		fathers = document.querySelectorAll("footer, [role='contentinfo']");
		if (fathers.length == 0) fathers = document.querySelectorAll(".footer, #footer");
		//queryTags = [document.querySelectorAll("footer, [role='contentinfo']")];
		//if (node) queryTags = [node.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading'], p, img"), 
		//node.querySelectorAll("a, [role='link']"), node.querySelectorAll("li")];
	}
	else if (that.match(/sidebar|aside|complementary|complimentary/i)) {
		fathers = document.querySelectorAll("aside, [role='complementary'], #sidebar, .sidebar");
	}
	else if (that.match(/selected|highlighted|selection/i)) {
		//queryTags = [ [{"innerText":window.getSelection().toString()}], document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading'], p")];
		if (window.getSelection().toString()) var text = window.getSelection().toString();
		else var text = "Text is not selected on the page.";
		send_to_background({"command": "say", "option": text}); // Version 1.2.1
		elem_array = [];
		return;
	}
	
	var text = "";
	var all_text_length = 0;
	text_array = []; // blank text array
	elem_array = []; // blank elem_array
	var pause_text = ""; // Add period to end of element
	if ((fathers.length) == 0) {
		send_to_background({"command": "say", "option": that + " not found."}); // Version 1.2.3
		elem_array = [];
		return;
	}
		
	
	for (var q = 0; q < fathers.length; q++) {
		var father = fathers[q];
		read_children(father, that);
	}
	
	if (test_mode) console.log(elem_array);
	
	if (text_array.length > 0) {
		highlight_speak(0); // Highlight first element to speak if set in settings
		send_to_background({"command": "say", "option": text_array}); // Version 1.2.0 - Still goes to sr.html because it is a background script
	}
}
		
		
function read_children(father, that) {
	if (test_mode) console.log(father);
	var node = (that.match(/image|input/i)) ? father : father.firstChild; // Version 1.2.3
	for (node; node; node=node.nextSibling) {	
		if (test_mode) console.log(node);
		if (node.nodeType == 1) { // element node
			if (isVisible(node) && node.getAttribute("aria-hidden") != "true" && (!sra.settings.tts_simple || that.match(/image|input/i)) ) {
				if ((that.match(/page|webpage|paragraph|screen|on screen/i) && isOnScreen(node) == true) || 
				!that.match(/page|webpage|paragraph|screen|on screen/i)) {
					var text = ""; // Version 1.2.3 - Moved from out of if statements
					if (node.getAttribute("role") && node.getAttribute("role").match(/none|presentation/i)) text = "";
					else if (node.getAttribute("role")) text = node.getAttribute("role") + ". ";
					else if (node.tagName.match(/^(H\d)$/i)) text = "Heading. ";
					else if (node.tagName == "IMG" && (node.getAttribute('aria-label') || node.alt || node.title)) text = "Image. ";
					else if (node.tagName == "A" && node.innerText) text = "Hyperlink. ";
					else if (node.tagName.match(/BUTTON/i)) text = "Button. ";
					else if (node.tagName.match(/INPUT/i) && node.type != "hidden" && node.type.match(/checkbox/i)) { // Verison 1.2.5
						text = node.tagName + " " + node.type + ". ";
						text += (node.checked) ? "Checked. " : "Not checked. ";
					}
					else if (node.tagName.match(/LABEL/i) && node.type != "hidden" && node.innerText != "") text = node.tagName;
					else if (node.tagName.match(/SELECT/i) && node.type != "hidden") text = node.tagName + " type. " + node.type + ". Selected value is " + node.value + ". ";
					else if (node.tagName.match(/INPUT/i) && node.type != "hidden") text = node.tagName + " " + node.type + ". " + (node.value || node.placeholder) + ". ";
					else if (node.tagName.match(/TEXTAREA/i)) { 
						text = "Text Area. ";
						if (!node.readOnly) // textareas with readOnly have a firstChild text node. But non-readOnly have just a value
							text += (node.value || node.placholder) + ". "; // So read value if not readOnly
					}
					var add_text = node.getAttribute('aria-label') || node.alt || node.title || "";
					if (node.tagName == "A" && node.innerText.length > 1) add_text = node.getAttribute('aria-label') || ""; // It was annoying to have the title and innerText read
					if (node.getAttribute("role") && node.getAttribute("role").match(/img/i)) text = "Image. ";
					if (add_text) text += add_text + ". ";
					if (text) {
						if (node.readOnly) text += "Read only. ";
						if (node.disabled) text += "Disabled. ";
					}
					var label_elem = []; // Version 1.2.5 - From blank string to array
					if (node.getAttribute("aria-labelledby")) { // Version 1.2.5
						var label_ids = node.getAttribute("aria-labelledby").split(" "); // one or more element IDs split by space	
						for (var e = 0; e < label_ids.length; e++)
							label_elem.push(document.getElementById(label_ids[e]));
					}
					else if ((typeof node.labels != "undefined" && node.labels[0]))
						label_elem = node.labels;
					for (var le = 0; le < label_elem.length; le++) {
						if (label_elem[le] && label_elem[le] != father) { // Version 1.2.5 - Added '&& label_elem != father'
							for (var i = 0; i < elem_array.length; i++) {
								if (label_elem[le] == elem_array[i]) // See if we already spoke this label element
									break; 
							}
							if (i == elem_array.length) { // label was not in elem_array already so we can speak it
								//read_children(label_elem, that);
								text += "Label. " + label_elem[le].innerText + ". ";		
							}	
						}
					}
					if (text) {
						text_array.push(text);
						elem_array.push(node);	
					}
				}
			}
			if (that.match(/image|input/i)) break; // Version 1.2.3
			read_children(node, that); // Because an element could be visible even though parent is not because of absolute position
		}
		else if (node.nodeType == 3) { // text node		
			var elem = node.parentNode; 
			if (elem.nodeName == "OPTION") elem = elem.parentNode; // Version 1.2.5 - Option tags always return 0 for getBoundingClientRect() and look like they are onscreen. So get parent which should be SELECT
			if (isVisible(elem) && elem.getAttribute("aria-hidden") != "true" && elem.id != "speech_tooltip") { // Version 1.2.5 - Added != speech_tooltip
				if ((that.match(/page|webpage|paragraph|screen|on screen/i) && isOnScreen(elem) == true) || 
				!that.match(/page|webpage|paragraph|screen|on screen/i)) {
					if (!elem.tagName.match(/^(noscript)$/i)) // Don't read <noscript> innerText
					if (!node.nodeValue.match(/^\s+$/i)) {// If the whole text is just whitespace or newlines then ignore
						text_array.push(node.nodeValue);
						elem_array.push(node);
					}
				}
			}
		}	
	}
}
	
	/*queryTag_loop:
	for (var q = 0; q < queryTags.length; q++) {
		all_text_length = 0;
		var els = queryTags[q];
		els_loop:
		for (var i = 0; i < els.length; i++) {
			var elem = els[i];
			if (isVisible(elem) && elem.getAttribute("aria-hidden") != "true" && 
			(elem.getAttribute('aria-label') || elem.alt || elem.title || elem.innerText || elem.placeholder || elem.value)) {
				if ((that.match(/page|webpage|paragraph|screen|image|figure/i) && isOnScreen(elem) == true) || 
				!that.match(/page|webpage|paragraph|screen|image|figure/i)) {
					text = elem.getAttribute('aria-label') || elem.alt || elem.title || elem.innerText;
					text = text.replace(/https?:(\S*)/i, " hyperlink "); // Remove any http: links from google.com links
					if (elem.tagName == "IMG") text = "Image of " + text;
					if (elem.tagName == "A") text = "Hyperlink: " + text;
					if (elem.tagName == "LABEL") text = "Input Label: " + text;
					if (elem.tagName.match(/TEXTAREA|INPUT/i) && elem.value != "") 
						text = elem.tagName + ". " + elem.placeholder + ". Value is: " + elem.value;
					//if (!text.match(/[\.\!\?\n]$/)) text += pause_text; // Add period to end of sentence if not there.
					if (!text.match(/^\s+$/)) {// Don't include elements that are just spaces or blanks
						text_array.push(text);
						elem_array.push(elem);	
						if (that.match(/paragraph|heading|title|selected|highlighted|selection|text/i))
							break queryTag_loop; // Only one paragraph if they say paragraph
					}
				}
			}	
		}
		if (text_array.length > 0) break queryTag_loop; // Don't move on to next queryTag if we found elements to read
	}
	*/
/*	if (that.match(/selected|highlighted|selection|text/i)) {
		text = window.getSelection().toString();
		//if (!text.match(/[\.\!\?\n]$/)) text += pause_text; // Add period to end of sentence if not there.
		text_array.push(text);
		if (text == "") that = "page";
	}
	
	if (that.match(/alert|notification|status/i)) {
		var els = document.querySelectorAll("[role='alert'],[role='status'],[aria-live='polite'],[aria-live='assertive']");
		for (var i = 0; i < els.length; i++) {
			var elem = els[i];
			text = elem.innerText;
			//if (!text.match(/[\.\!\?\n]$/)) text += pause_text; // Add period to end of sentence if not there.
			text_array.push(text);
			elem_array.push(elem);
			
		}				
	}
	
	
	if (that.match(/page|webpage|paragraph|screen|article|website|site/i)) {
		if (document.querySelector(".a3s.aXjCH")) // gmail email body
			var els = document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading'], .a3s.aXjCH");
		else
			var els = document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading'], p");
		for (var i = 0; i < els.length; i++) {
			var elem = els[i];
			if (isVisible(elem) && (elem.getAttribute('aria-label') || elem.title || elem.alt || elem.innerText )) {
				if ((that.match(/page|webpage|paragraph|screen/i) && isOnScreen(elem) == true) || that.match(/article|website|site/i)) {
					text = elem.getAttribute('aria-label') || elem.title || elem.alt || elem.innerText;
					text = text.replace(/https?:(\S*)/i, " hyperlink "); // Remove any http: links from google.com links
					//if (!text.match(/[\.\!\?\n]$/)) text += pause_text; // Add period to end of sentence if not there.
					text_array.push(text);
					elem_array.push(elem);
					if (that.match(/paragraph/i))
						break; // Only one paragraph if they say paragraph
				}
			}	
		}
	}
	
	var sum = 0;
	for (var t = 0; t < text_array.length; t++) 
		sum += text_array[t].length;
	//if (test_mode) console.log(sum);
	if (sum <= text_array.length + 1) that = "links"; // If only blanks " " then get links as well
	
	if (that.match(/links|buttons|inputs/i) || (text_array.length == 0 && that.match(/page|webpage|paragraph|article|website|site/i)) ) {
		var els = document.querySelectorAll("a, input, [role='button']");
		for (var i = 0; i < els.length; i++) {
			var elem = els[i];
			if (isVisible(elem) && (elem.getAttribute('aria-label') || elem.title || elem.alt || elem.innerText)) {
				if (isOnScreen(elem) == true) {
					text = elem.getAttribute('aria-label') || elem.title || elem.alt || elem.innerText;
					text = text.replace(/https?:(\S*?)/i, " hyperlink "); // Remove any http: links from google.com links
					//if (!text.match(/[\.\!\?\n]$/)) text += pause_text; // Add period to end of sentence if not there.
					text_array.push(text);
					elem_array.push(elem);
					if (that.match(/paragraph/i))
						break; // Only one paragraph if they say paragraph
				}
			}	
		}
	}
	
	if (that.match(/images/i) || (text_array.length == 0 && that.match(/page|webpage|paragraph|article|website|site/i)) ) {
		var els = document.querySelectorAll("img");
		for (var i = 0; i < els.length; i++) {
			var elem = els[i];
			if (isVisible(elem) && (elem.getAttribute('aria-label') || elem.title || elem.alt || elem.innerText)) {
				if (isOnScreen(elem) == true) {
					text = elem.getAttribute('aria-label') || elem.title || elem.alt || elem.innerText;
					text = text.replace(/https?:(\S*?)/i, " hyperlink "); // Remove any http: links from google.com links
					//if (!text.match(/[\.\!\?\n]$/)) text += pause_text; // Add period to end of sentence if not there.
					text_array.push(text);
					elem_array.push(elem);
					if (that.match(/paragraph/i))
						break; // Only one paragraph if they say paragraph
				}
			}	
		}
	}
	*/
	



// Version 1.2.0 - To Stop tts from speaking text
window.addEventListener('keydown', function(e){
    if(e.key=='Escape'||e.key=='Esc'||e.keyCode==27) 
		send_to_background({"command": "stopSpeaking", "option": ""}); // Pause or unpause

}, false);

		
function say(that) 
{	
	window.speechSynthesis.cancel(); // Version 0.99.7 - Bug in speechSynthesis - If text is too long it breaks and does not work until restarting browser. cancel() will fix the error.
		
	if (window.self === window.top) { // Only load in top window not iframes
		var voice_array = window.speechSynthesis.getVoices();	
		var msg = new SpeechSynthesisUtterance();
		if (test_mode) console.log("Speaking: "+that[0]);
		msg.text = that.shift();
		msg.voice = voice_array[sra.settings.select_voice];
		msg.pitch = sra.settings.tts_pitch;
		msg.rate = sra.settings.tts_rate;
		//msg.lang = "en-GB"; // Only works if you don't set msg.voice above
		//msg.gender = "male"; // Does not work
		msg.onstart = function (event) {
	        if (test_mode) console.log('speechSynthesis Started ' + event);
	    };
	    msg.onend = function(event) {
	        if (test_mode) console.log('speechSynthesis Ended ' + event);
	        if (typeof that != "undefined" && that.length > 0) 
				say(that);
	    };
	    msg.onerror = function(event) {
	        if (test_mode) console.log('speechSynthesis Errored ' + event);
	    }
	    msg.onpause = function (event) {
	        if (test_mode) console.log('speechSynthesis paused ' + event);
	    }
	    msg.onboundary = function (event) {
	        if (test_mode) console.log('speechSynthesis onboundary ' + event);
	    }
		
		/*var sentences = that.split(/[\.\!\?\n]/); // Version 0.99.7 - Split by sentences to not break speechSynthesis with long text
		for (var i = 0; i < sentences.length; i++) {
			msg.text = sentences[i];
			if (test_mode) console.log("Sentence "+i+": "+sentences[i]);
			window.speechSynthesis.speak(msg);
		}*/
		window.speechSynthesis.speak(msg);
	}
}


function select_node(el) 
{
    // Copy textarea, pre, div, etc.
	if (document.body.createTextRange) {
        // IE 
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.select();  
    }
	else if (window.getSelection && document.createRange) {
        // non-IE
        /*var editable = el.contentEditable; // Record contentEditable status of element
        var readOnly = el.readOnly; // Record readOnly status of element
       	el.contentEditable = true; // iOS will only select text on non-form elements if contentEditable = true;
       	el.readOnly = false; // iOS will not select in a read only form element
		*/
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range); // Does not work for Firefox if a textarea or input
        if (el.nodeName == "TEXTAREA" || el.nodeName == "INPUT") 
        	el.select(); // Firefox will only select a form element with select()
        if (el.setSelectionRange && navigator.userAgent.match(/ipad|ipod|iphone/i))
        	el.setSelectionRange(0, 999999); // iOS only selects "form" elements with SelectionRange
        /*el.contentEditable = editable; // Restore previous contentEditable status
        el.readOnly = readOnly; // Restore previous readOnly status 
		*/
    }
} // end function select_node(el) 




function click_element(that)
{
	if (Array.isArray(that)) that = that[0]; // Version 0.99.7
	var times = 1;
	var that_array = that.match(/(".*?"|'.*?'|[^"'\+]+)(?=\s*\+|\s*$)/g); // split by + not in quotes
	for (var a = 0; a < that_array.length; a++) {
		var element_id = that_array[a].split(".")[0];
		var el_to_click = (element_id == "body") ? document.body : document.getElementById(element_id); 
		if (el_to_click) {
			//var el_to_click = document.getElementById(element_id);
			if (that_array[a].indexOf(".") != -1) {
				var tag = that_array[a].split(".")[1]; // img[0]
				tag = tag.split("[")[0]; // img
				var num = that_array[a].match(/\[(\d+)/)[1]; // 0
				if (el_to_click.getElementsByTagName(tag)[num])
					el_to_click = el_to_click.getElementsByTagName(tag)[num];
			}
		}
	}
	
	if (el_to_click)
	{
		scrollToPosition(el_to_click);
		el_to_click.focus();
		highlight_element(el_to_click);
		var ms = 250; // milliseconds
		for (var i = 0; i < times; i++)
		{
			setTimeout(function(){ 
				//el_to_click.click();
				var mutation_record = mutation_num; // Record current mutation amount
				if (test_mode) console.log(mutation_num);
				var j = 0;
				if (el_to_click.nodeName == "OPTION") el_to_click.selected = true;
				/* Gmail "Compose" button only works on "mouseup" event */
				var event = document.createEvent('MouseEvents');
				event.initEvent("mousedown", true, false); // try (click|mousedown|mouseup), bubble, cancelable
				el_to_click.dispatchEvent(event);
				event = document.createEvent('MouseEvents');
				event.initEvent("click", true, false); // try (click|mousedown|mouseup), bubble, cancelable
				el_to_click.dispatchEvent(event);
				event = document.createEvent('MouseEvents');
				event.initEvent("mouseup", true, false); // try (click|mousedown|mouseup), bubble, cancelable
				el_to_click.dispatchEvent(event);
				
				setTimeout(function(){ 
					if (test_mode) console.log(mutation_num);
					if (mutation_num == mutation_record) // The mutations have not advanced so the click did nothing 
					{
						if (el_to_click.children[0])
						 el_to_click.children[0].click();
					}
				}, 250); 
			
			}, ms); 
			ms += 250; // Add a 1/4 of second between each click
		}
		//el_to_click.click();
		if (test_mode) console.log(el_to_click);		
	}

}


function toggle_on_off(obj)
{
	/* Using chrome.storage.local instead of sync because we don't want to save the
    	variable between all the user's chrome devices */
    if (test_mode) console.log(JSON.stringify(obj));

    var now = new Date();
    if (obj.hasOwnProperty("toggle")) // If the object key "toggle" exists
    if (obj["toggle"].hasOwnProperty("date")) // date also exists
    {
	    obj.toggle['date'] = new Date(obj.toggle['date']); // convert date string back to date obj
		if (now > obj.toggle['date']) // the date exists but it is old
	    {
	    	// delete the storage
			chrome.storage.local.remove("toggle");
			// So run the links because they are no longer disabled	 
	    }
	    else if (now < obj.toggle['date']) // the key exists and it is NOT old
	    {
	    	// Disable WR
			var wr_buttons_array = document.getElementsByClassName("wr_buttons");
			for (var j = 0; j < wr_buttons_array.length; j++)
			{
				wr_buttons_array[j].className += " off";	
			}
			if (wr_timer) clearTimeout(wr_timer); // Clear timer to wr_read_links
			return; // Don't run the links
	    }
    }
	// Enable WR
	var wr_buttons_array = document.getElementsByClassName("wr_buttons");
	for (var j = 0; j < wr_buttons_array.length; j++)
	{
		wr_buttons_array[j].className = wr_buttons_array[j].className.replace(/\s\boff\b/, "");	
	}
    // Run the links
    wr_read_links();

} // end toggle_on_off(obj)





function show_your_votes(which)
{
		if (!wr_cid)
		{
			setTimeout(function()
			{
				show_your_votes(which); 
				return;
			} , 100);
			return;
		}
	var obj = { "your_votes" : { "which" : which } };
	option = which;
	send_to_server(obj);
}


function insertTextAtCaret(txtarea, text) {
    /* Chrome does not support selectionStart on input elements
		of special types except for type="text|search|password|tel|url"
		it will give this error: 
		Failed to read the 'selectionStart' property from 'HTMLInputElement'
		So we have to use try and catch
	*/
	// this function also does not preserve undo history
	try
	{
		var scrollPos = txtarea.scrollTop;
	    var caretPos = txtarea.selectionStart;
	
	    var front = (txtarea.value).substring(0, caretPos);
	    var back = (txtarea.value).substring(txtarea.selectionEnd, txtarea.value.length);
	    txtarea.value = front + text + back;
	    caretPos = caretPos + text.length;
	    txtarea.selectionStart = caretPos;
	    txtarea.selectionEnd = caretPos;
	    txtarea.focus();
	    txtarea.scrollTop = scrollPos;
	}
	catch(err)
	{
		/* Can't insert at cursor with type= "email" or "number", etc...
	  		so we will just have to add it to the end of value */
		txtarea.value += text;
	}
}


function linebreak(s) 
{
 	var two_line = / ?\n\n/g;
	var one_line = / ?\n/g;
	//if (s.match(two_line))
	//	document.execCommand( 'insertParagraph', false ); // Version 1.1.0 - Removed
	// Version 1.1.0 - \u200C = &zwnj; = zero-width non-joiner
	s = s.replace(two_line, '\n').replace(one_line, '<br \>\u200C'); // Verison 1.1.0 - Added \u200C
	
	return s;
}

function pasteHtmlAtCaret(html) {
	/* This function works great for text and new paragraphs and new lines
		in a content editable div. However, it does not preserve a
		undo history. On the other hand:
		document.execCommand("InsertHTML", false, html); does preserve an
		undo history and works great for content editable div and textarea.
		But it does not do new paragraphs well or new lines. */
    var sel, range;
    if (window.getSelection) {
        // IE9 and non-IE
        //document.execCommand("InsertHTML", false, html);
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // only relatively recently standardized and is not supported in
            // some browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);

            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type != "Control") {
        // IE < 9
        document.selection.createRange().pasteHTML(html);
    }
}


function insertTextAtCursor(text) {
    /* This function will insert text at the cursor
    	in a contentEditable div. However, it did not
    	do html. So we are not using it anymore.
    	Using pasteHtmlAtCaret(html) now.
    */
	var sel, range, html;
    
    //text = linebreak(text); // Add P tag to 'New Paragrah' and br tag to 'New Line'
	
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
}

function speech_tooltip(el, message)
{
	//if (window.self != window.top) return; // Version 0.99.9 - Don't do speech tooltip in iframes // Version 1.0 - Commented out
	var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
	var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	var x = parseInt(el.getBoundingClientRect().left) + scrollLeft + 10;
	var y = parseInt(el.getBoundingClientRect().top) + scrollTop + 10;
	if (isOnScreen(el) != true) el = document.body; // Version 0.99.2 // Version 1.0.2 - Uncommented and added != true
	if (el.nodeName == "BODY")
	{
		x = Math.round(scrollLeft) + 10;
		y = Math.round(scrollTop) + 10;	
	}
	if (!document.getElementById("speech_tooltip"))
	{
		var tooltip = document.createElement('div');
		tooltip.id = "speech_tooltip";
		tooltip.style.position = "absolute";
		tooltip.style.border = "1px solid black";
		tooltip.style.background = "#dbdb00";
		tooltip.style.opacity = 1;
		tooltip.style.transition = "opacity 0.3s";
		tooltip.style.zIndex = "1999999999";
		//window.tooltip_timer = ""; // create a global tooltip_timer variable
		document.body.appendChild(tooltip);
	}
	else
	{
		var tooltip = document.getElementById("speech_tooltip")
	}
	tooltip.style.opacity = 1;
	tooltip.style.display = "block";
	tooltip.style.left = x + "px";
	tooltip.style.top = y + "px";
	if (window.self === window.top) // Only scroll in main document not the iframes
		scrollToPosition(tooltip);
	tooltip.innerHTML = message;
	clearTimeout(tooltip_timer);
	tooltip_timer = setTimeout(function() { tooltip.style.display = "none"; tooltip.style.opacity = 0; }, 1000);
}


function scrollToPosition(el)
{  
   	/* This function scrolls to element only if it is out of the current screen */
	var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
	var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	var scrollBottom = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) + scrollTop;
	var scrollRight = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) + scrollLeft;

   if (Array.isArray(el)) el = el[0]; // Version 0.99.7
   if (typeof el == "string") el = document.getElementById(el); // Version 0.99.7
   if (el)
   {
	   // Version 0.99.2 - commented out traversing DOM and using getBoundingClientRect() instead
	   /*var theElement = el;  
	   var elemPosX = theElement.offsetLeft;  
	   var elemPosY = theElement.offsetTop;  
	   theElement = theElement.offsetParent;  
	   	while(theElement != null)
	   	{  
			elemPosX += theElement.offsetLeft   
			elemPosY += theElement.offsetTop;  
			theElement = theElement.offsetParent; 
		}*/ 
		
		/* // Old way - Incorrect if scrolled element is not the body of the document
		elRect = el.getBoundingClientRect();
		var elemPosX = elRect.left + scrollLeft;
		var elemPosY = elRect.top + scrollTop;
		
		// Only scroll to element if it is out of the current screen
		if (elemPosX < scrollLeft || elemPosX > scrollRight ||
			elemPosY < scrollTop || elemPosY > scrollBottom) 
		window.scrollTo((el.getBoundingClientRect().left + scrollLeft) - ((scrollRight-scrollLeft)/2), 
						(el.getBoundingClientRect().top + scrollTop) - ((scrollBottom-scrollTop)/2)); 
		*/
		if (isOnScreen(el) != true) // Version 1.3.1 - New way of scrolling to el
		{
			//window.scrollTo(elemPosX ,elemPosY); 
			var isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
			if(isSmoothScrollSupported) {
	   			el.scrollIntoView({
			     behavior: "smooth",
			     block: "center"
			   });
			} else {
			   //fallback to prevent browser crashing
			   el.scrollIntoView(false);
			}
		}
		//window.scrollTo(elemPosX ,elemPosY); 
		//el.scrollIntoView();
	}
}  // end function scrollToPosition()

function isOnScreen(el)
{
	/* This checks to see if an element is within the current user viewport or not */
	var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
	var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	var screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; // Version 1.2.0
	var screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth; // Version 1.2.0
	var scrollBottom = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) + scrollTop;
	var scrollRight = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) + scrollLeft;
	var onScreen = false;
   
   /* if (el)
   {
	   var theElement = el;  
	   var elemPosX = theElement.offsetLeft;  
	   var elemPosY = theElement.offsetTop;  
	   theElement = theElement.offsetParent;  
	   	while(theElement != null)
	   	{  
			elemPosX += theElement.offsetLeft   
			elemPosY += theElement.offsetTop;  
			theElement = theElement.offsetParent; 
		} 
		// return false if element is not on screen
		if (elemPosX < scrollLeft || elemPosX > scrollRight ||
			elemPosY < scrollTop || elemPosY > scrollBottom) 
			return false;
		else
			return true;
	} */
	
	/* New way: el.getBoundingClientRect always returns 
		left, top, right, bottom of
		an element relative to the current screen viewport */ 
	var rect = el.getBoundingClientRect();
	if (rect.bottom >= 0 && rect.right >= 0 && 
		rect.top <= screenHeight && rect.left <= screenWidth) // Version 1.2.0 - Changed from scrollBottom and scrollRight
		return true;
	else { 
		// Verison 1.0.2 - Calculate how many pixels it is offscreen
		var distance = Math.min(Math.abs(rect.bottom), Math.abs(rect.right), Math.abs(rect.top - screenHeight), Math.abs(rect.left - screenWidth));	
		
		return -Math.abs(distance); // Version 1.0.2 - Return distance as a negative. Used to return false if off screen
	}
}


function isVisible(el)
{
	/* if parent element is display='none' the child still has its own display and visibility with
		getComputedStyle. So can't use that for display. Instead use the offsetWidth and offsetHeight trick
		which returns false if even the parent element is display='none'.
		But that only works for display='none' not for visibility='hidden'.
		The other problem with offsetWidth trick is if the parent has height of 0 or width of 0
		and overflow of none then the child still has its width.  So do we have to traverse the parents?
	*/
	var visible = true;
  	
  	for (var elem = el; elem; elem = elem.parentElement)
  	{
		if ( (elem.offsetWidth <= 2 || elem.offsetHeight <= 2) &&
			document.defaultView.getComputedStyle(elem,null).getPropertyValue("overflow") == "hidden")
  		{
  			visible = false;
  			break;
  		}
  		else if (document.defaultView.getComputedStyle(elem,null).getPropertyValue("display") == "none")
  		{
  			visible = false;
  			break;
  		}
  	}
	
	//visible = el.offsetWidth > 0 || el.offsetHeight > 0; // Old way; Doesn't work if parent's height is 0
	/* However visibilty is inherited so we can use getComputed style for that. */
	//console.log(document.defaultView.getComputedStyle(el,null).getPropertyValue("display"));
	if (document.defaultView.getComputedStyle(el,null).getPropertyValue("visibility") == 'hidden')
		visible = false;
		
	// is element positioned offscreen to the left or top? (-2000 etc)
	var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
	var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	if (Math.round(el.getBoundingClientRect().left + scrollLeft) < -1 ||
		Math.round(el.getBoundingClientRect().bottom + scrollTop) < -1) // Version 1.2.3 - Changed from top to bottom
		visible = false;

	return(visible);		
}


function isFormElement(el)
{
	/* if element is a form input element or textarea element
		and not type radio, checkbox, submit, button, color, hidden and
		not readOnly or disabled */
	if ( (el.nodeName.match(/^(TEXTAREA|BUTTON|LABEL|SELECT)$/i)) || 
		(el.nodeName == "INPUT" && el.type != "hidden") ) 
	if (el.readOnly != true && el.disabled != true)	
		return true;
	else
		return false;
}


function isInteractive(el, type)
{
	/* if element is a form input element or textarea element
		and not type radio, checkbox, submit, button, color, hidden and
		not readOnly or disabled */
	/* Note you can only focus on A or AREA tag if they have an href attribute */
	if (type == "text") return isTextInput(el);
	// had to remove |LABEL| from match below
	if ( (type == "form" && el.nodeName.match(/^(TEXTAREA|INPUT|BUTTON|SELECT)$/i)) ||
		 (type != "form" && el.nodeName.match(/^(TEXTAREA|INPUT|BUTTON|SELECT|OBJECT)$/i)) || 
		 (el.nodeName.match(/^(AREA|A)$/i) && el.hasAttribute("href")) ||
		 (el.hasAttribute('tabindex') && el.getAttribute('tabindex') != -1) || 
		 (el.hasAttribute('role') && el.getAttribute('role').match(/^(button|checkbox|combobox|gridcell|input|link|listbox|listitem|menuitem|menuitemcheckbox|menuitemradio|option|radio|select|slider|textbox|widget)$/i)) ||
		 (el.nodeName == "INPUT" && el.type != "hidden") ) 
	if (el.disabled != true)	// used to have el.readOnly != true &&
		return true;
	else
		return false;
}


function isTextInput(el)
{
	/* if element is a form input element or textarea element
		and not type radio, checkbox, submit, button, color, hidden and
		not readOnly or disabled */
	if ( (el.nodeName == "TEXTAREA") ||
		(el.nodeName == "INPUT" && 
		!el.type.match(/^(radio|checkbox|submit|reset|button|color|hidden|image)$/i)) ) 
	if (el.disabled != true)  // used to have el.readOnly != true && 
		return true;
	else
		return false;
}


function findElement(el, dom)
{
	/* This function finds an input or contentEditable element
		and returns it. Preferrably an element within the
		current viewport */
	var closest_offscreen_el = el;	// Version 1.0.2
	var closest_distance = -10000; // Version 1.0.2 - Distance of closest_offscreen_el
	var elems = dom.getElementsByTagName("*"); // Note we removed .body so we could get body tag as well and not just children of body
	for (var i=0; i<elems.length; i++)
	{
		var current_el = elems[i];
		/* cross-origin policy problem with below code. So detect if iframe is cross-origin or not. How? */
		//if (elems[i].nodeName == "IFRAME")
		//	current_el = findElement(current_el, elems[i].contentWindow.document)
		if ( (current_el.isContentEditable || isTextInput(current_el)) && isVisible(current_el) && current_el.readOnly != true) // Version 1.0.2 - Added 'current_el.readOnly != true'
		{	
			el = current_el;
			var distance = isOnScreen(el); // Version 1.0.2
			if (distance == true) // If element is within the current current viewport
				break; // then accept this element
			else { // Version 1.0.2 - How far is it offscreen
				if (distance > closest_distance) { // numbers are negative so > is the closest
					closest_offscreen_el = current_el;
					closest_distance = distance;
				}	
			}
			
			// Otherwise, keep checking to see if there is another element in the viewport
		}
	}
	if (distance != true) // Version 1.0.2 - Didn't find onscreen element so choose the closest one
		el = closest_offscreen_el;
	el.focus();
	highlight_element(el);
	return(el);
}

function isSearch(el)
{
	/* Find out if input is part of a search page */
	if (isTextInput(el)) // If it is an input element
	{
		// cycle thru attributes of element and look for "search|find"
		for (var i = 0; i < el.attributes.length; i++) {
		    var attrib = el.attributes[i];
		    if (attrib.specified) {
		        if (attrib.value.match(/search|find/i))
		        	if (el.form) return true;	
			}
		}
		// cycle thru attributes of form and look for "search|find"
		if (el.form)
		{
			for (var i = 0; i < el.form.attributes.length; i++) {
			    var attrib = el.form.attributes[i];
			    if (attrib.specified) {
			        if (attrib.value.match(/search|find/i))
			        	return true;	
				}
			}
		}
	}
	return false;
}


function submit_form()
{
	var el = document.activeElement;
	if (el.form) // if element is part of a form
	{
		el.form.submit(); // then submit that form
	}
	else // else look for a form
	{ 
		var all_forms = document.forms;
		for (var i = 0; i < all_forms.length; i++)
		{
			if (isVisible(all_forms[i]) && isOnScreen(all_forms[i]) == true)
			{
				all_forms[i].submit();		
				break;	
			}
		}
	}
}


function keypress2(k) {
    var oEvent = document.createEvent('KeyboardEvent');

    // Chromium Hack
    Object.defineProperty(oEvent, 'keyCode', {
                get : function() {
                    return this.keyCodeVal;
                }
    });     
    Object.defineProperty(oEvent, 'which', {
                get : function() {
                    return this.keyCodeVal;
                }
    });     

    if (oEvent.initKeyboardEvent) {
        oEvent.initKeyboardEvent("keydown", true, true, document.defaultView, false, false, false, false, k, k);
    } else {
        oEvent.initKeyEvent("keydown", true, true, document.defaultView, false, false, false, false, k, 0);
    }

    oEvent.keyCodeVal = k;

    if (oEvent.keyCode !== k) {
        alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
    }

    document.dispatchEvent(oEvent);
}



function keypress_inject(keyCode)
{
	var actualCode = '(' + function(keyCode) {
	    // All code is executed in a local scope.
	    // For example, the following does NOT overwrite the global `alert` method
	    //var alert = null;
	    // To overwrite a global variable, prefix `window`:
	    //window.alert = null;
	    // Simulate a keypress
	    var el = document.activeElement;
	
		// Event method
	  	var eventObj = document.createEvent("Events");
	  	eventObj.initEvent("keydown", true, true); // bubble, cancelable
	 	eventObj.keyCode = keyCode;
	    eventObj.which = keyCode;
	    el.dispatchEvent(eventObj);
	    //document.dispatchEvent(eventObj);
	    
	    eventObj = document.createEvent("Events");
	  	eventObj.initEvent("keypress", true, true);
	 	eventObj.keyCode = keyCode;
	    eventObj.which = keyCode;
	    el.dispatchEvent(eventObj);
	    //document.dispatchEvent(eventObj);
	    
	    eventObj = document.createEvent("Events");
	  	eventObj.initEvent("keyup", true, true);
	 	eventObj.keyCode = keyCode;
	    eventObj.which = keyCode;
	    el.dispatchEvent(eventObj);
	    //document.dispatchEvent(eventObj);
	    
	    // keyboard event method
		//var keyCode = 74; // 74 = j
		var keyboardEvent = document.createEvent("KeyboardEvent");
		var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
	    keyboardEvent[initMethod](
	                       "keypress",
	                        true,      // bubbles oOooOOo0
	                        true,      // cancelable   
	                        null,    // view
	                        false,     // ctrlKeyArg
	                        false,     // altKeyArg
	                        false,     // shiftKeyArg
	                        false,     // metaKeyArg
	                        keyCode,  
	                        keyCode          // charCode   
	    ); 
	    
		
	  	// Force Chrome to not return keyCode 0 when fired
		Object.defineProperty(keyboardEvent, 'keyCode', {
	        get : function() {
	            return keyCode;
	        }
	      });
	      
	    Object.defineProperty(keyboardEvent, 'which', {
        get : function() {
            return keyCode;
        }
      });

      Object.defineProperty(keyboardEvent, 'keyIdentifier', {
        get : function() {
            return 'Enter';
        }
      });

      Object.defineProperty(keyboardEvent, 'shiftKey', {
        get : function() {
            return false;
        }
      }); 
	  
	    el.dispatchEvent(keyboardEvent);
	
		 
	} + ')( ' + JSON.stringify(keyCode) + ');';
	
	var script = document.createElement('script');
	script.textContent = actualCode;
	(document.head||document.documentElement).appendChild(script);
	script.parentNode.removeChild(script);
	
	
	/* chrome.tabs.executeScript(null, {
    code: 'var s = document.createElement("script");' +
          's.textContent = ' + JSON.stringify(actualCode) + ';' + 
          '(document.head||document.documentElement).appendChild(s);' + 
          's.parentNode.removeChild(s);' 
	});
	*/
}



function keypress(array)
{
	// Simulate a keypress
	if (test_mode) console.log(array);
	var el = document.activeElement;
	var keyCode, ctrl, alt, shift, no_insertText = false;
	
	// array is an array: [keyCode, ctrl, alt, shift]
	if (Array.isArray(array)) {
		keyCode = array[0]; // Version 0.99.7
		ctrl = (typeof array[1] != 'undefined' && array[1] != "0" && array[1] != "false" && array[1] != false) ? true : false;
		alt = (typeof array[2] != 'undefined' && array[2] != "0" && array[2] != "false" && array[2] != false) ? true : false;
		shift = (typeof array[3] != 'undefined' && array[3] != "0" && array[3] != "false" && array[3] != false) ? true : false;	
		no_insertText = (typeof array[4] != 'undefined' && array[4] != "0" && array[4] != "false" && array[4] != false) ? true : false;	
	}	
	else keyCode = array; // keypress(32) instead of keypress([32])
	
	var keyCodes = [
	{
		"keyCode": 8, 
		"code": "Backspace", 
		"key": "Backspace"}, 
	{
		"keyCode": 9, 
		"code": "Tab", 
		"key": "Tab"}, 
	{
		"keyCode": 13, 
		"code": "Enter", 
		"key": "Enter"}, 
	{
		"keyCode": 16, 
		"code": "ShiftLeft", 
		"key": "Shift"}, 
	{
		"keyCode": 17, 
		"code": "ControlRight", 
		"key": "Control"}, 
	{
		"keyCode": 18, 
		"code": "AltLeft", 
		"key": "Alt"}, 
	{
		"keyCode": 27, 
		"code": "Escape", 
		"key": "Escape"}, 
	{
		"keyCode": 32, 
		"code": "Space", 
		"key": " ",
		"no_insertText": false}, 
	{
		"keyCode": 35, 
		"code": "End", 
		"key": "End"}, 
	{
		"keyCode": 36, 
		"code": "Home", 
		"key": "Home"}, 
	{
		"keyCode": 37, 
		"code": "ArrowLeft", 
		"key": "ArrowLeft"}, 
	{
		"keyCode": 38, 
		"code": "ArrowUp", 
		"key": "ArrowUp"}, 
	{
		"keyCode": 39, 
		"code": "ArrowRight", 
		"key": "ArrowRight"}, 
	{
		"keyCode": 40, 
		"code": "ArrowDown", 
		"key": "ArrowDown"}, 
	{
		"keyCode": 45, 
		"code": "Insert", 
		"key": "Insert"}, 
	{
		"keyCode": 46, 
		"code": "Delete", 
		"key": "Delete"}
	];
  	
	
	if (isNaN(keyCode)) { // if keyCode is not a number
		keyCode = keyCode.charCodeAt(0); // Convert string character into charCode
	} // Version 0.99.7
	keyCode = Number(keyCode);
	var keyCodeLowerCase = keyCode;
	var key = String.fromCharCode(keyCode);
	var code = "Key" + key.toUpperCase();
	for (var c = 0; c < keyCodes.length; c++) {
		if (keyCode == keyCodes[c].keyCode) {
			code = keyCodes[c].code;
			key = keyCodes[c].key;
			no_insertText = true; // Don't insert text for keys in keyCodes array
			if (keyCodes[c].hasOwnProperty('no_insertText'))
				no_insertText = keyCodes[c].no_insertText;
		}
	}
	
	// keydown and keyup change a-z (97-122) to A-Z (65-90); keypress leaves it as lowercase
	if (keyCode >= 97 && keyCode <= 122)
		keyCodeLowerCase = keyCode - 32;
	
	var keyObj = {'key':key, 'which':keyCodeLowerCase, 'keyCode':keyCodeLowerCase, 'charCode':0,
				'bubbles':true, 'cancelable':true, 'code': code,
				'composed':true, 'isTrusted':true,
				'ctrlKey':ctrl, 'altKey':alt, 'shiftKey':shift
				}
	if (test_mode) console.log(keyObj);
				
	var keypressObj = {'key':key, 'which':keyCode, 'keyCode':keyCode, 'charCode':keyCode,
				'bubbles':true, 'cancelable':true, 'code': code,
				'composed':true, 'isTrusted':true,
				'ctrlKey':ctrl, 'altKey':alt, 'shiftKey':shift
				}
				
				
	if (ctrl) el.dispatchEvent(new KeyboardEvent('keydown',{'key':'Control', 'code':'ControlLeft', 'keyCode':17, 'ctrlKey':ctrl, 'altKey':alt, 'shiftKey':shift})); 				
	if (alt) el.dispatchEvent(new KeyboardEvent('keydown',{'key':'Alt', 'code':'AltLeft', 'keyCode':18, 'ctrlKey':ctrl, 'altKey':alt, 'shiftKey':shift})); 				
	if (shift) el.dispatchEvent(new KeyboardEvent('keydown',{'key':'Shift', 'code':'ShiftLeft', 'keyCode':16, 'ctrlKey':ctrl, 'altKey':alt, 'shiftKey':shift})); 				
	
	el.dispatchEvent(new KeyboardEvent('keydown',keyObj));
	el.dispatchEvent(new KeyboardEvent('keypress',keypressObj));
	//el.dispatchEvent(new InputEvent('input',{'data':key, inputType:'insertText' }));
	if ( (el.isContentEditable || isTextInput(el)) && no_insertText == false && !ctrl && !alt) {	
		var textEvent = document.createEvent('TextEvent');
	    textEvent.initTextEvent('textInput', true, true, null, key, 9, "en-US");
		el.dispatchEvent(textEvent); // Version 1.0.4 - Needed for messenger.com to display first character. Not needed for enter(13) in messenger or google hangouts
		document.execCommand("InsertText", false, key); // Messes up messenger.com and facebook.com chat box
	}
	el.dispatchEvent(new KeyboardEvent('keyup',keyObj));
	
	//if (ctrl && key.toLowerCase() == 'z')
	//	el.dispatchEvent(new InputEvent('input',{'data':null, 'inputType':'historyUndo', 'composed':true})); // monitorEvents shows good event but does not undo
	if (ctrl) el.dispatchEvent(new KeyboardEvent('keyup',{'key':'Control', 'code':'ControlLeft', 'keyCode':17, 'ctrlKey':false, 'altKey':alt, 'shiftKey':shift})); 
	if (alt) el.dispatchEvent(new KeyboardEvent('keyup',{'key':'Alt', 'code':'AltLeft', 'keyCode':18, 'ctrlKey':ctrl, 'altKey':alt, 'shiftKey':shift})); 				
	if (shift) el.dispatchEvent(new KeyboardEvent('keyup',{'key':'Shift', 'code':'ShiftLeft', 'keyCode':16, 'ctrlKey':ctrl, 'altKey':alt, 'shiftKey':shift})); 				
	
/*	
	// Event method
  	var eventObj = document.createEvent("Events");
  	eventObj.initEvent("keydown", true, true); // bubble, cancelable
 	eventObj.keyCode = keyCode;
    eventObj.which = keyCode;
    eventObj.charCode = keyCode;
    eventObj.key = String.fromCharCode(keyCode);
    eventObj.code = "Key" + String.fromCharCode(keyCode);
    el.dispatchEvent(eventObj);
    //document.dispatchEvent(eventObj);
    
    eventObj = document.createEvent("Events");
  	eventObj.initEvent("keypress", true, true);
 	eventObj.keyCode = keyCode;
    eventObj.which = keyCode;
    eventObj.charCode = keyCode;
    eventObj.key = String.fromCharCode(keyCode);
    eventObj.code = "Key" + String.fromCharCode(keyCode);
    el.dispatchEvent(eventObj);
    //document.dispatchEvent(eventObj);
    
    eventObj = document.createEvent("Events");
  	eventObj.initEvent("keyup", true, true);
 	eventObj.keyCode = keyCode;
    eventObj.which = keyCode;
    eventObj.charCode = keyCode;
    eventObj.key = String.fromCharCode(keyCode);
    eventObj.code = "Key" + String.fromCharCode(keyCode);
    el.dispatchEvent(eventObj);
    //document.dispatchEvent(eventObj);
*/
    
    /*eventObj = document.createEvent('TextEvent'); // Does not save undo history without clicking somewhere with mouse
	eventObj.initTextEvent('textInput', true, true, null, String.fromCharCode(keyCode));
	el.dispatchEvent(eventObj); 
	
	eventObj = document.createEvent('Event'); 
	eventObj.initEvent('input', false, false);
	el.dispatchEvent(eventObj);
	
	eventObj = document.createEvent('Event'); 
	eventObj.initEvent('change', false, false);
	el.dispatchEvent(eventObj);*/
	
	
	// keyboard event method
	//var keyCode = 74; // 74 = j
/*	var keyboardEvent = window.document.createEvent("KeyboardEvent");
	var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
    keyboardEvent[initMethod](
                       "keydown",
                        true,      // bubbles oOooOOo0
                        true,      // cancelable   
                        null,    // view
                        false,     // ctrlKeyArg
                        false,     // altKeyArg
                        false,     // shiftKeyArg
                        false,     // metaKeyArg
                        keyCode,  
                        0          // charCode   
    );
    
	// forece Chrome to not return keyCode of 0 when fired
  	Object.defineProperty(keyboardEvent, 'keyCode', {
        get : function() {
            return keyCode;
        }
      });
      
    Object.defineProperty(keyboardEvent, 'key', {
        get : function() {
            return String.fromCharCode(keyCode);
        }
      });
    
    Object.defineProperty(keyboardEvent, 'code', {
        get : function() {
            return "Key" + String.fromCharCode(keyCode);
        }
      });
  
    el.dispatchEvent(keyboardEvent); 
    */
}


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
	    if (test_mode) console.log(precedingChar);
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
				if (el.hasAttribute("autocapitalize") && el.getAttribute("autocapitalize").match(/^(off|none)/)) // Version 0.99.9
					cap = false;
				else
					cap = true;
			}
			else if (lastLetter(el) != " ") // Version 1.2.0
				space = true;
			/*if (el.type.match(/email/i) || el.name.match(/username|userid|onlineid/i) || el.id.match(/username|userid|onlineid/i)
				text = text.replace(/ /, ""); // Remove all spaces. Version 0.99.9 - Bad idea. What if it is confused with a Display name field? */
			if (el.type.match(/email/i) || el.name.match(/email/i) || el.id.match(/email/i))
			{
				text = text.replace(/\bat\b/i, "@"); // Replace word boundary "at" with "@"; Version 0.99.9
				text = text.replace(/ /g, ""); // Remove all spaces. Version 0.99.9	
			}
		text = text.replace(/^ /, ""); // Remove space from beginning of text if it exists // Verison 0.99.9 - Moved outside of above if statement
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
		if (el.innerHTML.length == 0 || lastLetter(el) == "" || lastLetter(el).match(/[\n\.!\?\u200C]/)) // Version 1.1.0 - Added \u200C
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


function placeCursor(option)
{
	/* No longer using. Everything can be done with moveCursor(keyword) now.
		This function could never scroll to the cursor if it moved it to the bottom
	*/
	/* this function places the cursor in an element at the start|end|top|bottom of
		an element and then scrolls the element to that position
	*/
	var el = document.activeElement;
	var start = true;
	if (Array.isArray(option))
	{
		if (option.length <= 0) option.push("end");
		option = option[0];
	}
	
	if (option.match(/^(end|bottom)/))
		start = false;
	
	// Move cursor to start or end
	if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(el);//Select the entire contents of the element with the range
		range.collapse(start);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    
    scrollToCursor(el);
}


function highlight_element(el)
{
	/* Change background color of focused element for a second */
	/* border does not work on checkbox so I decided to use CSS outline instead */
	var old_outline = document.defaultView.getComputedStyle(el,null).getPropertyValue("outline");
	var old_background_color = document.defaultView.getComputedStyle(el,null).getPropertyValue("background-color");
	if (!el.getAttribute('data-old-outline')) // Version 1.2.3 - Only set if not set previously
		el.setAttribute('data-old-outline', old_outline);
	//el.setAttribute('data-old-background-color', old_background_color); // Version 1.2.3 - Removed
	//el.style.outline = "2px solid blue"; // Can't set !important here // Version 1.2.3 - Removed
	el.style.setProperty("outline", "2px solid blue", "important");
	//el.style.setProperty("background-color", "#FFFF55", "important"); // Version 1.2.3 - Removed
	/*el.addEventListener('blur', function() {
		var old_outline = event.target.getAttribute('data-old-outline');
		event.target.style.outline = old_outline;
		//var old_background_color = event.target.getAttribute('data-old-background-color'); // Version 1.2.3 - Removed
		//event.target.style["background-color"] = old_background_color; // Version 1.2.3 - Removed
	}, false); */
	setTimeout(function(){ 
		/*var old_outline = el.getAttribute('data-old-outline'); 
		el.style.outline = old_outline;
		var old_background_color = el.getAttribute('data-old-background-color');
		el.style["background-color"] = old_background_color;
		*/
		el.style.setProperty("outline", el.getAttribute('data-old-outline'), "important");
		//el.style.setProperty("background-color", "#FFFF55", "important");
	}, 2500);
}


function switch_fields(option)
{
	if (window.self != window.top) return; // Version 0.99.9 - Don't do switch_fields in iframes
	/* type = "form" for form element or "any" or "link" or "text" */	
	var type = "any";
	var times = 1;
	var keyword = null;

	if (Array.isArray(option))
	{
		if (option.length <= 0) option.push("next");	
		for (var a = 0; a < option.length; a++)
		{
			if (String(option[a]).match(/^(form|field|input|box|text|entry|area)/i))
				type = "text";
			else if (!isNaN(option[a])) // if is a number
				times = parseInt(option[a]);
			else
				keyword = option[a];
		}
		if (keyword) option = keyword;
		else option = option[0];
		if (test_mode) console.log(times);
		if (test_mode) console.log(option);
	}
	else if (option == "") option = "next"; // Version 0.99.7 - So custom command can have switch_fields(previous) as well as next
	
	var nextField = document.body;
	var dom = document;
	var activeElementIndex = null;
	var current_el = null;
	var interactiveElements = [];
	
	
	/* Search for any user input element */
	var elems = dom.getElementsByTagName("*"); // Note we removed .body so we could get body tag as well and not just children of body
	for (var i=0; i<elems.length; i++)
	{
		current_el = elems[i];
		/* cross-origin policy problem with below code. So detect if iframe is cross-origin or not. How? */
		//if (elems[i].nodeName == "IFRAME")
		//	current_el = findElement(current_el, elems[i].contentWindow.document)
		if (current_el == document.activeElement) activeElementIndex = i;
		if ( (current_el.isContentEditable || isInteractive(current_el, type)) && isVisible(current_el) )
		{	
			interactiveElements.push(current_el);
			if (isNaN(option)) // if option is a string and not a number
			{
				if (option.match(/^(tab|keyword|next|right|down|forward|forwards|for word|4 word|to|on|in|the|form|farm|weiter|siguiente|derecha|abajo|adelante|tabulaci.n|tabulador|successivo)$/i)) {
					if (activeElementIndex != null && i > activeElementIndex) {
						if (times > 1)
							times--;
						else
						{
							current_el.focus(); // see if current element can get focus
							if (current_el == document.activeElement) // if it didn't get focus then it wouldn't be activeElemnt
							{
								keypress_inject(9);
								nextField = current_el; 
								break;
							}
						}
					}
				}	
		    	else if (option.match(/^(shift tab|previous|left|up|app|a|backward|backwards|zur|anterior|izquierda|arriba|atr.s|maiusc tab|precedente)$/i)) {
		    		if (i == activeElementIndex && interactiveElements.length > 1) {
		    			for (var e = interactiveElements.length - 2; e >= 0; e--) {
			    			if (times > 1)
								times--;
							else
							{
								nextField = interactiveElements[e];
				    			nextField.focus(); // see if current element can get focus
								if (nextField == document.activeElement) // if it didn't get focus then it wouldn't be activeElemnt
									break;
							}
						}
					}	 
		    	}
		    	else
		    	{
		    		// Search for field with keywords with and without spaces: sea breeze computers, seabreezecomputers
		    		var keyword = option;
					var re = new RegExp("^("+String(keyword)+"|"
							+String(keyword).replace(" ","")+"|"
							+replace_mistakes(String(keyword))+"|"
							+String(keyword).replace(/(\d+)/g, function (number) { return(num2words(number, "-").trim())})+"|"
							+String(keyword).replace(/(\d+)/g, function (number) { return(num2words(number, " ").trim())})
						+")",'i');
					if ( ('textContent' in current_el && current_el.textContent.match(re)) ||
						 ('innerText' in current_el && current_el.innerText.match(re)) ||
						 ('innerHTML' in current_el && current_el.innerHTML.match(re)) ||
						 ('name' in current_el && String(current_el.name).match(re)) ||
						 ('placeholder' in current_el && current_el.placeholder.match(re)) ||
						 (current_el.hasAttribute("aria-label") && current_el.getAttribute("aria-label").match(re)) ||
						 ('title' in current_el && current_el.title.match(re)) ||
						 ('id' in current_el && String(current_el.id).match(re)) ||
						 ('value' in current_el && String(current_el.value).match(re)) ||
						 (String(keyword).match(/^(box|input|text|area|text area|text box|field|text field)$/i) && current_el.nodeName.match(/INPUT|TEXTAREA/i)) 
						)
					{
						nextField = current_el;
					    break;
					}	
				}
		    }
		    else // if option is a number
		    {
		    	var FieldNumber = option - 1;
		    	if (FieldNumber < 0) FieldNumber = 0;
		    	if (interactiveElements.length > FieldNumber) {
					nextField = interactiveElements[FieldNumber]; // Go to that field number (Remember that first field is 0)
					if (test_mode) console.log(option);
					break;
				}
		    }
		}
	}
	if (isNaN(option) && option.match(/^last$/i) && interactiveElements.length > 1)
		nextField = interactiveElements[interactiveElements.length - 1];
	
	if (test_mode) console.log(interactiveElements);
	if (test_mode) console.log(nextField);
	if (nextField)
	{
		nextField.focus(); 
		//if (nextField.isContentEditable) // When you focus on contentEditable divs the focus goes to start instead of end
		//	placeCursor("end"); 
		highlight_element(nextField);
	}
}


function navigation(keyword)
{
	if (Array.isArray(keyword)) keyword = keyword[0]; // Version 0.99.7
	
	if (window.self === window.top)
	{
		if (String(keyword).match(/^(back)$/i))
			window.history.back(); // Press browser back button
		if (String(keyword).match(/^(forward)$/i))
			window.history.forward(); // Press browser forward button
		else if (String(keyword).match(/^(homepage)$/i))
			window.location.href = "chrome://newtab"; // Not allowed to load local resource: chrome://newtab/ so doing in commands.js url() function
		else if (String(keyword).match(/^(reload|refresh)$/i))
			window.location.reload();
	}
}


function click_keyword(keyword)
{
	/* With this function we are going to click on any element
		with value or innerText that matches keyword but
		with preference that it is on screen and a button or a
		link
	*/
	var times = 1;
	var type = "";
	if (Array.isArray(keyword)) 
	{
		for (var a = 0; a < keyword.length; a++)
		{
			if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);
			else
				type = String(keyword[a]); // button|link|box|click|check|uncheck
		}
		keyword = keyword[0];
	}
	if (times > 20) times = 19; // Only let them click element 19 times
	var dom = document.body;
	var current_el = null;
	var el_to_click = null;
	var eligible = false; // Is the current element eligible to be clicked on
	var re_array = [];
	// Search for button with keywords with and without spaces: sea breeze computers, seabreezecomputers
	var regex = "("+String(keyword)+"|"
				+String(keyword).replace(" ","")+"|"
				+replace_mistakes(String(keyword))+"|"
				+String(keyword).replace(/(\d+)/g, function (number) { return(num2words(number, "-").trim())})+"|"
				+String(keyword).replace(/(\d+)/g, function (number) { return(num2words(number, " ").trim())})
			+")";
	if (window.location.href.match(/facebook.com|messenger.com/i) && keyword.toLowerCase() == "send") regex += "$"; // Version 1.0.4 - So we click on "Send" and not "Send Money"
	re_array[0] = new RegExp("^"+regex, 'i'); // First search for keyword at beginning of strings
	if (!String(keyword).match(/^(back|forward|refresh|reload)$/i))
		re_array[1] = new RegExp(regex, 'i'); // then search for keyword anywhere in the strings
	
	var interactiveElements = [];
	
if (String(keyword).match(/^(click|check|uncheck|button|link|it|clic|marcar|desmarcar|Klicka|Markera|Avmarkera)$/i))
	{
		// Click on current element
		el_to_click = document.activeElement;
	}
	else if (String(keyword).match(/^(submit)$/i))
	{
		submit_form();
		return;
	}
	
	/*var all_doms = [];
	all_doms.push(document);
	for (var f=0; f<window.frames.length;f++)
	{
		try {
			var iframe = window.frames[f].contentDocument || window.frames[f].contentWindow.document; // deal with older browsers
			all_doms.push(iframe);
		} catch(err) {
			// catch if iframe is cross-origin
		}
	}
	for (var d=0; d<all_doms.length;d++)
	{
	if (el_to_click) // if we found element to click before going though all iframes
		break; // then break the loop
	dom = all_doms[d].body; */
	
	var elems = dom.getElementsByTagName("*"); // Note we removed .body so we could get body tag as well and not just children of body
	for (var r = 0; r < re_array.length; r++)
	{
		var re = re_array[r];
		if (el_to_click) // if we found element to click before looking for keyword without beginning of string match: ^
			break; // then break the loop	
	for (var i=0; i<elems.length; i++)
	{
		current_el = elems[i];
		/*if (elems[i].nodeName == "IFRAME")
		try 
		{ 
	    	current_el = current_el.contentDocument || current_el.contentWindow.document; // deal with older browsers
	    } catch(err){
	    	// catch if iframe is cross-origin
	      	// do nothing
	    }*/

		//	current_el = findElement(current_el, elems[i].contentWindow.document)
		eligible = false;
		if (isVisible(current_el))
		{
			eligible = true;
			if ('type' in current_el && current_el.type == 'hidden') eligible = false;
			if ('disabled' in current_el && current_el.disabled == true) eligible = false;
			//if ('readOnly' in current_el && current_el.readOnly == true) eligible = false; // Yes you can click in readOnly textarea so you can copy it!
				
			if (eligible)
			{
				if (typeof keyword === 'string' || keyword instanceof String)
				{
					//console.log(current_el);
					/* I did have these in the if statement:
						('textContent' in current_el && current_el.textContent.match(re)) ||
						 ('innerText' in current_el && current_el.innerText.match(re)) ||
					*/
					if ( ('textContent' in current_el && current_el.textContent.match(re)) ||
						 ('innerText' in current_el && current_el.innerText.match(re)) ||
						 //('innerHTML' in current_el && current_el.innerHTML.match(re)) ||
						 ('name' in current_el && String(current_el.name).match(re)) ||
						 ('placeholder' in current_el && current_el.placeholder.match(re)) ||
						 (current_el.hasAttribute("aria-label") && current_el.getAttribute("aria-label").match(re)) ||
						 ('title' in current_el && current_el.title.match(re)) ||
						 ('id' in current_el && String(current_el.id).match(re)) ||
						 ('value' in current_el && String(current_el.value).match(re)) ||
						 (String(keyword).match(/^(box|input|text area|text box|field|text field|textarea)$/i) && current_el.nodeName.match(/INPUT|TEXTAREA/i)) // Version 1.0.2 - Added textarea
						 )
					if (current_el.id != "speech_tooltip")
					{
						el_to_click = current_el; 
						/* If element is within the current current viewport
							and is a button or a link */
						if (isOnScreen(current_el) == true)
						{
							if (current_el.nodeName == "INPUT" && current_el.type.match(/^(button|radio|reset|submit)$/i))
						 		break; // then accept this element
						 	else if (current_el.nodeName == "TEXTAREA")
						 		break;
						 	else if (current_el.nodeName.match(/^(BUTTON|A|OPTION)$/i)) // version 1.3.2 - Removed SELECT
						 		break; // then accept this element
							else if (current_el.nodeName.match(/^(SELECT)$/i) && // Version 1.3.2 - Added SELECT by itself
									( ('id' in current_el && String(current_el.id).match(re)) ||
									  ('name' in current_el && String(current_el.value).match(re)) ) )
								break;
						 	else if (current_el.nodeName.match(/^(LABEL)$/i)) // if label then get input child of label
						 	{
						 		/*el_to_click = (current_el.htmlFor)
					        		? document.getElementById(current_el.htmlFor)
					            	: current_el.getElementsByTagName('input')[0];*/
					            break; 
						 	}
						 	else if ( (current_el.hasAttribute('tabindex') && current_el.getAttribute('tabindex') != -1) || 
		 				  			  (current_el.hasAttribute('role') && current_el.getAttribute('role').match(/^(button|checkbox|combobox|gridcell|input|link|listbox|listitem|menuitem|menuitemcheckbox|menuitemradio|option|radio|select|slider|textbox|widget)$/i))
		 				  			)
		 				  		break;
		 				  		
							/*else // search children of element
							{
								var children = current_el.children;
								for (var c = 0; c < children.length; c++)
								{
									if ( (current_el.nodeName == "INPUT" && current_el.type.match(/^(button|radio|reset|submit)$/i)) ||
										 (current_el.nodeName.match(/^(BUTTON|A|OPTION|SELECT|LABEL)$/i)) )
										el_to_click = current_el;
								}	
								break; // I think I should break anyway	
							}*/
						}
					}
				}
				else if (typeof keyword === 'number' && isOnScreen(current_el) == true)
				{
					if ( (type == "button") && 
						( (current_el.nodeName == "INPUT" && current_el.type.match(/^(button|radio|reset|submit)$/i)) ||
						  (current_el.nodeName.match(/^(BUTTON)$/i)) ) ||
						  (current_el.hasAttribute('tabindex') && current_el.getAttribute('tabindex') != -1) || 
		 				  (current_el.hasAttribute('role') && current_el.getAttribute('role').match(/^(button|checkbox|combobox|gridcell|listbox|listitem|menuitem|menuitemcheckbox|menuitemradio|option|radio|select|slider|widget)$/i))
		 				)
						interactiveElements.push(current_el);
					else if ( (type == "link" && current_el.nodeName == "A") ||
							  (current_el.hasAttribute('tabindex') && current_el.getAttribute('tabindex') != -1) || 
							  (current_el.hasAttribute('role') && current_el.getAttribute('role').match(/^(link|menuitem|menuitemcheckbox|menuitemradio|widget)$/i))
		 					)
						interactiveElements.push(current_el);
					var FieldNumber = keyword - 1;
			    	if (FieldNumber < 0) FieldNumber = 0;
			    	if (interactiveElements.length > FieldNumber) {
						el_to_click = interactiveElements[FieldNumber]; // Go to that field number (Remember that first field is 0)
						break;
					}
				}
			}	 
		}
	}
	} // end all reg expressions for loop
	if (typeof keyword === 'string' && keyword.match(/^last$/i) && interactiveElements.length > 1)
		el_to_click = interactiveElements[interactiveElements.length - 1];
	
	if (el_to_click)
	{
		scrollToPosition(el_to_click);
		el_to_click.focus();
		highlight_element(el_to_click);
		var ms = 250; // milliseconds
		for (var i = 0; i < times; i++)
		{
			setTimeout(function(){ 
				//el_to_click.click();
				var mutation_record = mutation_num; // Record current mutation amount
				if (test_mode) console.log(mutation_num);
				var j = 0;
				if (el_to_click.nodeName == "SELECT") { // Version 1.3.2 - Moved above "OPTION" instead of below it
					if (typeof el_to_click.options[el_to_click.selectedIndex] !== "undefined") { // Version 1.3.2 - Added these 2 lines and commented out below 2 lines
						if (test_mode) console.log(el_to_click.options[el_to_click.selectedIndex]);
						el_to_click = el_to_click.options[el_to_click.selectedIndex];
					}
					/*if (el_to_click.size <= 1) el_to_click.size = el_to_click.length; // Version 1.0.1 - Open select box
					else if (el_to_click.size == el_to_click.length) el_to_click.size = 1; // Version 1.0.1 - Close select box	
					*/
				}
				if (el_to_click.nodeName == "OPTION") { 
					if (el_to_click.index != el_to_click.parentNode.selectedIndex) { // If not currently selected option then select it
						el_to_click.selected = true;
						var event = new Event('change');
						el_to_click.parentNode.dispatchEvent(event); // Version 1.0.1 - Fire change event
						if (test_mode) console.log("selectedIndex: "+el_to_click.parentNode.selectedIndex);
					}
					if (el_to_click.parentNode.size <= 1) el_to_click.parentNode.size = el_to_click.parentNode.length; // Version 1.0.1 - Open select box // Version 1.3.2 - Changed 5 to el_to_click.parentNode.length
					else if (el_to_click.parentNode.size == el_to_click.parentNode.length) el_to_click.parentNode.size = 1; // Version 1.0.1 - Close select box	// Version 1.3.2 - Changed 5 to el_to_click.parentNode.length
				}
				/* Gmail "Compose" button only works on "mouseup" event */
				var event = document.createEvent('MouseEvents');
				event.initEvent("mousedown", true, false); // try (click|mousedown|mouseup), bubble, cancelable
				el_to_click.dispatchEvent(event);
				event = document.createEvent('MouseEvents');
				event.initEvent("click", true, false); // try (click|mousedown|mouseup), bubble, cancelable
				el_to_click.dispatchEvent(event);
				event = document.createEvent('MouseEvents');
				event.initEvent("mouseup", true, false); // try (click|mousedown|mouseup), bubble, cancelable
				el_to_click.dispatchEvent(event);
				
				setTimeout(function(){ 
					if (test_mode) console.log(mutation_num);
					if (mutation_num == mutation_record) // The mutations have not advanced so the click did nothing 
					{
						if (el_to_click.children[0])
						 el_to_click.children[0].click();
					}
				}, 250); 
			
			}, ms); 
			ms += 250; // Add a 1/4 of second between each click
		}
		//el_to_click.click();
		if (test_mode) console.log(el_to_click);		
	}
	else
	{
		if (window.self === window.top) // Otherwise window.history is executed in all iframes also and we go back 2 or more times
		{
			el_to_click = 1;
			// Did not find a button to click
			if (String(keyword).match(/^(back)$/i))
				window.history.back(); // Press browser back button
			if (String(keyword).match(/^(forward)$/i))
				window.history.forward(); // Press browser forward button
			else if (String(keyword).match(/^(homepage|home page)$/i))
				window.location.href = "//about:newtab"; // Goes to //about:blank instead!! and reload() after just reloads current page!
			else if (String(keyword).match(/^(reload|refresh)$/i))
				window.location.reload();
			else
				el_to_click = null;
		}
	}
	
	
	//} // end all_doms for loop
}


function enter_key(keyword)
{
	var el = document.activeElement;
	var text = "\n";
	var times = 1;
	
	if (Array.isArray(keyword))
	{
		for (var a = 0; a < keyword.length; a++)
		{
			if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);
		}	
	}
	
	// If element is IFRAME get the activeElement on the iframe
	if (el.nodeName == "IFRAME")
		el = el.contentWindow.document.activeElement;
	
	if (test_mode) console.log(el);	
		
	for (var i = 0; i < times; i++)
	{
		if (el.isContentEditable)
		{
			text = linebreak(text); // Add P tag to 'New Paragrah' and br tag to 'New Line'
			//console.log(text);
			//insertTextAtCursor(text); // This one didn't work with html nor did it move the caret to the end.
			//pasteHtmlAtCaret(text);
			
			document.execCommand("InsertHTML", false, "\n<br>&nbsp;"); // \n is for capitalizing the next line with capitalize() function
			//keypress_inject(13);
			// All this garbage below to make it scroll to the cursor after "<br>"
			selection = window.getSelection();
			selection.modify("extend", "backward", "character");
			scrollToCursor(el);
			keypress(13); // Version 1.0.4 - Was keypress_inject(13)
			//setTimeout(function() { document.execCommand("delete"); }, 250);*/
			
			// All this garbage below to make it scroll to the cursor after "<br><br>"
			/*var event = document.createEvent('TextEvent'); // Does not save undo history without clicking somewhere with mouse
			event.initTextEvent('textInput', true, true, null, String.fromCharCode(13));
			el.dispatchEvent(event);*/
		}
		else if (isTextInput(el))
		{
			var mutation_record = mutation_num;
			if (test_mode) console.log(mutation_record);
			keypress(13); // Version 1.0.4 - Was keypress_inject(13)
			
			if (el.nodeName == "TEXTAREA")
			{
				//insertTextAtCaret(el, text);
				document.execCommand("InsertHTML", false, text);
				if (lastLetter(el) != "\n") // For some reason InsertHTML will not send \n the VERY first time we try it!
					document.execCommand("InsertHTML", false, text); // So send the \n again	
				el.blur(); el.focus(); // Otherwise InsertHTML does not scroll to the cursor position, but this prevents gmail recipient field from showing suggestions unless we do it before insertHTML
			}
			else // if input element
			{
				setTimeout(function(){ 
					if (test_mode) console.log(mutation_num);
					//if (mutation_num == mutation_record) // The mutations have not advanced so the enter key did nothing  - Version 0.99.7 - Commented out so "Press enter" submits at google.com
						if (isSearch(el)) 
							submit_form(); // So try submitting a form
						else switch_fields("next"); // tab to next field
							
				}, 250);
				//if (isSearch(el)) submit_form();
			}
		}
		else // click every other element
		{
			/*scrollToPosition(el);
			el.focus();
			highlight_element(el);*/
			setTimeout(function(){ 
				//el.click();
				var mutation_record = mutation_num;
				if (test_mode) console.log(mutation_record);
				keypress(13); // Version 1.0.4 - Was keypress_inject(13)
				setTimeout(function(){ 
					if (test_mode) console.log(mutation_num);
					if (mutation_num == mutation_record) // The mutations have not advanced so the enter key did nothing  
						el.click(); // So try clicking element
					// But in chrome the enter key does not select checkboxes so should we not click??
				}, 250);
				/* Gmail "Compose" button only works on "mouseup" event */
				/*var event = document.createEvent('MouseEvents');
				event.initEvent("mousedown", true, false); // try (click|mousedown|mouseup), bubble, cancelable
				el.dispatchEvent(event);
				event = document.createEvent('MouseEvents');
				event.initEvent("click", true, false); // try (click|mousedown|mouseup), bubble, cancelable
				el.dispatchEvent(event);
				event = document.createEvent('MouseEvents');
				event.initEvent("mouseup", true, false); // try (click|mousedown|mouseup), bubble, cancelable
				el.dispatchEvent(event);*/
			}, 250);
			//el.click();
		}			
	}
}


function spacebar(keyword)
{
	var el = document.activeElement;
	var text = " ";
	var times = 1;
	
	if (Array.isArray(keyword))
	{
		for (var a = 0; a < keyword.length; a++)
		{
		if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);
		}	
	}
	
	// If element is IFRAME get the activeElement on the iframe
	if (el.nodeName == "IFRAME")
		el = el.contentWindow.document.activeElement;
	
	for (var i = 0; i < times; i++)
	{
		if (el.isContentEditable || isTextInput(el))
		{
			keypress(32); // Version 1.0.4
			//document.execCommand("InsertHTML", false, text);
		}
		else // click every other element
		{
			var mutation_record = mutation_num;
			if (test_mode) console.log(mutation_record);
			keypress(32); // Version 1.0.4 - Was keypress_inject
			setTimeout(function(){ 
				if (test_mode) console.log(mutation_num);
				if (mutation_num <= (mutation_record+1)) // The mutations have not advanced so the spacebar did nothing // Version 1.04 - Added +1
				{ 
					scrollToPosition(el);
					el.focus();
					highlight_element(el);
					el.click();
				}
			}, 250);
			//el.click();	
		}	
	}
	if (test_mode) console.log(el);	
}

function backspace(keyword)
{
	var el = document.activeElement;
	var text = " ";
	var times = 1;
	
	if (Array.isArray(keyword))
	{
		for (var a = 0; a < keyword.length; a++)
		{
		if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);
		}	
	}
	
	// If element is IFRAME get the activeElement on the iframe
	if (el.nodeName == "IFRAME")
		el = el.contentWindow.document.activeElement;
		
	for (var i = 0; i < times; i++)
	{
		keypress(8); // Version 1.0.4 - was keypress_inject(8)
		
		if (el.isContentEditable || isTextInput(el))
		{
			send_command("delete");
			//window.getSelection().modify("extend", "backward", "character");
			//selection = window.getSelection().baseNode.data.slice(0, -1);
		}	
	}
}


function escape_key(keyword)
{
	var el = document.activeElement;
	var text = " ";
	var times = 1;
	
	if (Array.isArray(keyword))
	{
		for (var a = 0; a < keyword.length; a++)
		{
		if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);
		}	
	}
	
	// If element is IFRAME get the activeElement on the iframe
	if (el.nodeName == "IFRAME")
		el = el.contentWindow.document.activeElement;
		
	for (var i = 0; i < times; i++)
	{
		keypress(27); // Version 1.0.4 - Was keypress_inject(27)
	}
}


function select(keyword)
{
	var direction = "backward";
	var times = 1;
	var option = "all";
	var alter = "extend"; // Select text as you move the cursor
	selection = window.getSelection();//get the selection object (allows you to change selection)
	if (Array.isArray(keyword))
	{
		if (keyword.length <= 0) option = "all";
		for (var a = 0; a < keyword.length; a++)
		{ 
			if (String(keyword[a]).match(/^(last|previous|.ltimo|anterior|letzte|zur.ck)/i))
				direction = "backward";
			else if (String(keyword[a]).match(/^(next|siguiente)/i))
				direction = "forward";
			else if (String(keyword[a]).match(/^(text|field|box|all|tod[ao]s?|texto|campo|Bereich)/i))
				option = "all";	
			else if (String(keyword[a]).match(/^(none|nothing|ninguno|nada|no)/i))
				option = "none"; 
			else if (String(keyword[a]).match(/^(character|letter|car.cter|letra|Zeichen|Buchstaben)/i))
				option = "character";	
			else if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);
			else if (String(keyword[a]).match(/^(word|palabra|Wort)/i))
				option = "word";
			else if (String(keyword[a]).match(/^(sentence|oraci.n|Satz)/i))
				option = "sentence";	
			else if (String(keyword[a]).match(/^(paragraph|p.rrafo|Absatz)/i))
				option = "paragraph";
			else if (String(keyword[a]).match(/^(line|l.nea|Linie)/i))
				option = "line";
			console.log(option);
		}
		if (test_mode) keyword = keyword[0];	
	}
	else option = keyword;
	
	if (option.match(/^all$/))
	{
		document.execCommand('selectAll',false,null);
	}
	else if (option.match(/^(none|nothing)$/))
	{
        selection.collapseToEnd();
		//selection.removeAllRanges();//remove any selections already made
	}
	else
	{
		for (i = 0; i < times; i++)
		{
			selection.modify(alter, direction, option);
		}
	}
	
}


function clipboard(keyword)
{
	if (Array.isArray(keyword))
	{
		keyword = keyword[0];	
	}
	else option = keyword;
	
	if (keyword.match(/^(copy|coffee|copiar|Kopieren|Kopiera|copia)/))
	{
		if (!document.queryCommandEnabled("copy")) // If it returns false then no text is selected
			document.execCommand('selectAll'); // so select all the text in the current element
    
		if (window.self === window.top) // Version 0.99.8 - Copy only in top frame not iframes. Because Google Adsense changed something in their iframes?
			document.execCommand("copy", false, null); // permissions: [ "clipboardWrite" ] in manifest.json
	}
	else if (keyword.match(/^(paste|pegar|Einf|klistra|incolla)$/))
	{
		document.execCommand("paste", false, null); // permissions: [ "clipboardRead" ] in manifest.json
	}
	else if (keyword.match(/^(cut|cortar|Ausschneiden|klipp|taglia)$/))
	{
		document.execCommand("cut", false, null); // permissions: [ "clipboardWrite" ] in manifest.json
	}
}


function clear_text(keyword)
{
	var el = document.activeElement;
	// Can element accept input?
	if ( (!el.isContentEditable && !isTextInput(el)) || !isVisible(el) )
		el = findElement(el, document); // If not then find one that can
	
	document.execCommand("selectAll", false, null); 
	document.execCommand("delete"); // Preserves undo, but SelectAll above is a second undo
	
	//if (el.isContentEditable) el.innerHTML = ""; // Does not preserve undo history
	//else if (isTextInput(el)) el.value = ""; // Does not preserve undo history
}


function moveCursor(keyword)
{
	var direction = "up";
	var times = 1;
	var option = "times";
	var alter = "extend"; // Select text as you move the cursor
	if (Array.isArray(keyword))
	{
		if (keyword.length <= 0) option = "up";
		for (var a = 0; a < keyword.length; a++)
		{
			if (String(keyword[a]).match(/^(up|left|right|write|down|end|and|start|home|top|bottom|inicio|fin|arriba|abajo|derecha|izquierda|oben|unten|links|rechts)/i))
				direction = String(keyword[a]);
			else if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);
			else if (String(keyword[a]).match(/^(time|line|word|character|space|letter|sentence|paragraph|box|text|field)/i))
				option = keyword[a];
		}
		keyword = keyword[0];	
	}
	else direction = keyword; // Version 0.99.7
	
	var selection = window.getSelection();
	if (selection.isCollapsed) // Just a cursor no text selected (this seems to always return true even when these is a selection)
		alter = "move"; // Just move the cursor with no selection of text	
	if (test_mode) console.log(alter, selection.isCollapsed);
	for (i = 0; i < times; i++)
	{
		if (direction.match(/^(up|arriba|Oben)$/i))
		{
			keypress_inject(38);
			selection.modify(alter, "backward", "line");
		}
		else if (direction.match(/^(down|abajo|Unten)$/i))
		{
			keypress_inject(40);
			selection.modify(alter, "forward", "line");
		}
		else if (direction.match(/^(home|start|top|inicio)/i))
		{
			if (option.match(/word|paragraph|sentence/i)) option = option;
			else if (option.match(/box|text|field/i) || direction.match(/top/i)) 
				option = "documentboundary";
			else option = "lineboundary";
			keypress_inject(36);
			selection.modify(alter, "backward", option);
		}
		else if (direction.match(/^(end|and|bottom|fin)/i))
		{
			if (option.match(/word|paragraph|sentence/i)) option = option;
			else if (option.match(/box|text|field/i) || direction.match(/bottom/i)) 
				option = "documentboundary";
			else option = "lineboundary";
			keypress_inject(35);
			selection.modify(alter, "forward", option);
		}
		else if (direction.match(/^(left|izquierda|links)$/i))
		{
			if (option.match(/word|paragraph|sentence/i)) option = option;
			else if (option.match(/character|space|letter/i)) option = "character";
			else option = "word";
			keypress_inject(37);
			selection.modify(alter, "backward", option);
		}
		else if (direction.match(/^(right|write|derecha|rechts)$/i))
		{
			if (option.match(/word|paragraph|sentence/i)) option = option;
			else if (option.match(/character|space|letter/i)) option = "character";
			else option = "word";
			keypress_inject(39);
			selection.modify(alter, "right", option);
		}
	}
	
	if (window.getSelection() && window.getSelection().rangeCount > 0) // this if so google maps can scroll with "Press up arrow key". Say "Click on map" first
		scrollToCursor(document.activeElement);
}


function scroll_it(keyword)
{
	/* This function looks for elements in the current screen view
		and scrolls them in the direction specified. If they are 
		already scrolled all the way then we go to the parent elements
	*/	
	var all_the_way = false;
	var option = "scroll";
	var leeway = 100; // Chrome's leeway changes with the browser height but at full screen it is about 110 pixels
	var direction = keyword;
	if (Array.isArray(keyword)) 
	{
		for (var a = 0; a < keyword.length; a++)
		{
			if (String(keyword[a]).match(/^(up|left|right|write|down|end|and|start|home|top|bottom|arriba|abajo|izquierda|derecha|cima|top|final|oben|unten|links|rechts|Anfang|su|giù|sinistra|destra|inizio|inizio|fine|fondo)/i))
				direction = String(keyword[a]);
			if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);
			if (String(keyword[a]).match(/^scroll/i))
				option = "scroll";
			if (String(keyword[a]).match(/^page/i))
				option = "page";
			if (String(keyword[a]).match(/^all|top|bottom|cima|final|end|Anfang|tutto|tutta/i))
				all_the_way = true;
		}
		keyword = keyword[0];
	}
	var dom = document.body; // start under body this time
	var el = document.activeElement;
	var all_elems = dom.getElementsByTagName("*");
	var traverse = "parents"; // keep looking for element to scroll?
	elem = el;
	/* If the current active element isScrollable then just scroll it
	 	If not then try a parent. If parents are still not then try the children.
	 	If the option is "scroll" then do the opposite. Skip the body and do the children.
	*/
	if (option.match(/^scroll/i))
	{
		if (el == document.body)
		{
			traverse = 0;
			elem = all_elems[traverse];	
		}
	}
	if (test_mode) console.log(elem); 
	//debugger;
	while (elem)
	{
		if (isScrollable(elem) && (isVisible(elem) && isOnScreen(elem) == true || elem == document.body || elem == document.documentElement))
		{
			if (test_mode) console.log(elem);
			if (direction.match(/^(up|top|start|arriba|cima|oben|su|inizio)/i))
			{
				//if (elem.scrollTop > 0)
				{
					var scrollTop = elem.scrollTop; // record current scrollTop
					if (elem == document.body)
						elem.scrollTop -= window.innerHeight - leeway;
					else
						elem.scrollTop -= elem.clientHeight - leeway;
					if (direction.match(/^(top|start|inizio)/i) || all_the_way == true)
						elem.scrollTop = 0; 
					if (elem.scrollTop != scrollTop) // If it equals recorded scrollTop then it did not move
						break;
				}			
			}
			else if (direction.match(/^(down|end|bottom|abajo|final|unten|giù|fine|fondo)/i))
			{
				//if (elem.scrollTop < (elem.scrollHeight - elem.clientHeight))
				{
					var scrollTop = elem.scrollTop; // record current scrollTop
					if (elem == document.body)
						elem.scrollTop += window.innerHeight - leeway;
					else
						elem.scrollTop += elem.clientHeight - leeway;
					if (direction.match(/^(end|bottom|fine|fondo)/i) || all_the_way == true)
						elem.scrollTop = elem.scrollHeight; 	
					if (elem.scrollTop != scrollTop) // If it equals recorded scrollTop then it did not move		
						break;
				}
			}
			if (direction.match(/^left|start|izquierda|links|sinistra/i))
			{
				//if (elem.scrollLeft > 0)
				{
					var scrollLeft = elem.scrollLeft; // record current scrollTop
					if (elem == document.body)
						elem.scrollLeft -= window.innerWidth - leeway;
					else
						elem.scrollLeft -= elem.clientWidth - leeway;
					if (direction.match(/^start/i) || all_the_way == true)
						elem.scrollLeft = 0; 
					if (elem.scrollLeft != scrollLeft) // If it equals recorded scrollLeft then it did not move
						break;
				}			
			}
			else if (direction.match(/^right|write|end|derecha|rechts|destra/i))
			{
				//if (elem.scrollLeft < (elem.scrollWidth - elem.clientWidth))
				{
					var scrollLeft = elem.scrollLeft; // record current scrollTop
					if (elem == document.body)
						elem.scrollLeft += window.innerWidth - leeway;
					else
						elem.scrollLeft += elem.clientWidth - leeway;
					if (direction.match(/^end/i) || all_the_way == true)
						elem.scrollLeft = elem.scrollWidth; 
					if (elem.scrollLeft != scrollLeft) // If it equals recorded scrollLeft then it did not move			
						break;
				}
			}
		}
		if (traverse == "parents")
		{
			// We didn't break so try a parent
			if (elem.parentElement) 
				elem = elem.parentElement;
			else
			{
				// Went through parents without finding element to scroll. So let's try children of document
				traverse = 0;
				elem = el.children[traverse];		
			}
		} 
		else 
		{
			traverse++;
			if (traverse < all_elems.length)
				elem = all_elems[traverse]; 
			else if (option.match(/^scroll/i) && elem != document.body && elem != document.documentElement) // try to scroll the body last
				elem = document.scrollingElement; // Version 0.99.7 - Was document.body but did not scroll in stackoverflow. Also added document.documentElement to line above and 2131
			else
				break;
		}
	}
	// Need to blur a textarea if it was active but now the body is scrolling
	if (elem == document.body && document.body != document.activeElement)
		document.activeElement.blur();
		
	if (test_mode) { console.log(elem); console.log("Top Before:"+scrollTop+" Top After:"+elem.scrollTop); }
}


function isScrollable(el)
{
	/* This function will determine if an element is scrollable vertically or horizontally */
	var scrollable = false;
	/* clientWidth and clientHeight is the visible width and height of an elements contents.
		The value does not include the scrollBar, border, and the margin.
		scrollWidth and scrollHeight is the total width of the elements contents including
		the visible part and the non-visible part. The value does not include the scrollBar, 
		border, and the margin.
	*/
	if (el == document.body && (el.scrollHeight > window.innerHeight || el.scrollWidth > window.innerWidth))
		scrollable = true;
	if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)
		scrollable = true;
	/* the above did NOT work. For some reason on one of my TDs it had scrollHeight of 936
		and clientHeight of 934. But there were no scrollbars! So the only method that
		works is to try to set the scrollTop and ScrollLeft and see if it takes
	*/
	if (el.scrollTop == 0 && el.scrollLeft == 0)
	{
		// Record values
		var scrollTop = el.scrollTop;
		var scrollLeft = el.scrollLeft;
		// try to change value
		el.scrollTop = 1;
		el.scrollLeft = 1;
		if (el.scrollTop == 1 || el.scrollLeft == 1)
			scrollable = true;
		// Put scrolling back
		el.scrollTop = scrollTop;
		el.scrollLeft = scrollLeft;
	}
	else
		scrollable = true;
	/* overflow specified in CSS can't be determined with style.overflow. So we must use
		getComputedStyle. If either overflow-x or overflow-y is hidden but not the other
		then overflow will not be hidden. But if both overflow-x and overflow-y are hidden
		then overflow will be hidden. So we only need to check "overflow".
	*/
	if (document.defaultView.getComputedStyle(el,null).getPropertyValue("overflow") == "hidden")
		scrollable = false;
	
	return (scrollable);
}


function scrollToCursor(el)
{
	var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
	/* The following lines make the contenteditable div or textarea scroll to where the text was inserted
		Otherwise the text will start flowing below the visible part of the div */
	if (isTextInput(el)) // textarea or input
	{
		//el.blur(); el.focus(); // This scrolls to the cursor
		/* Blurring and focus is the only thing that scrolls to the cursor in textarea or input
			however the blur part will cause some textareas to submit such as realvolve notes.
			So we need to copy the textarea into a pre to find the cursor position
		*/
		if (document.getElementById("pre-mirror"))
			var pre = document.getElementById("pre-mirror");
		else
			var pre = document.createElement("pre"); // Version 0.98.7 - 5/18/2017 - Bug: Had "pre-mirror" here
		
		pre.id = "pre-mirror";
		
		var the_text = el.value; // All the text in the textarea
		var position = el.selectionEnd; // Cursor position in characters		
		
		var completeStyle = window.getComputedStyle(el, null).cssText; // Copy the complete style
		pre.style.cssText = completeStyle; // Everything copies fine in Chrome	
		
		pre.style.position = "absolute";
		pre.style.visibility = "hidden";
		pre.style.left = Math.round(el.getBoundingClientRect().left + scrollLeft) + "px"; // Version 0.99.2
		pre.style.top = Math.round(el.getBoundingClientRect().top + scrollTop) + "px"; // Version 0.99.2
			
		// replace <>" with entities
		the_text = the_text.replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); 			
		pre.textContent = the_text.substring(0, position); // Insert text up to cursor position
		
		//el.parentNode.insertBefore(pre, el.nextSibling); // insert pre after textarea
		document.body.appendChild(pre);
		
		// Insert blank span to get position as cursor
		var cursor_span = document.createElement('span');
		cursor_span.textContent = "|";
		pre.appendChild(cursor_span);
		
		// Now insert the rest of the text in a span element at the end in case of word wrapping
		var span_mirror = document.createElement('span');
		span_mirror.textContent = the_text.substring(position) || '.';
		pre.appendChild(span_mirror);
		
		//Set scrollTop to the same place
		pre.scrollTop = el.scrollTop;
		// Set scrollLeft to same place
		pre.scrollLeft = el.scrollLeft;
		
		var cursorRect = cursor_span.getBoundingClientRect(); // Get cursor position from cursor_span
		
		if (test_mode) console.log (cursorRect);
	}
	else // if contentEditable div
	{	
		if (window.getSelection() && window.getSelection().rangeCount > 0)
			var cursorRect = window.getSelection().getRangeAt(0).getBoundingClientRect();
		else
			var cursorRect = el.getBoundingClientRect();
		if (test_mode) console.log (cursorRect);
		if (test_mode) console.log (window.getSelection().rangeCount);
	}	
		
	//for (var elem = el; elem; elem = elem.parentElement) // Version 0.99.2 - Commented out parents
	elem = el; // Version 0.99.2 - Just scrolling to cursor in activeElement because of problem with stackoverflow textarea
	{
		var elRect = elem.getBoundingClientRect();
		if (test_mode) console.log (elem);
		if (test_mode) console.log (elRect); // Version 0.98.7 - Forgot to add if (test_mode)
		//if (test_mode) console.log ("scrollHeight: "+elem.scrollHeight+", clientHeight: "+elem.clientHeight+", offsetHeight: "+elem.offsetHeight);
		// elRect.height = element height including scrollbar; el.clientheight = element height without scrollbar
		if (cursorRect.bottom > elRect.bottom && elRect.height > 0) // If cursor is below the current scroll of element 
			elem.scrollTop = elem.scrollTop + (cursorRect.bottom-elRect.bottom) + (elRect.height-el.clientHeight);
		else if (cursorRect.top < elRect.top && elRect.height > 0) // If cursor is above the current top of the element
			elem.scrollTop = elem.scrollTop - (elRect.top-cursorRect.top);
		// elRect.width = element width including scrollbar; el.clientWidth = element width without scrollbar
		if (cursorRect.right > elRect.right) // If cursor is to the right of the current scroll of element 
			elem.scrollLeft = elem.scrollLeft + (cursorRect.right-elRect.right) + (elRect.width-el.clientWidth);
		else if (cursorRect.left < elRect.left) // If cursor is to the left of the left side of the element
			elem.scrollLeft = elem.scrollLeft - (elRect.left-cursorRect.left);
	}
}


function redo(keyword)
{
	var times = 1;
	
	if (Array.isArray(keyword))
	{
		if (keyword.length <= 0) option = "redo";
		else keyword = keyword[0]; // version 0.99.7
		for (var a = 0; a < keyword.length; a++)
		{	
			if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);		
		}	
	}
	
	for (i = 0; i < times; i++)
		send_command("redo");
}


function undo(keyword)
{
	var option = "undo";
	var direction = "backward";
	var times = 1;
	if (test_mode) console.log("keyword: "+keyword); // Version 1.0.1 - Added if (test_mode)
	if (test_mode) console.log(typeof keyword);
	if (Array.isArray(keyword))
	{
		if (keyword.length <= 0) option = "undo";
		//else keyword = keyword[0]; // Version 0.99.7 // Version 1.2.9 - Removed because it was making "delete last word" into "delete last"
		for (var a = 0; a < keyword.length; a++)
		{
			if (String(keyword[a]).match(/^last|previous|next/i))
				direction = "backward";
			else if (String(keyword[a]).match(/^next/i))
				direction = "forward";	
			else if (!isNaN(keyword[a])) // if is a number
				times = parseInt(keyword[a]);
			else if (String(keyword[a]).match(/^(word|sentence|character)$/i))
				option = String(keyword[a]);
			else if (String(keyword[a]).match(/^(letter)$/i))
				option = "character";
				
		}	
	}
	
	var selection = window.getSelection();

	for (i = 0; i < times; i++)
	{
		if (option.match(/^undo/i))
			send_command("undo");
		else 
		{
			selection.modify("extend", direction, option);
			document.execCommand("delete");
			if (!option.match(/^character/i))
				document.execCommand("delete"); // Delete one more time to remove &nbsp;
		}
	}
}


function display_speech(el, text)
{
	if (test_mode) console.log(el);
	// If element is IFRAME get the activeElement on the iframe
	if (el.nodeName == "IFRAME")
		try {
			el = el.contentWindow.document.activeElement; // Blocked a frame with origin "http://jsfiddle.net" from accessing a cross-origin frame.
		} catch (err) { 
			if (test_mode) console.log(err);
		}
	if (document.activeElement.className.match(/docs-texteventtarget-iframe/i)) // Version 1.0.9 - Changed from == to .match because Google added another class to the element
	//if (el.hasAttribute("aria-label") && el.getAttribute("aria-label") == "Document content")
	{ // Google Docs iFrame - Version 0.99.2
		copyStringToClipboard(text); // Version 0.99.2
		//stringToKeypress(text);
		//document.activeElement.contentWindow.document.execCommand("paste", false, null);

		//processGoogleDoc(text);
		return;
	}
	// Can element accept input?
	// tinyMCE tries to select other fields // Verison 0.99.6
	if (!el.className.match(/cp_embed_iframe|mce/) && !el.id.match(/result-iframe|mce/) && !sra.settings.disable_autofocus) 
	if (!sra.settings.tts_speaking) // Version 1.2.0
	if ( (!el.isContentEditable && !isTextInput(el)) || !isVisible(el) )
		el = findElement(el, document); // If not then find one that can
	
	if (!el.className.match(/cke_editable/) && !el.className.match(/^mce/))
		text = capitalize(el, text); // Possibly put a capital for the first letter of the text string
	
	// Version 1.0.4 - facebook chat box messes up if we use InsertHTML without doing a textInput of the first letter
	if (window.location.href.match(/facebook.com|messenger.com/i) && el.textContent == "") {
		var firstChar = text.charAt(0);
		var textEvent = document.createEvent('TextEvent');
    	textEvent.initTextEvent('textInput', true, true, null, firstChar);
		el.dispatchEvent(textEvent);
		text = text.substring(1); // cut off firstChar from text
	}
	
	if (el.isContentEditable)
	{
		text = linebreak(text); // Add P tag to 'New Paragrah' and br tag to 'New Line'
		//console.log(text);
		//insertTextAtCursor(text); // This one didn't work with html nor did it move the caret to the end.
		//pasteHtmlAtCaret(text); // Works with html and text, but does not allow undo after
		var sent = document.execCommand("InsertHTML", false, text); // Kind of works with html and allows undo after. Just problems with new paragraphs and new lines
		// Version 1.0.1 - The following keypress event stops Word Online from messing up! But what about other elements?
		if (test_mode) console.log("Sent: "+sent);
		var keyCode = 00;
		eventObj = document.createEvent("Events");
	 	eventObj.initEvent("keypress", true, true);
	 	eventObj.keyCode = keyCode;
	    eventObj.which = keyCode;
	    eventObj.charCode = keyCode;
	    el.dispatchEvent(eventObj);
		if (!sent) {	
			// Verison 0.99.6 - Added support for tinyMCE and CKEditor
			var actualCode = '(' + function(text) {
			    document.execCommand("InsertHTML", false, text);
			    var cap = false; // Should first letter be capitalized?
				var space = false; // Should a space be added to the beginning of the text
				var first_char = /\S/;
			    
				if (typeof CKEDITOR != "undefined") {
					var e = CKEDITOR.instances[Object.keys(CKEDITOR.instances)[0]];
					var r = e.getSelection().getRanges()[ 0 ];
					r.collapse( 1 );
					r.setStartAt( ( r.startPath().block || r.startPath().blockLimit ).getFirst(), CKEDITOR.POSITION_AFTER_START );
					var docFr = r.cloneContents();
					var lastLetter = docFr.getHtml().slice(-1);
					console.log(docFr.getHtml());
					if (lastLetter.match(/[\n\.!\?;]/)) // Version 1.0.1 - Added ; to capitalize after "new line" because &nbsp; is last letter
						cap = true;
					if (lastLetter.match(/[\.!\?\w]/))
						space = true;
					if (cap == true)
						text = text.replace(first_char, function(m) { return m.toUpperCase(); }); // Capitalize first letter
						/* Note: Above we are capitalizing first letter found not first character because
						speech recognition may have returned /n or /n/n as the first characters */
					if (space == true && !text.match(/^[ \n\.!\?,]/)) // if there is not already a space or .!?, at beginning of string
						text = " "+text; // Add space to beginning of text
					CKEDITOR.instances[Object.keys(CKEDITOR.instances)[0]].insertHtml(text);
				}
				else if (typeof tinyMCE != "undefined") {
					//console.log("tinyMCE");
					var startOffset = tinyMCE.activeEditor.selection.getRng(1).startOffset;
					var lastLetter = tinyMCE.activeEditor.selection.getRng(1).startContainer.textContent.charAt(startOffset-1);
					if (lastLetter.match(/[\n\.!\?]/) || startOffset <= 1)
						cap = true;
					if (lastLetter.match(/[\.!\?\w]/))
						space = true;
					if (cap == true)
						text = text.replace(first_char, function(m) { return m.toUpperCase(); }); // Capitalize first letter
						/* Note: Above we are capitalizing first letter found not first character because
						speech recognition may have returned /n or /n/n as the first characters */
					if (space == true && !text.match(/^[ \n\.!\?,]/)) // if there is not already a space or .!?, at beginning of string
						text = " "+text; // Add space to beginning of text
					//console.log(lastLetter);
					tinyMCE.execCommand('mceInsertContent',false,text);
				}
			} + ')(' + JSON.stringify(text) + ');';
			var script = document.createElement('script');
			script.textContent = actualCode;
			(document.head||document.documentElement).appendChild(script);
			script.remove();
		}	
		//keypress(el, 74); // 74 = j, 39 = right arrow
		scrollToCursor(el);
		scrollToPosition(el); // Version 1.0.2 // If we pasted speech in a textbox then it should be onscreen
		if (test_mode) console.log(el);	
		//document.execCommand("insertText", false, text); // Does not save undo history without clicking somewhere with mouse
		/*var event = document.createEvent('TextEvent'); // Does not save undo history without clicking somewhere with mouse
		event.initTextEvent('textInput', true, true, null, text);
		el.dispatchEvent(event); */
	}
	else if (isTextInput(el))
	{
		if (sra.settings.submit_search_fields && isSearch(el)) el.value = ""; // clear value if it is a search input
		//insertTextAtCaret(el, text);
		//document.execCommand("insertText", false, text); // Undo history does not work unless you click somewhere with a mouse
		//el.blur(); el.focus(); // Otherwise InsertHTML does not scroll to the cursor position, but this prevents gmail recipient field from showing suggestions unless we do it before insertHTML
		document.execCommand("InsertHTML", false, text); // Undo history works good
		if (text.match(/( *?)\n$/) && lastLetter(el) != "\n") // For some reason InsertHTML will not send \n the VERY first time we try it!
			document.execCommand("InsertHTML", false, "\n"); // So send the \n again
		//if (text.match(/\n$/))
		//	el.blur(); el.focus(); // Otherwise InsertHTML does not scroll to the cursor position
		//keypress(el, 74);
		scrollToCursor(el); 
		scrollToPosition(el); // Version 1.0.2 // If we pasted speech in a textbox then it should be onscreen
		// The next 3 lines do not preserve undo history without clicking somewhere else
		/* var event = document.createEvent('TextEvent'); 
		event.initTextEvent('textInput', true, true, null, text);
		el.dispatchEvent(event); */
		if (test_mode) console.log(el);		
	}
	
	//keypress(el);
	if (sra.settings.submit_search_fields && isSearch(el)) // See if element is input and part of a search form
		el.form.submit(); // submit form if settings.submit_search_fields is set to do so automatically
	
	for (var i = 0; i < el.attributes.length; i++) {
	    var attrib = el.attributes[i];
	    if (attrib.specified) {
	        //if (test_mode) console.log(attrib.name + " = " + attrib.value);
		}
	}
	if (test_mode) console.log(el.nodeName);
	// For Google's search box the opacity is 0; change it to 1
	if (el.style.opacity == 0) el.style.opacity = 1;
	//el.value += text;
	//document.activeElement.form.submit();
}

function send_command(cmd) {
	// send_command(cmd) created on 12/20/2017 - Version 0.99.6
	var sent = document.execCommand(cmd);
	if (test_mode) console.log("Cmd sent:"+sent);
	if (!sent) {
		// Inject code into head
		var actualCode = '(' + function(cmd) {
			    document.execCommand(cmd); 
				if (typeof CKEDITOR != "undefined") {
					CKEDITOR.instances[Object.keys(CKEDITOR.instances)[0]].execCommand(cmd);
					// Get list of CKEditor commands: CKEDITOR.instances[Object.keys(CKEDITOR.instances)[0]].commands 
					// All that works in SRA so far is undo, redo
				}
				else if (typeof tinyMCE != "undefined") {
					tinyMCE.execCommand(cmd);
					// List of tinyCME commands: http://archive.tinymce.com/wiki.php/TinyMCE3x:Command_identifiers
					// All that works in SRA so far is undo, redo, backspace|delete
				}
			} + ')(' + JSON.stringify(cmd) + ');';
			var script = document.createElement('script');
			script.textContent = actualCode;
			(document.head||document.documentElement).appendChild(script);
			script.remove();
	}
}


} // end if (typeof content_script_loaded === 'undefined')

var content_script_loaded = true;

