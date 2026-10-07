// inspection-window-functions.js
/**
 * ================ FONCTIONS UTILITAIRES POUR LA CRÉATION DE LA FENÊTRE D'INSPECTION ================
 */

function escape_html(str) {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;") ;
}


function build_highlighted_message(message, detections) {
	let html = "" ;
	let current_position = 0 ;
	for (const detection of detections) {
		// Texte normal avant l'élément interdit
		html += escape_html(message.slice(current_position, detection.start)) ;
		// Mot interdit
		html += "<mark>" ;
		html += escape_html(message.slice(detection.start, detection.end)) ;
		html += "</mark>" ;
		current_position = detection.end ;
	}
	// Texte restant après le dernier élément interdit
	html += escape_html(message.slice(current_position)) ;
	return html ;
}


function lightly_obfuscate(message, detections) {
	let modified_message = "" ;
	let current_position = 0 ;

	for (const detection of detections) {
		modified_message += message.slice(current_position, detection.start) ;
		// Texte normal avant la détection
		const forbidden_text = detection.text ;
		// Texte de la détection (au lieu de message.slice(detection.start, detection.end))

		// Deuxième lettre du mot problématique détecté => Zero Width Joiner (ZWJ)
		if (forbidden_text.length >= 2)
			modified_message += forbidden_text[0] + '\u200D' + forbidden_text.slice(1) ;
		else modified_message += forbidden_text ;
		current_position = detection.end ;
	}
	modified_message += message.slice(current_position) ; // Texte restant
	return modified_message ;
}


function heavily_obfuscate(message, tokenized_msg) {
    let censorshipproof_message = "" ;
    let current_position = 0 ;

    for (const token of tokenized_msg) {
        // Texte normal avant le token
        censorshipproof_message += message.slice(current_position, token.start) ;
        const token_text = token.text ;

        // Si c'est un lien, un smiley ou un mot trop court (< 3 caractères), on le laisse intact
		// c'est pourquoi il est essentiel de passer tokenized_msg en argument, car il connaît les
		// propriétés des tokens (si c'est un lien, un smiley...)
        if (token.is_url || token.is_smiley || token_text.length < 3) censorshipproof_message += token_text ;
        else { // Application du ZWJ sur TOUS les mots
            let modified_word = token_text[0] + '\u200D' + token_text.slice(1) ;
            censorshipproof_message += modified_word ;
        }
        current_position = token.end ;
    }
    // Texte restant après le dernier token
    censorshipproof_message += message.slice(current_position) ;
    return censorshipproof_message ;
}


async function set_text_in_clipboard(current_window, text, copy_btn) {
	try {
		await current_window.navigator.clipboard.writeText(text) ;
		const old_textContent = copy_btn.textContent ;
		copy_btn.textContent = "Copié !" ;
		setTimeout(() => { copy_btn.textContent = old_textContent ; }, 1500) ; // Restaurer l'ancien contenu textuel de chaque bouton
	} catch (error) {
		console.error("Impossible de copier le texte :", error) ;
	}
}


// Petite fonction utilitaire pour formuler joliment le texte des liens
function url_warning_text(urls) {
    if (urls.length === 1) return `Un mot interdit a été détecté dans le lien : "${urls[0]}"` ;
    return `Des mots interdits ont été détectés dans ${urls.length} liens.` ;
}


// La fonction suivante - qui crée la fenêtre d'inspection - utilise les styles définis dans le fichier "css/inspect-window.css"
// pour l'élaboration de la fenêtre d'inspection.
// La déclaration de la ressource HTML est dans les métadonnées du fichier principal :
	// @resource 	... => pointe vers le fichier HTML sur GitHub.
// La feuille de style est invoquée dans le fichier de script principal (le fichier .user.js) via la métadonnée Userscript suivante :
	// @resource	inspection-window-style-css https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/css/inspection-window-style.css
// Le fichier javascript contenant cette fonction de création de fenêtre d'inspection est chargé via la métadonnée suivante :
	// @require		https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/utility-tools/inspection-window-functions.js

function create_inspection_window(
	message,
	detections_for_highlight,
	detections_for_suggestion,
	tokenized_msg
) {
	const inspection_window = window.open(
		"", "shape_check", "width = 800, height = 600, resizable = yes, scrollbars = yes"
	) ;
	if (!inspection_window) return ;

	const inspection_window_doc = inspection_window.document ;

    const parser = new DOMParser() ;
    const parsed_html = parser.parseFromString(
		GM_getResourceText("inspect-window-html"), "text/html"
	) ;
    inspection_window_doc.documentElement.replaceWith(
        inspection_window_doc.adoptNode(parsed_html.documentElement)
    ) ;

	// Définition du style de la fenêtre d'inspection
	const inspection_window_style = inspection_window_doc.createElement("style") ;
	inspection_window_style.textContent = GM_getResourceText("inspection-window-style-css") ; // <style>...</style>
	inspection_window_doc.head.appendChild(inspection_window_style) ; // <head> <style>...</style> </head>

	// Paragraphe d'avertissement
	const warning_p = inspection_window_doc.querySelector(".inspection-window-main-block__warning-paragraph") ;

	const unique_detections = new Set(detections_for_highlight.map(detection => detection.text)) ;
	if (detections_for_highlight.length === 0)
		warning_p.textContent = "✓ Aucun élément interdit détecté." ;
	else {
		const count = unique_detections.size ;
		warning_p.textContent = `⚠ ${count} élément${count > 1 ? "s distincts" : ""} interdit${count > 1 ? "s" : ""} détecté${count > 1 ? "s" : ""}.` ;
	}

	// Paragraphe contenant le message
	const message_p = inspection_window_doc.querySelector(".inspection-window-main-block__message-paragraph") ;
	message_p.innerHTML = build_highlighted_message(message, detections_for_highlight) ;

	// Avertissement de la présence d'urls problématiques
	const detected_urls = detections_for_highlight.filter(d => d.is_url) ;
	if (detected_urls.length > 0) {
		const url_warning_box = inspection_window_doc.createElement("p") ;
		url_warning_box.classList.add("inspection-window-main-block__warning-paragraph") ;
		const unique_urls = [...new Set(detected_urls.map(d => d.text))] ;
		url_warning_box.textContent = `${url_warning_text(unique_urls)} (laissé(s) intact(s) pour ne pas casser les liens).` ;
		message_p.parentNode.insertBefore(url_warning_box, message_p) ;
	}

	// Bouton de copie (mode contournement de ce qui est connu ET inconnu (à droite de l'autre))
	const censorshipproof_message = heavily_obfuscate(message, tokenized_msg) ;

	const heavyObf_copy_button = inspection_window_doc.querySelector("#maximum-bypass") ;
	heavyObf_copy_button.addEventListener("click", () => set_text_in_clipboard(
		inspection_window,
		censorshipproof_message,
		heavyObf_copy_button
    )) ;

	// Le bouton Copier servant à obtenir la version du message se contentant de contourner la censure
	// des mots et groupes de mots pour lesquels la suppression automatique est attestée
	// n'est présent que s'il y a au moins un mot ou groupe de mots problématique dans le message,
	// sinon ça n'a pas de sens :
	if (detections_for_suggestion.length > 0) {
		// Bouton de copie (mode contournement de ce qui est connu)
		const modified_message = lightly_obfuscate(message, detections_for_suggestion) ;

		const lightObf_copy_button = inspection_window_doc.createElement("button") ;
		lightObf_copy_button.classList.add("inspection-window-main-block__buttons-block--copy-button") ;
		lightObf_copy_button.textContent = "Copier (contournement \"minimal\")" ;
		lightObf_copy_button.type = "button" ;
		lightObf_copy_button.addEventListener("click", () => set_text_in_clipboard(
			inspection_window,
			modified_message,
			lightObf_copy_button
		)) ;
		const buttons_block = inspection_window_doc.querySelector(".inspection-window-main-block__buttons-block") ;
		buttons_block.insertBefore(lightObf_copy_button, heavyObf_copy_button) ;
	}
}
