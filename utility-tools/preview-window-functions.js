/**
 * ================ FONCTIONS UTILITAIRES POUR LA CRÉATION DE LA FENÊTRE DE PRÉVISUALISATION ================
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


function build_modified_message(message, detections) {
	let modified_message = "" ;
	let current_position = 0 ;

	for (const detection of detections) {
		modified_message += message.slice(current_position, detection.start) ; // Texte normal avant la détection
		const forbidden_text = message.slice(detection.start, detection.end) ; // Texte de la détection

		// Deuxième lettre du mot problématique détecté => Zero Width Joiner (ZWJ)
		if (forbidden_text.length >= 2) {
			modified_message += forbidden_text[0] ;
			modified_message += '\u200D' ;
			modified_message += forbidden_text.slice(1) ;
		}
		else modified_message += forbidden_text ;
		current_position = detection.end ;
	}
	modified_message += message.slice(current_position) ; // Texte restant
	return modified_message ;
}


function build_paranoid_message(message, tokenized_msg) {
    let paranoid_message = "" ;
    let current_position = 0 ;

    for (const token of tokenized_msg) {
        // Texte normal avant le token
        paranoid_message += message.slice(current_position, token.start) ;
        const token_text = token.text ;

        // Si c'est un lien ou un mot trop court (< 3 caractères), on le laisse intact
        if (token.is_url || token_text.length < 3) paranoid_message += token_text ;
        else { // Application du ZWJ sur TOUS les mots
            let modified_word = token_text[0] + '\u200D' + token_text.slice(1) ;
            paranoid_message += modified_word ;
        }
        current_position = token.end ;
    }
    // Texte restant après le dernier token
    paranoid_message += message.slice(current_position) ;
    return paranoid_message ;
}


async function set_text_in_clipboard(current_window, text, copy_btn) {
	try {
		await current_window.navigator.clipboard.writeText(text) ;
		copy_btn.textContent = "Copié !" ;
		setTimeout(() => { copy_btn.textContent = "Copier" ; }, 1500) ;
	} catch (error) {
		console.error("Impossible de copier le texte :", error) ;
	}
}


// Petite fonction utilitaire pour formuler joliment le texte des liens
function url_warning_text(urls) {
    if (urls.length === 1) return `Un mot interdit a été détecté dans le lien : "${urls[0]}"` ;
    return `Des mots interdits ont été détectés dans ${urls.length} liens.` ;
}


// La fonction suivante - qui crée la fenêtre de prévisualisation - utilise les styles définis dans le fichier "css/check-preview.css"
// pour l'élaboration de la fenêtre de prévisualisation.
// La feuille de style est invoquée dans le fichier de script principal (le fichier .user.js) via la métadonnée Userscript suivante :
	// @resource     check-preview-css https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/css/check-preview.css
// Le fichier javascript contenant cette fonction de création de fenêtre de prévisualisation est chargé via la métadonnée suivante :
	// @require      https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/utility-tools/preview-window-functions.js

function show_check_preview(message, detections_for_highlight, detections_for_suggestion, tokenized_msg) {
	const check_window = window.open(
		"",
		"shape_check",
		"width = 800, height = 600, resizable = yes, scrollbars = yes"
	) ;
	if (!check_window) return ;

	const check_window_doc = check_window.document ;
	const unique_detections = new Set(detections_for_highlight.map(detection => detection.text)) ;
	let warning = "" ;

	if (detections_for_highlight.length === 0) warning = "✓ Aucun élément interdit détecté." ;
	else {
		const count = unique_detections.size ;
		warning = `⚠ ${count} élément${count > 1 ? "s distincts" : ""} interdit${count > 1 ? "s" : ""} détecté${count > 1 ? "s" : ""}.` ;
	}
	check_window_doc.title = "Analyse du message" ; // <title>Analyse du message</title>

	// Définition du style de la fenêtre de prévisualisation
	const preview_style = check_window_doc.createElement("style") ;
	preview_style.textContent = GM_getResourceText("check-preview-css") ; // <style>...</style>
	check_window_doc.head.appendChild(preview_style) ; // <head> <style>...</style> </head>



	/* ======== Conteneur des deux zones de message côte à côte ======== */
	const boxes_container = check_window_doc.createElement("div") ;
	boxes_container.classList.add("boxes-container") ;

	// Zone "Analyse du message"
	const analysis_column = check_window_doc.createElement("div") ;
	analysis_column.classList.add("message-column") ;

	const analysis_title = check_window_doc.createElement("h1") ;
	analysis_title.textContent = "Analyse du message" ;

	const analysis_warning_container = check_window_doc.createElement("div") ;
	analysis_warning_container.classList.add("warning") ;
	analysis_warning_container.textContent = warning ;

	const analysis_message_container = check_window_doc.createElement("div") ;
	analysis_message_container.classList.add("message") ;
	analysis_message_container.innerHTML = build_highlighted_message(message, detections_for_highlight) ;

	analysis_column.appendChild(analysis_title) ;
	analysis_column.appendChild(analysis_warning_container) ;
	// --- NOUVEAU : Indication pour les liens compromis ---
    const url_detections = detections_for_highlight.filter(d => d.is_url) ;
    if (url_detections.length > 0) {
        const url_warning_box = check_window_doc.createElement("div") ;
        url_warning_box.style.marginTop	= "12px" ;
        url_warning_box.style.fontSize	= "14px" ;
        url_warning_box.style.color		= "#ffaa00" ; // Orange d'avertissement

        const unique_urls = [...new Set(url_detections.map(d => d.text))] ;
        url_warning_box.textContent = `${url_warning_text(unique_urls)} (laissés intacts pour ne pas casser les liens).` ;
        
        analysis_column.appendChild(url_warning_box) ;
    }
    // ----------------------------------------------------
	analysis_column.appendChild(analysis_message_container) ;
	boxes_container.appendChild(analysis_column) ;

	// Zone "Visualisation de la modification du message"
	// (seulement s'il y a des mots problématiques dans le message, sinon ça n'a pas de sens) :
	if (detections_for_suggestion.length > 0) {
		const suggestion_column = check_window_doc.createElement("div") ;
		suggestion_column.classList.add("message-column") ;

		const suggestion_title = check_window_doc.createElement("h1") ;
		suggestion_title.textContent = "Suggestion de contournement de la censure" ;

		const modified_message_container = check_window_doc.createElement("div") ;
		modified_message_container.classList.add("message") ;
		const modified_message = build_modified_message(message, detections_for_suggestion) ;
		modified_message_container.textContent = modified_message ;

		// Conteneur pour aligner les boutons côte à côte
        const buttons_container = check_window_doc.createElement("div") ;
        buttons_container.style.display = "flex" ;
        buttons_container.style.gap = "10px" ;
        buttons_container.style.marginBottom = "10px" ;

		const copy_button = check_window_doc.createElement("button") ;
		copy_button.classList.add("copy-button") ;
		copy_button.textContent = "Copier (contournement minimal)" ;
		copy_button.type = "button" ;
		copy_button.addEventListener("click", () => set_text_in_clipboard(
			check_window,
			modified_message,
			copy_button
		)) ;

		// Bouton de copie mode paranoïaque (à droite de l'autre)
        const paranoid_message = build_paranoid_message(message, tokenized_msg) ;

        const copy_paranoid_button = check_window_doc.createElement("button") ;
        copy_paranoid_button.classList.add("copy-button") ;
        copy_paranoid_button.textContent = "Copier (contournement \"paranoïaque\")" ;
        copy_paranoid_button.type = "button" ;
        copy_paranoid_button.addEventListener("click", () => set_text_in_clipboard(
            check_window,
            paranoid_message,
            copy_paranoid_button
        )) ;

		buttons_container.appendChild(copy_button) ;
		buttons_container.appendChild(copy_paranoid_button) ;

		suggestion_column.appendChild(suggestion_title) ;
		suggestion_column.appendChild(buttons_container) ;
		suggestion_column.appendChild(modified_message_container) ;
		boxes_container.appendChild(suggestion_column) ;
	}
	check_window_doc.body.appendChild(boxes_container) ;
}
