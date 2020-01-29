/* Simulate keypress in Google Docs 
	stringToKeypress(string) works if you paste the function in developer console
	and then run it. But it does not work in Google Docs with a chrome extension.
	Bewildered. But copyStringToClipboard(string) works in a chrome extension.

*/


function stringToKeypress(string) {

	for (var i = 0; i < string.length; i++) {
		var key = string.charCodeAt(i);
		if (key == 10) key = 13; // Convert "\n" to "\r"
		var keytype = (key == 13) ? 'keydown' : 'keypress'; // keydown is needed for enter key (13) "\r"
	
		var event = document.createEvent( 'KeyboardEvent' );
		event.initKeyboardEvent( keytype, true, true, null, 0, false, 0, false, key, 0 ); // Last field must be 0 for enter key to work
		// Force Chrome to not return keyCode of 0 when fired
		Object.defineProperty(event, 'keyCode', {
	    	get : function() {
	    		return key;
	    	}
	    }); 	
		// "which" is possibly needed for Firefox or Safari??
		Object.defineProperty(event, 'which', {
	    	get : function() {
	    		return key;
	    	}
	    });     
	  
		/*var event = document.createEvent('Event'); 
		event.initEvent(keytype, true, true); 
		event.keyCode = key;
		*/
		// Dispatch event on activeElement. <iframe class="docs-texteventtarget-iframe"> if cursor is in editor
		if (document.activeElement.nodeName == "IFRAME")
			document.activeElement.contentWindow.document.dispatchEvent( event );
		else 
			document.dispatchEvent( event );
	}
}


function processGoogleDoc(text) {
	//var googleDocument = googleDocsUtil.getGoogleDocument(); // Get all the text in the Google Doc
	//var previousText = googleDocument.previousText; // Get the text before the cursor
	//if (test_mode) console.log(previousText);
	//text = capitalize(el, text); // Possibly put a capital for the first letter of the text string
	console.log(document.activeElement);
	stringToKeypress(text);

}


function copyStringToClipboard (string) {
	var googleDocument = googleDocsUtil.getGoogleDocument(); // Get all the text in the Google Doc
	var previousText = googleDocument.previousText; // Get the text before the cursor
	var first_char = /\S/;
	string = string.replace(/\n/, "<br>"); // replace \n with html new line

	// Google Docs automatically capitalizes except for first line in document
	// But we may need to remove the space before the string
	var lastLetter = previousText[previousText.length -1];
	if (test_mode) console.log(lastLetter);
	if (previousText.length == 0 || lastLetter == "") {
		string = string.replace(/^ /, ""); // Remove space from beginning of text if it exists	
		string = string.replace(first_char, function(m) { return m.toUpperCase(); }); // Capitalize first letter
	}
	else if (!string.match(/^[ \n\.!\?,]/)) {
		string = " "+string; // Add space to beginning of text
		if (lastLetter.match(/^[\n\.!\?]/)) // Version 1.0.9
			string = string.replace(first_char, function(m) { return m.toUpperCase(); }); // Capitalize first letter // Version 1.0.1 - It wasn't here before? Confused am I.
	}
	// Get current clipboard data by adding eventListener and firing paste
	var clipboard_data;
	document.addEventListener('paste', function (evt) {
			  clipboard_data = evt.clipboardData.getData('text/html');
		});
	document.execCommand("paste", false, null); // to fire eventListener	
	
	// Put string in clipboard by firing copy and listening but preventing default copy
    function handler (event){
        event.clipboardData.setData('text/html', string);
        event.preventDefault();
        document.removeEventListener('copy', handler, true);
    }
    document.addEventListener('copy', handler, true);
    document.execCommand('copy');
    
    // Paste string into Google Docs iFrame
    document.activeElement.contentWindow.document.execCommand("paste", false, null);
    
    // Put previous cliboard data back into clipboard
    string = clipboard_data;
	document.addEventListener('copy', handler, true);
    document.execCommand('copy');
    
    
}
