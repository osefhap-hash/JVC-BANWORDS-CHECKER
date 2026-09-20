# JVC-BANWORDS-CHECKER

Script de détection des termes provoquant une suppression automatique d'un message sur JVC.

## Structure du projet

### Répertoire css :

Contient les fichiers de style utilisés pour :
* définir celui du bouton Vérifier (fichier check-btn.css), varie selon si JVChat est actif ou non,
* définir celui de la fenêtre "Analyse du message" (fichier check-preview.css)

### Répertoire data :

Contient les fichiers où sont listés les mots et groupes de mots provoquant une suppression automatique d'un message posté sur jeuxvideo.com :
* banwords.js : contient les mots interdits sous forme de dictionnaire d'ensembles (deux dictionnaires, basic_banwords_dictionary - la liste classique, trouvable sur la page https://jvflux.fr/Erreur_500 - et new_banwords_dictionary - la liste des mots récents, trouvable dans la même page)
* banphrases.js : contient les groupes de mots interdits sous forme de dictionnaire d'ensembles (un seul dictionnaire, banphrases_dictionary)

ATTENTION ! Les mots et groupes de mots dans les deux fichiers sont écrits (ET DOIVENT IMPÉRATIVEMENT L'ÊTRE POUR QUE LE SCRIPT MARCHE CORRECTEMENT) sous une forme canonique : en minuscules et sans accent !

### Répertoire utility-tools :

Contient les fichiers dans lesquels sont définies des fonctions utilitaires :
* token-process-functions.js : contient deux fonctions (canonical_form et tokenize_with_positions), traitant des chaînes de caractères, utilisées pour constituer la prévisualisation du message et la recherche de mots interdits en les comparant avec ceux dans la liste de référence.
* preview-window-functions.js : contient trois fonctions (escape_html, build_highlighted_message et show_check_preview), consacrées exclusivement à la confection de la fenêtre de prévisualisation du message.

### LE FICHIER PRINCIPAL (le script) : jvc-banwords-checker.user.js

Se base sur les fichiers précédents. Peut-être directement copié puis collé dans un nouveau script sur Tampermonkey.
