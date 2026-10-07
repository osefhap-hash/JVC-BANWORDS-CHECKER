// ==UserScript==
// jvc-banwords-checker.user.js
// @name         JVC BANWORDS CHECKER
// @namespace    https://github.com/osefhap-hash/JVC-BANWORDS-CHECKER
// @version      1.0.18
// Created		 :	Saturday, 19th September 2026
// Last modified :	Wednesday, 7th October 2026
// @match        https://www.jeuxvideo.com/forums/*
// @author       captain_cid31
// @description  --- Script pour détecter les mots ou groupes de mots interdits ---
//
// @resource     inspect-window-html	https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/html/inspection-window.html
//
// @resource     inspect-btn-style-css			https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/css/inspect-btn-style.css
// @resource     inspection-window-style-css	https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/css/inspection-window-style.css
//
// @require      https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/data/banwords.js
// @require      https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/data/banphrases.js
// @require      https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/data/elements-to-ignore.js
// @require      https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/utility-tools/token-process-functions.js
// @require      https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/utility-tools/inspection-window-functions.js
//
// @updateURL    https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/jvc-banwords-checker.user.js
// @downloadURL  https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/jvc-banwords-checker.user.js
//
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jeuxvideo.com
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==



// Tampermonkey va réagir au moment de vouloir accéder à :
// https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/jvc-banwords-checker.user.js
// car il y a le bloc de métadonnées (le truc qui commence par // ==UserScript==).
// Tampermonkey intercepte alors ce type de ressource et reconnaît :
// « C'est un fichier .user.js contenant des métadonnées UserScript => je peux proposer son installation. »
// Pour les mises à jour auto, @updateURL doit pointer vers le fichier .user.js complet, pas vers les listes banwords.js etc.



/**
 * ================ CHARGEMENT DU STYLE DU BOUTON INSPECTER ================
 */

// Définition, chargement, puis injection du style dans la page :
//const inspect_button_style = document.createElement("style") ;
//inspect_button_style.textContent = GM_getResourceText("inspect-btn-style-css") ;
//document.head.appendChild(inspect_button_style) ;

// Plus directement :
GM_addStyle(
	GM_getResourceText("inspect-btn-style-css")
) ;
// GM_addStyle() injecte le CSS dans le document de la page où s'exécute le userscript. Dans notre cas, la page JVC.



/**
 * ================ DÉFINITION DE LA FONCTION D'INSERTION DU BOUTON ================
 *	 Recherche du lieu d'insertion, application du style, et comportement au clic.
 */

function insert_inspect_button() {
	// Insertion spéciale dans jvchat :
	const text_area = document.querySelector("#message_reponse") ?? document.querySelector("#message_topic") ; // cas à part de la liste des sujets
	// Attention ! Plusieurs textarea dans jvchat contrairement à jvc, donc document.querySelector("textarea") ne retournera pas toujours le bon !
	if (text_area && text_area.placeholder === "Hop hop hop, le message ne va pas s'écrire tout seul !") {
		const inspect_btn = document.querySelector(".shape-inspect-btn") ;
		if (inspect_btn && inspect_btn.classList.contains("shape-inspect-btn")) {
			inspect_btn.classList.remove("shape-inspect-btn") ;
			inspect_btn.classList.add("shape-inspect-btn-jvchat") ;
		}
		return ;
	}

	// div qui contient la balise du bouton Poster.
	const post_button_block = document.querySelector(".messageEditForm__buttons") ?? document.querySelector(".messageEditor__buttons") ; // cas à part de la liste des sujets

	// On ne tente l'insertion du bouton Inspecter que si le bouton Poster est chargé sur la page !
	if (!post_button_block) return ;

	// On n'insère que si le bouton Inspecter n'est pas déjà inséré...
	// (important pour le MutationObserver plus bas, pour qu'il n'insère pas en boucle le button à chaque changement dans la page)
	if (post_button_block.querySelector(".shape-inspect-btn")) return ;

	// Si on a passé les tests précédents, le bouton Inspecter est prêt à être créé et inséré.
	const inspect_button = document.createElement("button") ;
	inspect_button.title			= "Vérifier la présence de mots interdits" ;
	inspect_button.classList.add("shape-inspect-btn") ;
	inspect_button.textContent	= "Inspecter" ;
	inspect_button.type			= "button" ;

	post_button_block.appendChild(inspect_button) ;
	inspect_button.addEventListener("click", inspect_message) ;
}
/**
 * ================ APPEL DE LA FONCTION D'INSERTION DU BOUTON (1ÈRE TENTATIVE) ================
 */
insert_inspect_button() ;



/**
 * ================ NEW MUTATIONOBSERVER POUR RETENTER L'INSERTION JUSQU'À CE QUE ÇA MARCHE ================
 *								(À CAUSE DE LA DOM PAS CHARGÉE IMMÉDIATEMENT)
 */

// Constructeur : créé un MutationObserver qui va faire la même action à chaque changement dans la page -> insert_inspect_button()
const mut_obs = new MutationObserver((mutations) => {
	insert_inspect_button() ;
}) ;

// Mais lors de quels changements exactement ?
mut_obs.observe(document.body, {
	childList	: true,
	subtree		: true,
	attributes	: false, // ignorer les changements de style
}) ;

// À laisser en dehors des fonctions, on calcule juste le nombre maximum de mots d'un groupe de mots interdits.
let max_phrase_length = 1 ;
for (const set_of_phrases of Object.values(banphrases_dictionary)) {
	// Object.values ou Object.keys ou Object.entries obligatoire : on ne peut pas juste itérer sur un dictionnaire.
	// Conceptuellement : Object.entries(dico) = Object.keys(dico) + Object.values(dico)
	for (const phrase of set_of_phrases) {
		const length = phrase.split(" ").length ;
		if (max_phrase_length < length) max_phrase_length = length ;
	}
}



/**
 * ================ FONCTION DE DÉTECTION DES MOTS ET GROUPES DE MOTS INTERDITS ================
 *			Fonction définissant le comportement du bouton "Inspecter" au clic de celui-ci.
 */

function inspect_message(/*src*/) {
	/*const clicked_btn = src.currentTarget ;*/
	// Pas besoin de remonter jusqu'à la zone de saisie du texte depuis le button cliqué, on peut le cibler directement :
	const textarea = document.querySelector("#message_reponse") ?? document.querySelector("#message_topic") ; // Rappel nécessaire à chaque clic, car le texte peut avoir changé entre temps.
	if (!textarea) return ;
	const message = textarea.value ; // plutôt que textContent
	const tokenized_msg = tokenize_with_positions(message) ;
	const raw_detections = [] ;

	for (const token of tokenized_msg) {
		if (token.is_url) {
        	// On analyse spécifiquement l'URL pour y trouver des banwords/banphrases
        	const url_detections = inspect_url(token.text, token.start) ;
        	raw_detections.push(...url_detections) ;
    	}
		else if (token.is_smiley) {
            // On ignore les smileys pour la détection
            continue ;
        }
		else {
			const canonical_token = canonical_form(token.text) ;
    		const key_letter = canonical_token[0].toUpperCase() ;

			// ?.has() évite d'avoir à tester si la lettre existe dans le dictionnaire.
    		if (all_banwords_dictionary[key_letter]?.has(canonical_token))
				raw_detections.push({
					text	: token.text,
					start	: token.start,
					end		: token.end,
					is_url	: false, // On garde l'information
				}) ;
		}
	}

	const len_tokens = tokenized_msg.length ;

	for (let i = 0 ; i < len_tokens ; ++i) {
		let canonical_phrase = canonical_form(tokenized_msg[i].text) ;

    	for (let length = 2 ; length <= max_phrase_length ; length++) {
			const end_index = i + length ;
            if (end_index > len_tokens) break ;
			// Plus assez de tokens pour cette longueur, on arrête la boucle interne

			const last_token = tokenized_msg[end_index - 1] ;
			// On construit la phrase progressivement au lieu de tout recalculer avec .slice() et .map()
            canonical_phrase += " " + canonical_form(last_token.text) ;
            const key_letter = canonical_phrase[0].toUpperCase() ;

			if (banphrases_dictionary[key_letter]?.has(canonical_phrase)) {
				const phrase_tokens = tokenized_msg.slice(i, end_index) ;
				// Une phrase est considérée comme "URL" si l'un de ses tokens fait partie d'un lien
                const is_phrase_url = phrase_tokens.some(t => t.is_url) ;

				const first_token = tokenized_msg[i] ;
				raw_detections.push({
                    text	: message.slice(first_token.start, last_token.end),
                    start	: first_token.start,
                    end		: last_token.end,
					is_url	: is_phrase_url,
                }) ;
			}
    	}
	}
	// Tri des détections
	raw_detections.sort((a, b) => {
		if (a.start !== b.start) return a.start - b.start ;
		return (b.end - b.start) - (a.end - a.start) ;
	}) ;

	// Suppression des chevauchements pour le surlignage (Highlight)
    const detections_for_highlight = [] ;
    for (const detection of raw_detections) {
        const previous = detections_for_highlight[detections_for_highlight.length - 1] ;
        if (previous && detection.start < previous.end) continue ;
        detections_for_highlight.push(detection) ;
    }

    // Création de la liste pour les suggestions (on filtre pour exclure les URLs)
    const detections_for_suggestion = detections_for_highlight.filter(d => !d.is_url) ;

    // Affichage en passant les deux listes distinctes
    create_inspection_window(message, detections_for_highlight, detections_for_suggestion, tokenized_msg) ;
}
