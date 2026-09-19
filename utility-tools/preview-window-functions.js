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

	const check_window_title = check_window_doc.createElement("h1") ;
	check_window_title.textContent = "Analyse du message" ;

	const message_container = check_window_doc.createElement("div") ;
	message_container.classList.add("message") ;
	message_container.innerHTML = build_highlighted_message(message, detections) ;

	const warning_container = check_window_doc.createElement("div") ;
	warning_container.classList.add("warning") ;
	warning_container.textContent = warning ;

	check_window_doc.body.appendChild(check_window_title) ;
	check_window_doc.body.appendChild(message_container) ;
	check_window_doc.body.appendChild(warning_container) ;
}
