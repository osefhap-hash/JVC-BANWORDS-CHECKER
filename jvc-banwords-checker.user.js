// ==UserScript==
// @name         JVC Banwords Checker
// @namespace    https://github.com/osefhap-hash/JVC-BANWORDS-CHECKER
// @version      19-Septembre-2026
// @match        https://www.jeuxvideo.com/forums/*
// @author       captain_cid31
// @description  --- Script pour détecter les mots ou groupes de mots interdits ---
// @require      https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/data/banwords.js
// @require      https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/data/banphrases.js
// @updateURL    https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/jvc-banwords-checker.user.js
// @downloadURL  https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/jvc-banwords-checker.user.js
// ==/UserScript==

/**
 * ================ FONCTIONS UTILITAIRES ================
 */

function canonical_form(word) {
	return word
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/€/g, "e") ;
}
//canonical_form("Cocaïne") ;   // "cocaine"
//canonical_form("cocain€") ;   // "cocaine"
//canonical_form("COCAÏNE") ;   // "cocaine"
//canonical_form("Féminisme") ; // "feminisme"
//canonical_form("Pute") ;      // "pute"
//canonical_form("put€") ;      // "pute"
//canonical_form("f€minisme") ; // "feminisme"
//canonical_form("PUTE") ;      // "pute"

function tokenize(str) {
    return str.match(/[a-z0-9<>]+/gi) ?? [] ;
}
// Séparateurs : . , espace - (tout ce qui n'est pas alphanumérique, ni <, ni >, donc / est un séparateur aussi)



/**
 * ================ DETECTION DE MOTS INTERDITS ================
 */

const textarea = document.querySelector("textarea") ;
const message = textarea.textContent ;

const canonical_msg = canonical_form(message) ;
const tokenized_canon_msg = tokenize(canonical_msg) ;

for (const token of tokenized_canon_msg) {
    const key_letter = token[0].toUpperCase() ;
    if (all_banwords_dictionary[key_letter]?.has(token)) // ?.has() évite d'avoir à tester si la lettre existe dans le dictionnaire.
		console.log("Mot interdit trouvé : ", token) ;
}



/**
 * ================ DETECTION DE GROUPES DE MOTS INTERDITS ================
 */

let max_phrase_length = 1 ;
for (const set_of_phrases of Object.values(banphrases_dictionary)) {
	// Object.values ou Object.keys ou Object.entries obligatoire : on ne peut pas juste itérer sur un dictionnaire.
	// Conceptuellement : Object.entries(dico) = Object.keys(dico) + Object.values(dico)
	for (const phrase of set_of_phrases) {
		const length = phrase.split(" ").length ;
		if (max_phrase_length < length) max_phrase_length = length ;
	}   
}

for (let i = 0 ; i < tokenized_canon_msg.length ; i++) {
    for (let length = 2 ; length <= max_phrase_length ; length++) {
        const phrase = tokenized_canon_msg.slice(i, i + length).join(" ") ;
		const key_letter = phrase[0].toUpperCase() ;
        if (banphrases_dictionary[key_letter]?.has(phrase))
			console.log("Expression interdite trouvée : ", phrase) ;
    }
}
