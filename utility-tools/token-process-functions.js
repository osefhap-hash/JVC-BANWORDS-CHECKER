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

    // 1. On trie les smileys du plus long au plus court pour éviter les collisions (ex: :-))) avant :-) avant ))
    const sorted_smileys = Array.from(jvc_smileys).sort((a, b) => b.length - a.length) ;

    // 2. On échappe proprement TOUTES les métacaractères regex pour chaque smiley individuellement
    const escaped_smileys = sorted_smileys.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) ;

    // 3. On construit la regex globale avec des groupes d'alternance sûrs
    const regex_pattern = `(https?:\\/\\/[^\\s]+|www\\.[^\\s]+)|(${escaped_smileys.join('|')})|([\\p{L}\\p{N}€<>]+)` ;
    const regex = new RegExp(regex_pattern, "giu") ;

    for (const match of str.matchAll(regex)) {
        const url_match    = match[1] ;
        const smiley_match = match[2] ;
        const word_match   = match[3] ;

        if (url_match) {
            tokens_list.push({
                text      : url_match,
                start     : match.index,
                end       : match.index + url_match.length,
                is_url    : true,
                is_smiley : false,
            }) ;
        } else if (smiley_match) {
            tokens_list.push({
                text      : smiley_match,
                start     : match.index,
                end       : match.index + smiley_match.length,
                is_url    : false,
                is_smiley : true,
            }) ;
        } else if (word_match) {
            tokens_list.push({
                text      : word_match,
                start     : match.index,
                end       : match.index + word_match.length,
                is_url    : false,
                is_smiley : false,
            }) ;
        }
    }
    return tokens_list ;
}


function check_in_url(url_text, url_start_offset) {
    const url_detections = [] ;

    // Au lieu de réutiliser tokenize_with_positions (qui traite l'URL comme un bloc),
    // on extrait directement tous les mots/tokens internes de l'URL :
    const sub_regex = /[\p{L}\p{N}€<>]+/gu ;
    const tokenized_url = [] ;

    for (const match of url_text.matchAll(sub_regex)) {
        tokenized_url.push({
            text  : match[0],
            start : match.index,
            end   : match.index + match[0].length
        }) ;
    }

    // 1. Vérification des mots isolés dans l'URL
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

    // 2. Vérification des phrases dans l'URL (au cas où)
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
