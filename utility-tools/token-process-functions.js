/**
 * ================ FONCTIONS UTILITAIRES POUR LA MANIPULATION DES TOKENS ================
 */

function canonical_form(word) {
	return word
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/€/g, "e") ;
}


function tokenize_with_positions(str) {
	const tokens_list = [] ;
	const regex  = /[\p{L}\p{N}€<>]+/gu ;
	// Les caractères espace , . ! ? - / ' sont donc des exemples de séparateurs, des caractères qui vont découper la chaîne.
	for (const match of str.matchAll(regex))
		tokens_list.push({
			text	: match[0],
			start	: match.index,
			end		: match.index + match[0].length,
		}) ;
	return tokens_list ;
}
