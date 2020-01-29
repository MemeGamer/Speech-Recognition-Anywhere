sra.commands = [
	{ heading: "Built-In Web Speech API Commands" },
	{ speech: "Period", output: ".", },
	{ speech: "Dot", output: ".", },
	{ speech: "Question mark", output: "?", },
	{ speech: "Exclamation point|mark", output: "!", }, 
	{ speech: "Comma", output: ",", },
	{ speech: "Percent", output: "%", },
	{ speech: "New line", output: "\\n", },
	{ phrase: "^New line$", action: "enter_key()", }, /* Version 1.1.0 */
	{ speech: "New paragraph", output: "\\n\\n", },
	{ speech: "Smiley Face", output: ":-)", },
	{ speech: "Frowny Face", output: ":-(", },
	{ speech: "Sad Face", output: ":-(", },
	{ speech: "Kissy face", output: ":-*", },
	{ speech: "Wink wink", output: ";-)", },
	{ speech: "Hashtag", output: "#", },
	
	{ heading: "<span class='title'></span> Extra Commands", },
	{ speech: "Semicolon", output: ";", },
	{ speech: "Colon", output: ":", },
	{ speech: "Quote", output: '"', }, 
	{ speech: "Single quote", output: "'", },
	{ speech: "Apostrophe", output: "'", },
	{ speech: "Plus", output: "+", },
	{ speech: "Minus", output: "-", },
	{ speech: "Open parenthesis", output: "(", },
	{ speech: "Close parenthesis", output: ")", },
	{ speech: "Open bracket", output: "[", },
	{ speech: "Close bracket", output: "]", },
	
	{ heading: "Settings" },
	{ phrase : "^(?:switch |change |set )(?:the )?language to (.*?)$", action : "set_language(keyword)", 
		description: "<b>Switch|Change|Set</b> (the) <b>language to (spanish|english|etc)</b>" },
	{ phrase : "^(?:Turn )?(on|off|start|stop|enable|disable|activate)(?: *?)(?:dictation|speech to text)$" , action : "dictation(keyword)",
		description: "(Turn (on|off) |Start|Stop) <b>Dictation|Speech to text</b> (Only available in Full Version)" },
	{ phrase : "^(?:Turn )?(on|off|start|stop|enable|disable|activate)(?: *?)(?:auto punctuation)$" , action : "toggle_autop(keyword)",
		description: "(Turn (on|off) |Start|Stop) <b>Auto Punctuation</b> (Only available in Full Version)" },
		
	{ heading: "Music and Videos" },
	{ /* phrase : "^(play |listen to )(.*?)(?: *?)?(?:in |and )?(?:a )?(new tab)?$", action : "play(keyword)", */
		description: "<b>Play|Listen to</b> (title of artist, song or video)"},
	
	{ heading: "Tabs and Navigation" },
	{ phrase : "^(?:start |open )?(?:a )?new tab$", action : "url", 
		description: "(Start|Open) (a) <b>New Tab</b>" },
	{ phrase : "^(?:go to |open |start )(.*?\\.\\s?\\S{2,6})(?: *?)?(?:in |and )?(?:a )?(new tab)?$", action : "url(keyword)", /* Version 0.99.7 - Added \\s? */
		description: "<b>Go to|Open|Start</b> &nbsp;&nbsp;&nbsp; <b>anywebpage.com</b> (in a new tab)"}, /* Must escape . and S with two \\ */
	{ phrase : "^(switch|change) tab(s)?$", action : "switch_tabs(right)", 
		description: "(Switch|Change) <b>tab</b>(s)"},
	{ phrase : "^(next|previous|close|remove) tab$", action : "switch_tabs(keyword)", 
		description: "next|previous|close|remove <b>tab</b>" },
	{ phrase : "^(?:go |switch |change |click |select )(?:to |on |in )?(?:the )?(.*?) tab$", action : "switch_tabs(keyword)", 
		description: "Go to|Switch to|Change to|Click the|Select the <b>(nth|title of tab) tab</b>" },
	{ phrase : "^(?:go to )?(?:my |the )?(home(?: *?)?page)$", action : "url(keyword)",
		description: "(Go to (my|the)) <b>home page</b>", },
	{ phrase : "^(?:go )(?:back|to the previous page|to previous page|back to the previous page|back to previous page)$", action : "navigation(back)", 
		description: "<b>Go Back</b> (to (the) previous page)" },  
	{ phrase : "^(?:go )(?:forward)$", action : "navigation(forward)",
		description: "<b>Go forward</b>" },  
	{ phrase : "^(?:refresh|reload)(?: page)?$", action : "navigation(reload)", 
		description: "<b><b>Reload|Refresh</b> (page)</b>" }, 

	{ heading: "Screen Reader (Text-To-Speech)" },	
	{ phrase : "^Read (the )?(all|everything|page|webpage|paragraphs?|screen|article|website|site|main|content|alert|notifications?|status)$", action : "read(keyword)", 
		description: "<b>Read</b> <b>all|everything|page|webpage|paragraph|screen|article|website|site|main|content|alert|notification|status</b>" },
	{ phrase : "^Read (the )?(buttons?|inputs?|links?|hyperlinks?|web links?|images?|figures?|headings?|titles?|headlines?)( on screen)?$", action : "read(keyword)", 
		description: "<b>Read</b> <b>buttons|inputs|links|hyperlinks|web links|images|figures|headings|titles|headlines</b> (on screen)" },	
	{ phrase : "^Read (the )?(menu|navigation|header|banner|footer|contentinfo|sidebar|aside|complementary|complimentary)$", action : "read(keyword)", 
		description: "<b>Read</b> <b>menu|navigation|header|banner|footer|contentinfo|sidebar|aside|complementary</b>" },	
	{ phrase : "^Read (the )?(selected|highlighted|selection)(?: text)?$", action : "read(keyword)", 
		description: "<b>Read</b> <b>selection|selected|highlighted (text)</b>" },	
	{ phrase : "^(Stop|Pause|Resume|Unpause|Continue|Start) ?(?:reading|speaking|talking)?$", action : "stopSpeaking(keyword)", 
		description: "<b>Stop|Pause|Resume|Unpause|Continue|Start</b> &nbsp;&nbsp;&nbsp;&nbsp; (reading|speaking|talking) (Or press ESC)" },		

	{ heading: "Keys" },
	{ phrase : "^(press |click |price )?(?:the )?(enter|inter|presenter|in turkey|Uline|frozen turkey)(?: *?)(key)?(?: *?)(\\S*?)?(?: *?)(time|x)?(?:s)?$", action : "enter_key(keyword)",
		description: "(Press) (the) <b>Enter</b> (key) (n time(s))", },
	{ phrase : "^(press |click )?(?:the )?space(?: *?)(bar)?(key)?(?: *?)(\\S*?)?(?: *?)(time|x)?(?:s)?$", action : "spacebar(keyword)",
		description: "(Press) (the) <b>Space</b> (bar) (key) (n time(s))", },
	{ phrase : "^(press |pressed |click )?(?:the )?(?:backspace|delete)(?: *?)(key)?(?: *?)(\\S*?)?(?: *?)(time|x)?(?:s)?$", action : "backspace(keyword)",
		description: "(Press) (the) <b>Backspace|Delete</b> (key) (n time(s))", },
	{ phrase : "^(press |pressed |click )?(?:the )?(?:escape)(?: *?)(key)?(?: *?)(\\S*?)?(?: *?)(time|x)?(?:s)?$", action : "escape_key(keyword)",
		description: "(Press) (the) <b>Escape</b> (key) (n time(s))", },
	
	{ heading: "Undo/Redo" },
	{ phrase : "^(?:press |click )?(?:the )?(?:redo)(?: *?)(?:key)?(?: *?)(\\S*?)?(?: *?)(time|x)?(?:s)?$", action : "redo(keyword)",
		description: "(Press) (the) <b>Redo</b> (key) (n time(s))", },
	{ phrase : "^(?:press |click )?(?:the )?(undo|under)(?: *?)(?:key)?(?: *?)(\\S*?)?(?: *?)(time|x)?(?:s)?$", action : "undo(keyword)",
	 	description: "(Press) (the) <b>Undo</b> (key) (n time(s))", },
	{ phrase : "^(?:undo |under |erase |delete )(?:the )?(last|previous|next)?(?: *?)(\\S*?)?(?: *?)(word|sentence|character|letter)(?:s)?$", action : "undo(keyword)",
		description: "<b>Undo|Erase|Delete</b> (the) (last|previous|next) (n) <b>word|sentence|character|letter</b>(s)", },
	
	{ heading: "Arrow Keys and Cursor" },
	{ phrase : "^(?:press |pressed |price )?(?:the )?(home|end|up|down|left|right)(?: *?)(?:arrow )?(?:key)?(?: *?)(\\S*?)?(?: *?)(time|x)?(?:s)?$", action : "moveCursor(keyword)",
		description: "(Press) (the) <b>Home|End|Up|Down|Left|Right</b> (arrow) (key) (n time(s))", },
	{ phrase : "^(?:move |place |put )(?:the )?cursor (?:to |on |in |at )?(?:the )?(up|left|right|write|down|end|and|start|home|top|bottom)(?: *?)(?:by |of )?(\\S*?)?(?: *?)(?:the )?(time|x|line|word|character|space|letter|sentence|paragraph|box|text|field)?(?:s)?$", action : "moveCursor(keyword)",
		description: "<b>Move|Place|Put</b> (the) <b>Cursor</b> (to|on|in|at) (the) <b>up|left|right|down|end|start|home|top|bottom</b> (by|of) (n) (the) (time|line|word|character|space|letter|sentence|paragraph|box|text|field)(s)", },
	
	{ heading: "Edit" },
	{ phrase : "^(?:select |highlight )(?:to )?(?:the )?(last|previous|next|all|text|field|box|none|nothing)?(?: *?)(\\S*?)?(?: *?)(character|letter|word|sentence|paragraph|line)?(?:s)?$", action : "select(keyword)",
		description: "<b>Select|Highlight</b> (to) (the) (last|previous|next|all|text|field|box|none|nothing) (n) (character|letter|word|sentence|paragraph|line)(s)", },
	{ phrase : "^(?:deselect|unselect|unhighlight)( all)?$", action : "select(none)",
		description: "<b>Deselect|Unselect|Unhighlight</b> (all)", },
	{ phrase : "^(copy|coffee|cut|paste)$", action : "clipboard(keyword)",
		description: "<b>Copy|Cut|Paste</b>", },
	{ phrase : "^(clear|clearfield)(?: the)?(?: field| text| textarea| input| box| all| the)?(?: box| field| input| text)?$", action : "clear_text(keyword)",
		description: "<b>Clear</b> (the) (field|text|textarea|input|box|all)", },
	{ phrase : "^(?:find |search for )(.*?)$", action : "find_phrase(keyword)",
		description : "<b>Find</b> (word or phrase)", },
	
	{ heading: "Scrolling" },
	{ phrase : "^(?:press |pressed )?(scroll |page )(all the way )?(?:to )?(?:the )?(up|down|left|right|write|start|top|end|bottom)(?: *?)(?:key)?$", action : "scroll_it(keyword)",
		description: "<b>Scroll|Page</b> (all the way) (to the) <b>up|down|left|right|write|start|top|end|bottom</b>", },
	{ phrase : "^(?:press |pressed )?(scroll |page )(up|down|left|right)( all the way)?(?: *?)(?:to )?(?:the )?(start|top|end|bottom)(?: *?)(?:key)?$", action : "scroll_it(keyword)",
		description: "<b>Scroll|Page</b> &nbsp;&nbsp;&nbsp; <b>up|down|left|right</b> (all the way) (to) (the) <b>start|top|end|bottom</b>", },

	{ heading: "Forms, Buttons and Links" },
	{ phrase : "^(?:press |pressed |click )?(?:the )?(tab)(?: *?)?(?:key)?(?: *?)(\\S*?)?(?: *?)(?:time|x)?(?:s)?$", action : "switch_fields(keyword)",
		description: "(Press) (the) <b>tab</b> (key) (n time(s))", },
	{ phrase : "^(?:press |pressed |click )?(?:the )?(shift tab)(?: *?)(?:key)?(?: *?)(\\S*?)?(?: *?)(?:time|x)?(?:s)?$", action : "switch_fields(keyword)",
		description: "(Press) (the) <b>shift tab</b> (key) (n time(s))", },
	{ phrase : "^tab(?: *?)?(?:to )?(?:the )?(previous|left|up|app|backward|next|right|down|forward|for word|4 word)?(?:s|es)?(?: *?)(\\S*?)?(?: *?)(?:time|x)?(?:s)?$", action : "switch_fields(keyword)",
		description: "<b>Tab</b> (previous|left|up|app|backward|next|right|down|forward) (n time(s))", },
	{ phrase : "^(next|previous)(?: *?)?(?:field|input|box|element|selection|option|entry|area|button)?$", action : "switch_fields(keyword)",
		description: "<b>Next|Previous</b> (field|input|box|element|selection|option|entry|area|button)", },
	{ phrase : "^(?:go |switch |change |focus |tab )(?:to |on |in )?(?:the )?(.*?)?(?: *?)(form|field|input|box|element|selection|option|entry|area|link|button|switch)(?:s|es)?$", action : "switch_fields(keyword)",
		description: "<b>Go|Switch|Change|Focus|Tab</b> (to|on|in) (the) (<b>keyword</b>) <b>form|field|input|box|element|selection|option|entry|area|link|button|switch|textarea</b>", },
	{ phrase : "^(?:click |quick |press |check |uncheck )(?:to |on |in )?(?:the )?(.*?)(?: *?)?(button|link|box)?(\\d*?)?(?: more)?(?: time| x)?(?:s)?$", action : "click_keyword(keyword)",
		description: "<b>Click|Press|Check|Uncheck</b> (to|in|on) (the) (<b>keyword</b>) (button|link|box) (n time(s))", },
	{ phrase : "^(click|check|uncheck)$", action : "click_keyword(keyword)",
		description: "<b>Click|Check|Uncheck</b>", },
	{ phrase : "^(?:press |pressed |click )?(?:the )?(submit)(?: *?)(?:the )?(button|form)?$", action : "submit_form()",
		description: "(Click|Press) (the) <b>submit</b> (the) (button|form)", },
	
	{ heading: "Tooltips" },
	{ phrase : "^(add |show |hide |remove )(labels|tooltips)$", action : "add_labels(keyword)",
		description: "<b>Add|Show|Hide|Remove</b> &nbsp;&nbsp;&nbsp; <b>labels|tooltips</b>",  },
	

];

// Version 1.0.7 - Sometimes this was erasing the loaded custom_commands from storage.js in sra object if chrome.storage.get was faster than usual
if (!sra.hasOwnProperty("custom_commands")) { 
	sra.custom_commands = [
		{ phrase : "(Enter |type )?(my )?email( address)?", action : "john@email.com", description: "Type my email address", enable: true},
		{ phrase : "(Enter |type )?(my )?name", action : "John Smith", description: "Type my name", enable: true},
		{ phrase : "(Play|Listen to|Youtube) (.*?)", action : "url(http://www.google.com/search?btnI&q=youtube play $2, true)", description: "\"Play (title of song or video)\" using Youtube", enable: true},
	];
}

//sra.custom_commands = [];

// replace_words_obj is used in sr.js:replace_mistakes(speech) function
var replace_words_obj = {
	"okay" : " ok", "comma" : ",", "semicolon" : ";", "colon" : ":", "single quote ?" : "'", "quote ?" : '"',
	"apostrophe" : "'", "exclamation point" : "!", "plus" : "+", "minus" : "-",
	"equals" : "=", "clickstart" : "click start", "clickstop" : "click stop",
	// Version 1.2.0
	"open (parenthesis|parentheses) ?" : "(", "close (parenthesis|parentheses)" : ")",
	"open bracket ?" : "[", "close bracket" : "]",
	"ampersand" : "&", "asterisk" : "*",
 	/* Portuguese */
 	"Vírgula" : ",", "Ponto de interrogação" : "?", "Ponto de exclamação" : "!",
 	"Ponto e vírgula" : ";", "Dois pontos" : ":", "Aspas" : '"',
 	"Aspas simples" : "'", "Apóstrofo" : "'",
 	"ponto" : ".", "por cento" : "%", "nova linea" : "\n", "nova linha" : "\n",
 	"novo paragrafo" : "\n\n", "Novo parágrafo" : "\n\n", "Carinha sorriso" : ":-)",
 	"Carinha frustrada" : ":-(" , "Carinha triste" : ":-(", "Carinha de beijo" : ":-*", 
 	"Sinal de mais" : "+", "Sinal de menos" : "-", "Sinal de igual" : "=",
 	/* Spanish */
 	"punto" : ".", "Signo de interrogación" : "?", "Signo de exclamación" : "!",
 	"coma" : ",", "Nueva línea": "\n", "Nuevo párrafo" : "\n\n",
 	"Cara sonriente" : ":-)", "Cara de tristeza" : ":-(", "Cara triste" : ":-(",
 	"Cara de besos" : ":-*", "Guiño guiño" : ";-)", "Punto y coma" : ";",
 	"Dos puntos" : ":", "Comillas" : '"', "Comillas simples" : "'",
 	"Apóstrofe" : "'", "Signo de más" : "+", "Signo menos" : "-", "Signo de igual" : "=",
 	/* Italian */
	"punto e virgola": ";", 
	"punto interrogativo": "?", 
	"punto esclamativo": "!", 
	"periodo": ".", 
	"punto": ".", 
	"virgola": ",", 
	"per cento": "%", 
	"nuova linea": "\n", 
	"nuovo paragrafo": "\n\n", 
	"faccina sorridente": ":-)", 
	"faccina triste": ":-(", 
	"faccina bacio": ":-*", 
	"faccina occhiolino": ";-)", 
	"cancelletto": "#", 
	"due punti": ":", 
	"virgolette": '"', 
	"virgoletta": "'", 
	"apostrofo": "'", 
	"più": "+", 
	"meno": "-", 
	"uguale": "=",
 	/* French */
 	"Nouvelle ligne" : "\n",
	/* Czech */
	"Tečka": ".",
	"Otazník": "?",
	"Vykřičník": "!", 
	"Čárka": ",",
	"Procent": "%",
	"Nový řádek": "\n",
	"Nový odstavec": "\n\n",
	"Apostrof": "'",
	"Hvězdička": "*",
	/* Swedish */
	"Punkt": ".", 
	"Frågetecken": "?",
	"Utropstecken": "!", 
	// "Komma": ":", // Version 1.3.1 - Removed. Komma is a common word. Should have been a comma anyway
	"Procent": "%",
	"Ny rad": "\n",
	"Ny linje": "\n",
	"Nytt stycke": "\n\n",
	"Leende": ":-)",
	"Semikolon": ";",
	"Kolon": ":",
	"Citat": '"', 
	"Apostrof": "'",
	"Plustecken": "+",
	"Minustecken": "-",
	"Likamedtecken": "=",
};


var replace_obj = {
	"first" : 1, "second" : 2, "third" : 3, "3rd" : 3,
	"fourth" : 4, "4th" : 4, "fifth" : 5, "5th": 5, "v" : 5, "sixth" : 6, "6th" : 6,
	"seventh" : 7, "7th" : 7, "eighth" : 8, "8th" : 8, "ninth" : 9, "9th" : 9,
	"tenth" : 10, "10th" : 10, "eleventh" : 11, "11th" : 11, "twelfth" : 12, "12th" : 12,
	"thirteenth" : 13, "13th" : 13, "fourteenth" : 14, "14th" : 14, "fifteenth" : 15, "15th" : 15,
	"one" : 1, "two" : 2, "three" : 3, "four" : 4, "five" : 5, "six" : 6, "seven" : 7, "eight" : 8,
	"nine" : 9, "ten" : 10, "twice" : 2, "for" : 4, "to" : 2,
	"una" : 1, "dos" : 2, "tres" : 3, 
	"login" : "log in|login", "username" : "username|user name", "user id" : "userid|user id",
	"clothe" : "close", 
}


function command_search(speech)
{
	if (sra.settings.disable_commands) return(false); // 8/21/2017 - Version 0.98.9
	var cmd_list = "";
	//var speech = that.value;
	speech = speech.replace(/^ /, ""); // Remove space from beginning of text if it exists	
	var found = false;
	
	var re; // reg expression
	for (var i = 0; i < sra.commands.length; i++) // loop through commands
	{
		if (sra.commands[i].phrase)
		{
			//cmd_list += '<br>"'+sra.commands[i].phrase+'" : "'+sra.commands[i].action+'"';
			var phrase = sra.commands[i].phrase;
			re = new RegExp(phrase,'i'); // insensative case search: 'i'; beginning of string: ^
			var matches = speech.match(re);
			if (matches)
			{
				found = true; // We found a speech command. 
				if (test_mode) console.log(sra.commands[i].action);
				if (test_mode) console.log(JSON.stringify(matches));
				if (test_mode) console.log(sra.commands[i].action);
				if (sra.commands[i].action)
				{		
					var option;
					if (sra.commands[i].action.match(/\(/)) // If there is a (
					{
						option = sra.commands[i].action.split("(")[1].slice(0, -1); // switch_tabs(left) = "left"
						if (option == "keyword") {
							option = [];
							for (var a = 0; a < matches.length; a++)
							{
								if (a > 0 && matches[a] != null && matches[a] != "")
								{
									var keyword = matches[a];
									if (replace_obj.hasOwnProperty(keyword.toLowerCase()))
										keyword = replace_obj[keyword.toLowerCase()]; // Replace First or 1st with '1', etc...
									option.push(keyword);
								}
							}	
						}
						if (test_mode) console.log(option);
					}
						
					/*if (sra.commands[i].action.match(/switch_tabs/i)) 
						switch_tabs(option);
					else if (sra.commands[i].action.match(/url/i)) 
						url(option); */
					if (window[sra.commands[i].action.split('(')[0]])
						window[sra.commands[i].action.split('(')[0]](option);
					else
						send_to_content({ "command" : sra.commands[i].action.split('(')[0], "option" : option });	
					
					/*else if (sra.commands[i].action.match(/switch_fields/i)) 
						send_to_content({ "command" : "switch_fields", "option" : option });
					else if (sra.commands[i].action.match(/switch_focus/i)) 
						send_to_content({ "command" : "switch_focus", "option" : option });
					else if (sra.commands[i].action.match(/click_keyword/i)) 
						send_to_content({ "command" : "click_keyword", "option" : option });
					else if (sra.commands[i].action.match(/enter_key/i)) 
						send_to_content({ "command" : "enter_key"});
					else if (sra.commands[i].action.match(/spacebar/i)) 
						send_to_content({ "command" : "spacebar"}); */
				}
				break;
			}
		}
	}
	return(found);
}


function custom_command_search(speech)
{
	var new_tab = false;
	var cmd_list = "";
	//var speech = that.value;
	speech = speech.replace(/^ /, ""); // Remove space from beginning of text if it exists	
	var found = false; 
	var word_replace_found = false; // Version 1.2.6
	
	var re; // reg expression
	for (var i = 0; i < sra.custom_commands.length; i++) // loop through commands
	{
		if (sra.custom_commands[i].phrase && sra.custom_commands[i].enable && sra.custom_commands[i].action)
		{
			// if user said "in a new tab"
			if (speech.match(/new tab$/))
			{
				speech = speech.replace(/(?: in | and )?(?:a )?(new tab)?$/, "");
				new_tab = true;
			}
					
			//cmd_list += '<br>"'+sra.commands[i].phrase+'" : "'+sra.commands[i].action+'"';
			var phrase = sra.custom_commands[i].phrase;
			phrase = phrase.replace(/^\s*/g, ''); // Version 1.0.4 - Steve Axtell was putting " http:..." for action. Remove space
			var word_replace = (phrase.match(/^\\b.*?\\b$/)) ? sra.custom_commands[i].action : false; // Version 1.2.6 - if phrase starts and ends with \b
			if (sra.custom_commands[i].action.match(/replace_word/i)) {
				word_replace = sra.custom_commands[i].action.match(/replace_word\((.*?)\)/i); // Or can have action: replace_word(okay);
				if (word_replace && word_replace.length > 1) {
					word_replace = word_replace[1]; // Convert "replace_word(okay)" to "okay"
					phrase = "\\b(" + phrase + ")\\b"; // Version 1.2.9 - Added () to prevent "Custom command error: Invalid regular expression: /\btimes|*\b/: Nothing to repeat"
				}
			}
			//if (phrase.charAt(0) != "^") phrase = "^"+phrase; // Make sure phrase starts with ^
			//if (phrase.charAt(phrase.length-1) != "$") phrase = phrase+"$"; // Make sure phrase ends with $
			/* Version 1.2.6 - 3/4/2019 - phrase needs to be surrounded with ^( and )$ otherwise ^hi|hello$
				will match "hi there" and "well hello" without wanting it to. Also I found out that ^ and $ can be added even if already there
			*/
			if (!word_replace) phrase = "^(" + phrase + ")$"; // Version 1.2.6 - 3/4/2019
			try { // Version 0.99.7
				re = new RegExp(phrase,'i'); // insensitive case search: 'i'; beginning of string: ^
			} catch(err) { 
				console.log(err);
				send_to_content({ "interim" : err.message });
				document.getElementById('error').innerHTML = "Custom command error: "+err.message;
			}
			var matches = speech.match(re);
			if (matches)
			if (word_replace) { // Version 1.2.6
				speech = speech.replace(re, word_replace); // Version 1.0.4 - Allow word replace in sr.html text box
				found = speech; word_replace_found = true;
				if (test_mode) console.log("word_replace: "+phrase+": "+sra.custom_commands[i].action+": "+speech);
			}
			else
			{
				matches.shift(); // Version 1.2.6 - Remove first match because now pos 0 and 1 are the same since we added () around the phrase
				word_replace_found = false; // Version 1.3.0 - Added so that speech is not sent twice on line 469 and 481
				if (found == false) // Version 1.3.0 - Added so that word replace works along with another found action
					found = true; // We found a speech command. 
				console.log("Speech: "+speech);
				console.log("Phrase Found: "+sra.custom_commands[i].phrase);
				console.log("Action Found: "+sra.custom_commands[i].action);
				console.log("Matches: "+JSON.stringify(matches));
				if (sra.custom_commands[i].action)
				{

					// Replace $0 $1 $2 ... with matches[0] matches[1] ...
					var action = sra.custom_commands[i].action;
					for (s = 0; s < matches.length; s++)
					{
						var string_num = s;
						var num_re = new RegExp("\\$"+string_num,'ig'); // Version 1.0.9 - Added g for global replace
						if (!matches[s]) matches[s] = ""; // Version 0.98.2 Added 12/11/2016 because if optional match is not there it was showing as null and ending up as undefined
						else if (replace_obj.hasOwnProperty(matches[s].toLowerCase())) // Version 0.99.7
										matches[s] = replace_obj[matches[s].toLowerCase()]; // Replace First or 1st with '1', etc...
						action = action.replace(num_re, matches[s]);
					}	
					
					var option; var command;
					var action_seconds = 0; 
					//var action = action.replace(/print_text *?\((.*)\)/g, function (match, capture) { // Version 0.99.8 - Resolve print_text() command
					var action = action.replace(/(?:print_text|script) *\((?<params>(([^)(]|\(*([^)(]|\([^)(]*\))*\))*))\)/g, function (match, capture) { // Version 1.3.0 - Resolve print_text() command with recursive parenthesis
						// match = print_text ("<text>;")	capture = "<text>;"
						console.log(capture);
						var encodedStr = capture.replace(/[\u0021-\u9999<>\&\(\)]/gim, function(i) {
   							return '&#'+i.charCodeAt(0)+';'; // replace unicode 00A0-9999<>&() with html entity
						});
						encodedStr = encodedStr.replace(/;/g, "%3B"); // replace ; with %3B
						if (match.match(/^script/i)) // Version 1.3.0
							encodedStr = "script(" + encodedStr + ")";
						return encodedStr;
					});
					if (test_mode) console.log(action);	
					var split_action = action.split(/\s*;\s*/); // Split action by ";" - Version 0.99.7 - changed to regex for optional spaces
					for (var a = 0; a < split_action.length; a++) {
						//action = unescape(split_action[a]); // Version 0.99.7 - Added unescape so %3B = ;
						action = split_action[a].replace(/%3B/g, ";"); // Version 0.99.7 - Replace %3B with ;
						if (action.match(/^\s*((https?|ftp|file)\:\/\/)/)) // if http or ftp or version 0.98.3 "file" 12/27/2016
						{
							// Go to url
							action = action.replace(/^\s*/g, ''); // Version 1.0.4 - Steve Axtell was putting " http:..." for action. Remove space
							url(action, new_tab);
							action_seconds += 1000; // Make sure next command waits for the tab to load first
						}
						else if (action.indexOf("(") != -1)
						{
							if (action.substr(-1) == ")") // Version 1.3.0 - Only remove ( if ) is the last character
								command = action.split('(')[0]; // switch_tabs(left) = switch_tabs
							else command = action; // Version 1.3.0 - else send entire action to content for inject_script()
							command = command.replace(/^\s*/g, ''); // Version 1.0.4 - Steve Axtell was putting " http:..." for action.
							command = command.replace(/%28/g, "("); // Version 0.99.7 - Replace %28 with ( 
							command = command.replace(/%29/g, ")"); // Version 0.99.7 - Replace %29 with ) 
							// option = action.split("(")[1].slice(0, -1); // switch_tabs(left) = left
							option = ""; // Version 1.3.0
							if (action.substr(-1) == ")") // Version 1.3.0 - Only remove ) if it is the last character
								option = action.split(/\((.+)/)[1].slice(0, -1); // Version 0.99.7 - split at \( but only first occurrence. eval(document.execCommand("copy")) = document.execCommand("copy")
							option = option.replace(/%28/g, "("); // Version 0.99.7 - Replace %28 with (
							option = option.replace(/%29/g, ")"); // Version 0.99.7 - Replace %29 with )
							option = option.split(/\s*,\s*/); // Version 0.99.7 - Split by , and added .apply(this, below
							for (var o = 0; o < option.length; o++)
								option[o] = option[o].replace(/^["']|["']$/g, ""); // Version 0.99.7 - Remove quotes or single quotes at beginning and end if there
							//var splt = command.split("."); // Version 1.3.0 - Was in content.js
							var splt = command.match(/(.*)\.(.*)/); // Version 1.3.0a - Split at last period only
							if (splt)
								splt.shift(); // Version 1.3.0a - Remove first element from array which is the entire match. We just want the last two elements
							if (window[command]) {
								(function(command, option) { setTimeout(function() { window[command].apply(this, option); }, action_seconds); })(command, option); // Wait to make sure tab is loaded first
								action_seconds += 500; // The next commands don't have to take as long to run (250 ms after 1000 is already run)
							}
							else if (splt && splt.length == 2 && splt[0][splt[1]]) { // Version 1.3.0 - Was in content.js
								var phrase = splt[0][splt[1]](option); // Works with: ibm.toUpperCase()
								if (test_mode) console.log("2: "+phrase);
								action = phrase;
								(function(action) { setTimeout(function() { send_to_content({ "speech" : action }); }, action_seconds); })(action); // Wait to make sure tab is loaded first			
								found = action; // Version 1.0.4 - Allow word replace in sr.html text box
								if (found == "") found = true; // Version 1.2.8 - Otherwise sr.js prints out the entire command if there is a blank command such as two ;; Example: PHRASE: (.*?)?(capitalized?) (.*?)  ACTION: $1;capitalize_first_letter($3)
								action_seconds += 500; // The next commands don't have to take as long to run
							}
							else {
								if ( (action.split('(').length -1) >= 2) { // Version 1.3.0 - If multiple ( then send entire action. e.g. document.querySelectorAll(".r")[$1].click() 
									command = action; option = [];
								}
								(function(command, option) { setTimeout(function() { send_to_content({ "command" : command, "option" : option }); }, action_seconds); })(command, option); // Wait to make sure tab is loaded first			
								action_seconds += 500; // The next commands don't have to take as long to run
							}
						}
						else {
							if (test_mode) console.log(action);
							action = action.replace(/%28/g, "("); // Version 0.99.7 - Replace %28 with (
							action = action.replace(/%29/g, ")"); // Version 0.99.7 - Replace %29 with )
							if (action != "")  // Version 1.3.0 - Added if (action!= "") Otherwise it might try to click on an input element even though there is no text
								(function(action) { setTimeout(function() { send_to_content({ "speech" : action }); }, action_seconds); })(action); // Wait to make sure tab is loaded first			
							found = action; // Version 1.0.4 - Allow word replace in sr.html text box
							if (found == "") found = true; // Version 1.2.8 - Otherwise sr.js prints out the entire command if there is a blank command such as two ;; Example: PHRASE: (.*?)?(capitalized?) (.*?)  ACTION: $1;capitalize_first_letter($3)
							action_seconds += 500; // The next commands don't have to take as long to run
						}
					}
				}
				break;
			}
		}
	}
	if (word_replace_found)  {
		send_to_content({ "speech" : speech }); // Version 1.2.6 
	}
	return(found);
}


function switch_tabs(option)
{
	var nextTab = null; 
	if (Array.isArray(option)) option = option[0];
	if (option == null || option == "") option = "next"; // Version 0.99.7
	// First get currently active tab
	chrome.tabs.query({ currentWindow: true, active: true}, function (tabs) {
		var currentId = tabs[0].id;
		var currentIndex = tabs[0].index; // index is 0 to the number of tabs in window
		// Second get all the tabs in the current window
	  	chrome.tabs.query({currentWindow: true}, function (tabs) {
        	var numTabs = tabs.length;
        	if (isNaN(option)) // if option is a string and not a number
        	{
				if (option.match(/^(right|next|siguiente|weiter|prossima)/i)) nextTab = currentIndex + 1;
	        	else if (option.match(/^(left|previous|anterior|zurück|precedente)/i)) nextTab = currentIndex - 1;
	        	else if (option.match(/^last$/i)) nextTab = tabs.length - 1;
	        	else if (option.match(/^close|remove|cerrar|cierra|schließen|entfernen|chiudi|elimina$/i)) chrome.tabs.remove(currentId);
	        }
	        else // if option is a number
	        {
	        	nextTab = option - 1; // Go to that tab number (Remember that first tab is 0)
	        }
        	if (nextTab >= tabs.length) nextTab = 0;
        	else if (nextTab < 0) nextTab = tabs.length - 1;
        	if (isNaN(option)) // if option is a string and not a number
        	{
				for (var i=0; i < tabs.length; i++)
	        	{
	        		// Search for tab url or title with keywords with and without spaces: sea breeze computers, seabreezecomputers
					//var re = new RegExp("^(https?:\/\/)?(www\.)?"+option,'i'); // Version 1.2.7 - Removed
	        		//var re_no_spaces = new RegExp("^"+option.replace(" ",""),'i'); // Version 1.2.7 - Removed
					var re = new RegExp(option,'i'); // Version 1.2.7 - Added
	        		var re_no_spaces = new RegExp(option.replace(" ",""),'i'); // Version 1.2.7 - Added
					if (tabs[i].url.match(re) || tabs[i].url.match(re_no_spaces) || tabs[i].title.match(re))
					{
						nextTab = i;
						if (i != currentId) break; // break for loop if we found a new tab
					}
					if (test_mode) console.log("id:"+tabs[i].id+". index: "+tabs[i].index+". url: "+tabs[i].url.substring(0, 15)+". title: "+tabs[i].title); 
				}
			}
			// finally, get the index of the tab to activate and activate it
        	if (nextTab != null)
				chrome.tabs.update(tabs[nextTab].id, {active: true});

		});
	});
}


function url(keyword, new_tab)
{
	var new_tab = (typeof new_tab === 'undefined') ? false : new_tab;
	var new_tab_url = "https://www.google.com/"; // Version 1.1.2
	var homepage = false;
	var currentId;
	var currentIndex;
	// Version 0.99.7 - Added || keyword == "" below so that url() will open a new tab
	if (typeof keyword === "undefined" || keyword == "") { new_tab = true; keyword = new_tab_url; } // Version 1.1.2 - Was https://www.google.com/_/chrome/newtab - // Version 0.99.0 - Was chrome://newtab/
	//console.log(typeof keyword);
	if (Array.isArray(keyword)) 
	{
		for (var a = 1; a < keyword.length; a++)
		{	
			if (keyword[a].match(/new|nov|nuev|neu|ny/)) new_tab = true; 
		}
		if (keyword[0].match(/home( *?)page/)) { homepage = true; keyword = new_tab_url; } // Version 1.1.2 - Was https://www.google.com/_/chrome/newtab - // Version 0.99.0 - Was chrome://newtab/
		else keyword = "http://" + keyword[0].replace(/ /gi, ""); // Turn into url
		if (test_mode) console.log(keyword);
	}
	else if (keyword.match(/home( *?)page/)) { homepage = true; keyword = new_tab_url; } // Version 1.1.2 - Was https://www.google.com/_/chrome/newtab - // Version 0.99.9
	else if (!keyword.match(/^(http|ftp|file)/)) keyword = "http://" + keyword; // Version 0.99.7 // Version 1.0.4 - Forgot to have |ftp|file here
	
	// First get currently active tab
	chrome.tabs.query({ currentWindow: true, active: true}, function (tabs) {
		currentId = tabs[0].id;
		currentIndex = tabs[0].index; // index is 0 to the number of tabs in window
		// Don't change url of Speech Recognition tab
		//if (tabs[0].url.match(/sr.html/i) || tabs[0].title.match(/speech/i))
		if (tabs[0].url == window.location.href) // if current tab is the speech recognition tab
			new_tab = true;
			
			if (new_tab)
			{	
				chrome.tabs.create({"url":keyword,"active":true}, function(tab){
			        /* tab_id = tab.id;
			        tab_url = tab.url;
			        updateBadge(); */
			    });
			}
			else
			{
				// Change url of current tab
				chrome.tabs.update(currentId, {"url": keyword});
			}
	});
		

}


function play(keyword, new_tab)
{
	var new_tab = (typeof new_tab === 'undefined') ? false : new_tab;
	var homepage = false;
	var currentId;
	var currentIndex;
	if (typeof keyword === "undefined") { new_tab = true; keyword = "chrome://newtab/"; }
	//console.log(typeof keyword);
	if (Array.isArray(keyword)) 
	{
		for (var a = 2; a < keyword.length; a++)
		{	
			if (keyword[a].match(/new|nov|nuev|neu|ny|nuova/i)) new_tab = true; 
		}
		if (keyword[0].match(/home( *?)page/)) { homepage = true; keyword = "chrome://newtab/"; }
		else keyword = "https://www.youtube.com/results?search_query=" + keyword[1]; // Turn into url. btnI = I'm feeling lucky btn
		if (test_mode) console.log(keyword);
	}
	else // Version 0.99.7 - If keyword is a string
		keyword = "https://www.youtube.com/results?search_query=" + keyword; // Version 1.2.7
	
	if (new_tab) {	
			chrome.tabs.create({"url":keyword, active:true});
	}
	else {
		// First get currently active tab
		chrome.tabs.query({ currentWindow: true, active: true}, function (tabs) {
			if (!tabs[0].url.match(/https?:\/\/(www\.)?youtube\./i)) { // Version 1.2.7 - if current tab is not youtube.com	
				chrome.tabs.query({currentWindow: true}, function (tabs) { // Version 1.2.7 - Search for youtube tab
					var re = new RegExp("(youtube|youtu.be)",'i');
					for (var i=0; i < tabs.length; i++)
					{
						if (test_mode) console.log(tabs[i].url);
						// Search for tab url or title with keywords: youtube or youtu.be	
						if (tabs[i].url.match(re) || tabs[i].title.match(re))
						{
							chrome.tabs.update(tabs[i].id, {"url": keyword, active: true});
							break; // break for loop if we found a youtube tab
						}	
					}
					if (i >= tabs.length) // if we did not find a youtube tab
						chrome.tabs.create({"url":keyword, active:true});
				});
			}	
			else { // update current tab since it is youtube
				chrome.tabs.update({"url": keyword, active: true});			
			}
		});	
	}
	
	setTimeout(function() { 
		send_to_content({ "command" : "click_element", "option" : "thumbnail" }); // Click on first thumbnail at youtube.com
	}, 1000);

}


function set_language(keyword) {
	// Set language with your voice - Version 0.98.8
	
	var re = new RegExp("^"+keyword,'i');
	// Look for language in form
	for (var i = 0; i < languages.length; i++) {
		if (document.settings_form.select_language.options[i].text.match(re)) {
			document.settings_form.select_language.selectedIndex = i;
			break;
		}
	}
	change_language(); // function is in languages.js
}


function dictation(keyword) {
	// Version 0.99.7 - Turn dictation on/off
	// Only works in Full Version
	if (Array.isArray(keyword)) keyword = keyword[0];

	if (keyword.match(/on|start|enable|Activ|Comience|Aktiv|på|accendi/i)) {
		if (document.settings_form.disable_speech2text.checked == true)
			document.settings_form.disable_speech2text.click();
	} else if (keyword.match(/off|stop|disable|disact|Detener|Apaga|Deaktiv|av|spegni/i)) {
		if (document.settings_form.disable_speech2text.checked == false)
			document.settings_form.disable_speech2text.click();
	}
}

function toggle_autop(keyword) {
	// Version 1.0.1 - Turn Auto Punctuation on/off
	// Only works in Full Version
	if (Array.isArray(keyword)) keyword = keyword[0];

	if (keyword.match(/on|start|enable|Activ|Comience|Aktiv|på|accendi/i)) {
		if (document.settings_form.auto_punctuation.checked == false)
			document.settings_form.auto_punctuation.click();
	} else if (keyword.match(/off|stop|disable|disact|Detener|Apaga|Deaktiv|av|spegni/i)) {
		if (document.settings_form.auto_punctuation.checked == true)
			document.settings_form.auto_punctuation.click();
	}
}

function capitalize_first_letter(string, all_words) {
	// Version 0.99.8 - capitalize first letter of string. If all_words is true capitalize first letter of every word
	if (Array.isArray(string)) string = string[0];
	var all_words = (typeof all_words === 'undefined') ? false : all_words;	
	
	string = string.charAt(0).toUpperCase() + string.slice(1); // Capitalize first letter of string
	if (all_words == "1" || all_words == "true") { // Vesion 1.0.7 - Was just: if (all_words)
		string = string.replace(/\w\S*/g, function(string)
		{
			return string.charAt(0).toUpperCase() + string.substr(1).toLowerCase();
		});
	}
	if (test_mode) console.log(string);
	//return string;
	send_to_content({ "speech" : string });
}


function remove_auto_caps(string) {
	// Version 1.1.8 - This function will remove Google's Web Speech Auto Capitalization
	var regex = /\b[A-Z][a-z]/g; // Match all capital letters with lower case letters after them (Won't match I or USA or I.B.M.)
	var modified = string.replace(regex, function(match) {
		return match.toLowerCase();
	});
	return(modified);
}


function keypress_inject(keyCode, ctrl, alt)
{
	var params = keyCode.split(',');
	keyCode = params[0]; 
	console.log(keyCode);
	ctrl = (typeof ctrl != 'undefined' && ctrl != "0" && ctrl != "false") ? true : false; // Version 0.99.7 - Was: (params[1] && params[1].match(/true/))
	alt = (typeof alt != 'undefined' && alt != "0" && alt != "false") ? true : false; // Version 0.99.7 - Was: (params[1] && params[1].match(/true/))
	if (isNaN(keyCode)) { // if keyCode is not a number
		keyCode = keyCode.charCodeAt(0); // Convert string character into charCode
	}
	
	var actualCode = '(' + function(keyCode, ctrl, alt) {
	    // All code is executed in a local scope.
	    // For example, the following does NOT overwrite the global `alert` method
	    //var alert = null;
	    // To overwrite a global variable, prefix `window`:
	    //window.alert = null;
	    // Simulate a keypress
	    var el = window.document.activeElement;
	
		// Event method
	  	var eventObj = window.document.createEvent("Events");
	  	eventObj.initEvent("keydown", true, true); // bubble, cancelable
	 	eventObj.keyCode = keyCode;
	    eventObj.which = keyCode;
	    eventObj.charCode = 0;
	    el.dispatchEvent(eventObj);
	    //document.dispatchEvent(eventObj);
	    
	    eventObj = document.createEvent("Events");
	  	eventObj.initEvent("keypress", true, true);
	 	eventObj.keyCode = keyCode;
	    eventObj.which = keyCode;
	    eventObj.charCode = keyCode;
	    el.dispatchEvent(eventObj);
	    //document.dispatchEvent(eventObj);
	    
	    eventObj = document.createEvent("Events");
	  	eventObj.initEvent("keyup", true, true);
	 	eventObj.keyCode = keyCode;
	    eventObj.which = keyCode;
	    eventObj.charCode = 0;
	    el.dispatchEvent(eventObj);
	    //document.dispatchEvent(eventObj);
	    
	    // keyboard event method
		//var keyCode = 74; // 74 = j
		var keyboardEvent = window.document.createEvent("KeyboardEvent");
		var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
	    keyboardEvent[initMethod](
	                       "keypress",
	                        true,      // bubbles oOooOOo0
	                        true,      // cancelable   
	                        null,    // view
	                        ctrl,     // ctrlKeyArg
	                        alt,     // altKeyArg
	                        false,     // shiftKeyArg
	                        false,     // metaKeyArg
	                        keyCode,  
	                        keyCode          // charCode   
	    );
	    
		
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
	
	/* var script = document.createElement('script');
	script.textContent = actualCode;
	(document.head||document.documentElement).appendChild(script);
	script.parentNode.removeChild(script);
	*/
	
	 chrome.tabs.executeScript(null, {
    code: 'var s = document.createElement("script");' +
          's.textContent = ' + JSON.stringify(actualCode) + ';' + 
          '(document.head||document.documentElement).appendChild(s);' + 
          's.parentNode.removeChild(s);' 
	});
	
}


function keypress_test(key, ctrl, alt, shift) {

	console.log(key);
	ctrl = (typeof ctrl != 'undefined' && ctrl != "0" && ctrl != "false") ? true : false; // Version 0.99.7 - Was: (params[1] && params[1].match(/true/))
	alt = (typeof alt != 'undefined' && alt != "0" && alt != "false") ? true : false; // Version 0.99.7 - Was: (params[1] && params[1].match(/true/))
	if (!isNaN(key)) { // if key is a number
		key = String.fromCharCode(key); // Convert charcode to string
	}
	console.log(key);
	
	var actualCode = '(' + function(key, ctrl, alt, shift) {
		//https://elgervanboxtel.nl/site/blog/simulate-keydown-event-with-javascript	
	  var e = new Event("keydown");
	  e.key=key;    // just enter the char you want to send 
	  e.keyCode=e.key.charCodeAt(0);
	  e.which=e.keyCode;
	  e.altKey=ctrl;
	  e.ctrlKey=alt;
	  e.shiftKey=shift;
	  e.metaKey=false;
	  e.bubbles=true;
	  document.dispatchEvent(e);
	  
	  } + ')( ' + JSON.stringify(key) + ');';
		
	/* var script = document.createElement('script');
	script.textContent = actualCode;
	(document.head||document.documentElement).appendChild(script);
	script.parentNode.removeChild(script);
	*/
	
	 chrome.tabs.executeScript(null, {
    code: 'var s = document.createElement("script");' +
          's.textContent = ' + JSON.stringify(actualCode) + ';' + 
          '(document.head||document.documentElement).appendChild(s);' + 
          's.parentNode.removeChild(s);' 
	});

}


// Version 1.0.5 - https://stackoverflow.com/questions/13405129/javascript-create-and-save-file
function export_commands() {
	var file = new Blob([JSON.stringify(sra.custom_commands)], {type: 'text/plain'});
	var filename = 'sra_commands.txt';
	
	if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
		var a = document.createElement("a");
		a.style.position = "absolute";
		a.style.left = "-2000px";
		a.href = URL.createObjectURL(file);
		a.download = filename;
		document.body.appendChild(a);
		a.click();
	}
}


// Version 1.0.5 - https://stackoverflow.com/questions/14446447/how-to-read-a-local-text-file
function import_commands() {
	var input = document.custom_commands_form.import_file;
	var reader = new FileReader();
	reader.onload = function(){
  		var text = reader.result;
  		try {
  			var import_obj = JSON.parse(text);
  			document.getElementById('import_error').innerHTML = "";
		}
  		catch (err) {
  			// Unexpected token p in JSON at position 6 (if you forgot to put quotes around "phrase")
  			// Unexpected token ] in JSON at position 459 (if you left a comma after the last array element
  			document.getElementById('import_error').innerHTML = err.message;
  			if (err.message.match(/^Unexpected token [a-zA-Z]/i))
  				document.getElementById('import_error').innerHTML += '. Make sure key names like "phrase" are surrounded by quotes.';
  			else if (err.message.match(/^Unexpected token \]/i))
  				document.getElementById('import_error').innerHTML += '. Make sure the last array element does not have a comma after it, before the ]';
  			return;
  		}
  			
  		var import_type = document.querySelector('input[name=import_type]:checked').value;
  		//var node = document.getElementById('output');
  		//node.innerText = text;
		if (test_mode) console.log(text);
		if (test_mode) console.log(import_obj);
		if (test_mode) console.log(import_type);
		
		if (import_type == "append")
			sra.custom_commands = sra.custom_commands.concat(import_obj);
		else
			sra.custom_commands = import_obj;
		
		print_custom_commands(); // reprint custom commands
		setup_forms(); // Reseup forms
		var obj = { custom_commands : sra.custom_commands };
		if (test_mode) console.log("custom_commands object: "+JSON.stringify(obj));
		save_to_storage(obj);	
	}
	reader.readAsText(input.files[0]);
}
// <input type='file' accept='text/plain' onchange='import_commands(event)'>


