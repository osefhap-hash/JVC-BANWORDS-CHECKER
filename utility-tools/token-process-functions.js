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


function check_in_url(url_text, url_start_offset) {
    const url_detections = [] ;
    const tokenized_url = tokenize_with_positions(url_text) ;

    // Vérification des mots isolés dans l'URL
    for (const token of tokenized_url) {
        const canonical_token = canonical_form(token.text) ;
        const key_letter = canonical_token[0]?.toUpperCase() ;

        if (key_letter && all_banwords_dictionary[key_letter]?.has(canonical_token)) {
            url_detections.push({
                text	: token.text,
                start	: url_start_offset + token.start,
                end		: url_start_offset + token.end,
                is_url	: true // Indique clairement que c'est dans un lien
            }) ;
        }
    }
    // Vérification des phrases dans l'URL (au cas où)
    const len_tokens = tokenized_url.length ;
    for (let i = 0 ; i < len_tokens ; ++i) {
        let canonical_phrase = canonical_form(tokenized_url[i].text) ;

        for (let length = 2 ; length <= max_phrase_length ; ++length) {
            const end_index = i + length ;
            if (end_index > len_tokens) break ;

            const last_token = tokenized_url[end_index - 1] ;
            canonical_phrase += " " + canonical_form(last_token.text) ;
            const key_letter = canonical_phrase[0].toUpperCase() ;

            if (banphrases_dictionary[key_letter]?.has(canonical_phrase)) {
                const first_token = tokenized_url[i] ;
                url_detections.push({
                    text	: url_text.slice(first_token.start, last_token.end),
                    start	: url_start_offset + first_token.start,
                    end		: url_start_offset + last_token.end,
                    is_url	: true
                }) ;
            }
        }
    }
    return url_detections ;
}
