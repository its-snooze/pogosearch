function $S(selector) { return document.querySelector(selector); }

var outLanBox
var inpLanBox
var inpTxt
var outTxt
var copyBtn
var copyTxt
var logTxt
var verbose

const DetectLanguageString = 'Detect Language'
const sepChars = [',','|','&',';',':'];
const sepRgx = /([,|&;:])/g
const preRgx = /^[ \n!+@#-\d]*/
const postRgx = /[ \n-\d\*]*$/
// const fullRgx = /^([ \\n!+@#-\d]*)([^ \\n!+@#-\d\*]*)([ -\d\*]*$)/g

function copyText() {
    navigator.clipboard.writeText(outTxt.value).then(
	()=>{copyBtn.innerText += ' — Copied!';
	     setTimeout(()=>{copyBtn.innerText = copyTxt},666);},
	()=>{alert(`Failed to copy text ${outTxt.value}`)})
}

function loadLangs() {
    inpLanBox = $S("#inpLan")
    outLanBox = $S("#outLan")
    let langOptions = '';
    for (let lang of Object.keys(TRANSLATIONS)) {
	langOptions += `<option>${lang}</option>`
    }
    outLanBox.innerHTML = langOptions
    inpLanBox.innerHTML = `<option>${DetectLanguageString}</option>` + langOptions
}

function translate() {
    logTxt.innerText = 'Information:';
    verbose = $S('#verbose').checked;
    if (verbose) { logTxt.classList.remove('hide') }
    else { logTxt.classList.add('hide') }
    lowercase = $S('#lowercase').checked;

    inpLangs = [inpLanBox.value];
    outLang = outLanBox.value;

    if (inpLangs[0]==DetectLanguageString) {
	logTxt.classList.remove('hide')
	inpLangs = detectLanguage(verbose)
	if (inpLangs.length==0) {
	    logTxt.innerText += `\nNo language found! You may be using strings from different languages. Have you tried manually picking a language?`;
	    return
	} else if (inpLangs.length == Object.keys(TRANSLATIONS).length) {
	    logTxt.innerText += `\nNo translation needed: Your string should work the same in all languages.`
	} else if (inpLangs.length!=1) {
	    logTxt.innerText += `\nMultiple Languages! - All translatable phrases belong to: [${[...inpLangs]}]. The translation will still work.`;
	} else {
	    logTxt.innerText += `\nLanguage Detected: ${[...inpLangs][0]}`;
	}
    }
    inpLang = inpLangs[0]
    if (verbose) logTxt.innerText += `\nTranslating from ${inpLang} to ${outLang}`

    txt = inpTxt.value;
    let tokens = inpTxt.value.split(sepRgx);
    let warnedF = [];
    let warnedT = [];
    outString = ""
    for (let str of tokens) {
	if (sepChars.includes(str) || str.length==0) {
	    outString += str
	    continue
	}
	[pre,token,post] = tokenize(str)
	if (token.length==0 || pre.includes('#')) {
	    if (verbose) {
		logTxt.innerText += `\nTranslation: '${str}' does not need a translation (${pre}_${token}_${post})`
	    }
	    if (post=="" && customIdx(TRANSLATIONS[outLang],token)!=-1) {
		logTxt.innerText += `\nWARNING: Tag '${token}' will conflict with a phrase in ${outLang}`;
		logTxt.classList.remove('hide')
	    }
	    outString += str
	    continue
	}
	// @ in pre: Move
	// -\d * in post: Search
	// Else: Name (not true but works well enough)
	let searchType = (pre.indexOf("@")>=0) ? 'M' :
	    (post.match(/[-\d\*]/) != null) ? 'S' :
	    'N'
	idx = customIdx(TRANSLATIONS[inpLang], token, inpLang, searchType)
	if (idx==-1) {
	    if (verbose) {
		logTxt.innerText += `\nTranslation: Could not translate '${str}' (${pre}_${token}_${post}) ${searchType}`
	    }
	    outString += str
	    continue
	} else {
	    ttok = TRANSLATIONS[outLang][idx]
	    let keyFrom = `${token.toUpperCase()}•${inpLang}`
	    if (!warnedF.includes(keyFrom) && keyFrom in WARNS) {
		let [qual, warnFrom, warnTo] = WARNS[keyFrom]
		if (qual=="*" || qual==searchType) {
		    warnedF.push(keyFrom)
		    logTxt.innerText = warnFrom + `\n\n` + logTxt.innerText;
		    logTxt.classList.remove('hide')
		}
	    }
	    let keyTo = `${ttok.toUpperCase()}•${outLang}`
	    if (!warnedT.includes(keyTo) && keyTo in WARNS) {
		let [qual, warnFrom, warnTo] = WARNS[keyTo]
		if (qual=="*" || qual==searchType) {
		    warnedT.push(keyTo)
		    logTxt.innerText = warnTo + `\n\n` + logTxt.innerText;
		    logTxt.classList.remove('hide')
		}
	    }

	    if (verbose) {
		logTxt.innerText += `\nTranslation: '${token}' -> '${ttok}' (${pre}_${token}_${post}) ${searchType}`;
	    }
	    outString += `${pre}${ttok}${post}`
	}
    }
    outTxt.value = lowercase ? outString.toLocaleLowerCase(LOCALES[outLang]) : outString
}

// given a piece of text, attempt to coerce it into a translatable portion
// extracts a:
// - Prefix (any of Whitespace, !, +, @, #, Range/Number)
// - Content (any of Text)
// - Postfix (any of Whitespace, Range/Number, *)
function tokenize(s) {
    tmp = s
    pre = tmp.match(preRgx)[0]
    tmp = tmp.replace(preRgx, "")
    post = tmp.match(postRgx)[0]
    tmp = tmp.replace(postRgx, "")
    return [pre,tmp,post];
}

// tries to figure out which language the input string could belong to
// for every translatable string, intersects those languages with every other translation
function detectLanguage() {
    let langs = Object.keys(TRANSLATIONS)
    inpLangs = new Set(langs)
    let tokens = inpTxt.value.split(sepRgx);
    let checkedTokens = []
    for (let str of tokens) {
	if (sepChars.includes(str) || str.length==0) continue // delim bit
	[pre,token,post] = tokenize(str)
	// don't translate tags & pure post/prefixes
	if (pre.includes('#') || token.length==0 || customIncludes(checkedTokens,token)) continue
	checkedTokens.push(token)
	tokenLangs = []
	for (let lang of langs) {
	    if (customIncludes(TRANSLATIONS[lang],token)) {
		tokenLangs.push(lang)
	    }
	}
	if (verbose) {
	    logTxt.innerText += `\nLanguages from ${str}: ${tokenLangs}`
	}
	if (tokenLangs.length > 0) {
	    for (let tmplang of inpLangs) {
		if (!customIncludes(tokenLangs, tmplang)) {
		    inpLangs.delete(tmplang);
		}
	    }
	}
    }
    return [...inpLangs]
}

function customCompare(s1, s2) {
    return s1.localeCompare(s2, undefined, { sensitivity: 'accent' }) === 0
}

function customIncludes(arr, str) {
    for (const el of arr) {
	if (customCompare(el, str)) return true
    }
    return false
}

function customIdx(arr, str, lang, sType) {
    for (let i=0; i<arr.length; i++) {
	el = arr[i];
	if (customCompare(el, str)) {
	    let key = `${i}•${lang}`
	    if (key in OVERLAPS && OVERLAPS[key] != sType) {
			if (verbose) logTxt.innerText += `\nSkipping one instance of ${str} due to multiple in ${lang} (${OVERLAPS[key]} vs ${sType})`
		continue
	    }
	    return i
	}
    }
    return -1
}

window.addEventListener('load', () => {
    loadLangs();

    inpTxt = $S('#inptxt');
    outTxt = $S('#outtxt');
    inpTxt.placeholder = `Paste your string here, select both languages, then press Translate.     

Note! Partial strings ('Vulp' instead of 'Vulpix') will not be translated.`;
    outTxt.placeholder = "Translated string will appear here";
    logTxt = $S('#log');
    
    copyBtn = $S('#copy')
    copyTxt = copyBtn.innerText
    copyBtn.addEventListener('click', copyText);
    
    $S('#trans').addEventListener('click', translate)
});
