/**
 * ================ DÉFINITION DES DICTIONNAIRES DES MOTS ET GROUPES DE MOTS INTERDITS ================
 */

const basic_banwords_dictionary = {
	"A" : new Set([
		"afrance",
		"asterion", /* mais Kirby passe */
		"attali",
		"auschwitz",
	]),
	"B" : new Set([
		"babtou",
		"beurette",
		"blacked",
		"boche",
		"boucaque",
		"bougnoule",
	]),
	"C" : new Set([
		"chiapa",
		"chiappa",
		"chleuh",
		"choah",
		"crif",
	]),
	"D" : new Set([
		"daam",
		"deboucled",
		"decensured",
	]),
	"F" : new Set([
		"feldup",
		"femen",
		"feminism",
		"feminisme",
		"feminist",
		"feministe",
		"feminazi",
		"feuj",
		"fiotte",
	]),
	"G" : new Set([
		"genderfluid",
		"gwer",
	]),
	"H" : new Set([
		"hitler",
		"hoshi",
	]),
	"I" : new Set([
		"incel",
	]),
	"J" : new Set ([
		"juif",
		"jouif",
		"journalope",
		"jvarchive",
	]),
	"L" : new Set([
		"lardon",
		"leao52",
		"lgbt",
		"lola",
	]),
	"M" : new Set([
		"madz",
		"madmoizelle",
		"magalax",
		"michou",
	]),
	"N" : new Set([
		"nadia",
		"negre",
		"negro",
		"niakoue",
		"niaque",
		"nigger",
	]),
	"P" : new Set([
		"pede", /* mais pas PD */
		"ponce",
		"pouffiasse",
		"poufiasse",
		"pounde", /* donc poundé */
		"purge",
		"pute",
	]),
	"S" : new Set([
		"salop",
		"salope",
		"sardoche", /* suite à l'affaire Sardoche */
		"schiapa",
		"schiappa",
		"shoah",
		"sjw",
		"stalk", /* mais stalker, stalkeur et stalkeuse passent */
	]),
	"T" : new Set([
		"tarlouse",
		"tarlouze",
		"toubab",
		"travelo",
	]),
	"V" : new Set([
		"viol",
	]),
	"Y" : new Set([
		"youpin",
		"youpine",
		"youtre",
	]),
} ;

const new_banwords_dictionary = {
	"A" : new Set([
		"anus",
	]),
	"B" : new Set([
		"baise",
		"baisodrome",
		"batard",
		"beuh",
		"bite",
		"bouffon",
		"buter",
	]),
	"C" : new Set([
		"cannabis",
		"cassos",
		"chibre",
		"cocaine",
		"coke",
		"con",
		"conchie",
		"connard",
		"couilles", /* mais pas "couille" */
		"cretin",
		"cul",
		"cum",
	]),
	"D" : new Set([
		"demeure", /* à cause de demeuré, le bot assimile les mots accentués à leur version non accentuée */
		"drogue",
	]),
	"E" : new Set([
		"ejaculer",
		"emmerdeur", /* mais pas emmerde, ni emmerder */
		"encule",
		"enculer",
		"escorte",
	]),
	"F" : new Set([
		"fellation",
	]),
	"G" : new Set([
		"garce",
		"gay", /* au singulier */
		"gouine",
	]),
	"H" : new Set([
		"harem",
	]),
	"I" : new Set([
		"imbecile",
	]),
	"L" : new Set([
		"levrette",
	]),
	"M" : new Set([
		"milf",
	]),
	"O" : new Set([
		"onlyfans",
	]),
	"P" : new Set([
		"pedale",
		"penis",
		"pourriture",
		"porno",
		"prostituee",
	]),
	"Q" : new Set([
		"queue",
	]),
	"S" : new Set([
		"salaud",
		"salopard",
		"sein", /* mais pas seins */
		"seringue",
		"shit",
		"sodomie",
		"sperme",
	]),
	"T" : new Set([
		"tapette",
	]),
} ;



/**
 * ================ FUSION DES DICTIONNAIRES D'ENSEMBLES ================
 */

const all_banwords_dictionary = {} ;
// Dictionnaire d'ensembles fusionnant les deux dictionnaires d'ensembles
for (const dictionary of [basic_banwords_dictionary, new_banwords_dictionary]) {
    for (const [key_letter, set_of_words] of Object.entries(dictionary)) {
        all_banwords_dictionary[key_letter] ??= new Set() ;
        for (const word of set_of_words)
            all_banwords_dictionary[key_letter].add(word) ;
			// L'avantage est que Set élimine automatiquement les doublons.
			// Donc si un mot était présent dans les deux dictionnaires, il ne serait présent qu'une seule fois dans le Set.
    }
}
