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

	// Regex globale combinant les URLs et les tokens classiques (mots/nombres)
    // On capture d'abord les URLs pour qu'elles soient traitées comme un seul bloc indivisible.
    const regex  = /(https?:\/\/[^\s]+|www\.[^\s]+)|([\p{L}\p{N}€<>]+)/gu ;
	//const regex  = /[\p{L}\p{N}€<>]+/gu ;

	// Les caractères espace , . ! ? - / ' sont donc des exemples de séparateurs, des caractères qui vont découper la chaîne.
	for (const match of str.matchAll(regex)) {
		const url_match  = match[1] ;
        const word_match = match[2] ;

		if (url_match)
			tokens_list.push({
                text	: url_match,
                start	: match.index,
                end		: match.index + url_match.length,
                is_url	: true, // <-- On marque le token comme étant un lien
            }) ;
		else if (word_match)
			tokens_list.push({
				text	: word_match,
				start	: match.index,
				end		: match.index + word_match.length,
				is_url	: false,
			}) ;
	}
	return tokens_list ;
}
