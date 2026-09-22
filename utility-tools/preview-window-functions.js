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

		// Deuxième lettre du mot problématique détecté => en italique JVC
		if (forbidden_text.length >= 2) {
			modified_message += forbidden_text[0] ;
			modified_message += "''" ;
			modified_message += forbidden_text[1] ;
			modified_message += "''" ;
			modified_message += forbidden_text.slice(2) ;
		}
		else modified_message += forbidden_text ;
		current_position = detection.end ;
	}
	modified_message += message.slice(current_position) ; // Texte restant
	return modified_message ;
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


// La fonction suivante - qui crée la fenêtre de prévisualisation - utilise les styles définis dans le fichier "css/check-preview.css"
// pour l'élaboration de la fenêtre de prévisualisation.
// La feuille de style est invoquée dans le fichier de script principal (le fichier .user.js) via la métadonnée Userscript suivante :
	// @resource     check-preview-css https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/css/check-preview.css
// Le fichier javascript contenant cette fonction de création de fenêtre de prévisualisation est chargé via la métadonnée suivante :
	// @require      https://raw.githubusercontent.com/osefhap-hash/JVC-BANWORDS-CHECKER/main/utility-tools/preview-window-functions.js

function show_check_preview(message, detections) {
	const check_window = window.open(
		"",
		"shape_check",
		"width = 800, height = 600, resizable = yes, scrollbars = yes"
	) ;
	if (!check_window) return ;

	const check_window_doc = check_window.document ;
	const unique_detections = new Set(detections.map(detection => detection.text)) ;
	let warning = "" ;

	if (detections.length === 0) warning = "✓ Aucun élément interdit détecté." ;
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
	analysis_message_container.innerHTML = build_highlighted_message(message, detections) ;

	analysis_column.appendChild(analysis_title) ;
	analysis_column.appendChild(analysis_warning_container) ;
	analysis_column.appendChild(analysis_message_container) ;
	boxes_container.appendChild(analysis_column) ;

	// Zone "Visualisation de la modification du message"
	// (seulement s'il y a des mots problématiques dans le message, sinon ça n'a pas de sens) :
	if (detections.length > 0) {
		const suggestion_column = check_window_doc.createElement("div") ;
		suggestion_column.classList.add("message-column") ;

		const suggestion_title = check_window_doc.createElement("h1") ;
		suggestion_title.textContent = "Suggestion de contournement de la censure" ;

		const modified_message_container = check_window_doc.createElement("div") ;
		modified_message_container.classList.add("message") ;
		const modified_message = build_modified_message(message, detections) ;
		modified_message_container.textContent = modified_message ;

		const copy_button = check_window_doc.createElement("button") ;
		copy_button.classList.add("copy-button") ;
		copy_button.textContent = "Copier" ;
		copy_button.type = "button" ;
		copy_button.addEventListener("click", () => set_text_in_clipboard(
			check_window,
			modified_message,
			copy_button
		)) ;

		suggestion_column.appendChild(suggestion_title) ;
		suggestion_column.appendChild(copy_button) ;
		suggestion_column.appendChild(modified_message_container) ;
		boxes_container.appendChild(suggestion_column) ;
	}
	check_window_doc.body.appendChild(boxes_container) ;
}
