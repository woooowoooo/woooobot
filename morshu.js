// Parts of speech
const adjectives = ["long", "sorry", "little", "richer"];
const adverbs = ["enough", "back"];
const conjunctions = ["as long as", "when"];
const determiners = ["enough", "my", "a"];
const interjections = ["mmm"];
const prepositions = ["as", "when"];
const nouns = {
	singular: ["lamp", "rope", "friend", "link", "credit", "back"],
	plural: ["bombs", "rubies", "rupees"],
	mass: ["oil"],
	proper: ["it", "yours", "enough", "Link"],
	pronoun: ["you", "I"] // "it" is also a pronoun but it is singular
};
const verbs = {
	singular: ["is"],
	plural: ["want", "are", "have", "give", "come"],
	modal: ["can", "can not"]
};
// Chance variables
const nounAdjunctChance = 0.2; // Chance of a noun phrase having a noun adjunct
const modalVerbChance = 0.3; // Chance of a verb being modified by a modal verb
const adjectiveChance = 0.3; // Chance of an extra adjective or adverb
const nounPhraseChance = 0.2; // Chance of a verb phrase having a noun phrase
const contractionChance = 0.5; // Chance of a potential contraction happening
// Other variables
const punctuation = [
	[0.5, "."],
	[0.2, "!"],
	[0.15, "?"],
	[0.1, "…"],
	[0.05, "‽"]
];
const contractions = [
	["it is", "it's"],
	["can not", "can't"],
	["you are", "you're"]
];
let number = "singular";
// Helper functions
function choose(array) {
	return array[Math.floor(Math.random() * array.length)];
}
function chooseWeighted(array, terminals = false) {
	const chance = Math.random();
	let previous = 0;
	for (const option of array) {
		if (chance < previous + option[0]) {
			return terminals ? option[1] : option[1]();
		}
		previous += option[0];
	}
	const last = array.pop();
	return terminals ? last[1] : last[1](); // Last element
}
function roll(chance) {
	return Math.random() < chance;
}
function capitalize(word) {
	return word.charAt(0).toUpperCase() + word.substring(1);
}
function oneOrMore(options, chance, separator = true, generator = false) {
	const option = choose(options);
	let text = generator ? options() : option;
	if (roll(chance) && (generator || (!generator && options.length > 1))) {
		text += separator ? ", " : " ";
		if (!generator) {
			options.splice(options.indexOf(option), 1); // Prevent duplicates
		}
		text += oneOrMore(options, chance, separator, generator);
	}
	return text;
}
function optional(chance, generator, appendSpace = false) {
	if (!roll(chance)) {
		return "";
	}
	return appendSpace ? generator() + " " : " " + generator();
}
// Generation
function genNounPhrase() {
	const subs = [
		[0.4, () => { // Singular noun
			number = "singular";
			return choose(determiners) + optional(adjectiveChance, () => oneOrMore(adjectives, adjectiveChance)) + " " + oneOrMore(nouns.singular, nounAdjunctChance, false);
		}],
		[0.2, () => { // Plural noun
			number = "plural";
			return optional(adjectiveChance, () => oneOrMore(adjectives, adjectiveChance), true) + optional(nounAdjunctChance, () => oneOrMore(nouns.singular, nounAdjunctChance, false), true) + choose(nouns.plural);
		}],
		[0.2, () => { // Pronoun that is not "he", "she", or "it"
			number = "plural";
			return choose(nouns.pronoun);
		}],
		[0.1, () => { // Proper noun
			number = "singular";
			return choose(nouns.proper);
		}],
		[0.1, () => { // Mass noun
			number = "singular";
			return optional(adjectiveChance, () => oneOrMore(adjectives, adjectiveChance), true) + oneOrMore(nouns.mass, nounAdjunctChance, false);
		}]
	];
	return chooseWeighted(subs);
}
function genVerbPhrase() {
	return optional(modalVerbChance, () => choose(verbs.modal), true) +
		choose(verbs[number]) +
		optional(adjectiveChance, () => oneOrMore(adverbs, adjectiveChance)) +
		optional(nounPhraseChance, genNounPhrase);
}
function genClause() {
	return genNounPhrase() + " " + genVerbPhrase();
}
function genSubClause() {
	return choose(prepositions) + " " + genClause();
}
function genSentence() {
	const subs = [
		[0.6, () => genClause()],
		[0.1, () => genClause() + choose([": ", "; ", `, ${choose(conjunctions)} `]) + genClause()],
		[0.1, () => genClause() + " " + genSubClause()],
		[0.1, () => genSubClause() + ", " + genClause()],
		[0.1, () => genNounPhrase() + ": " + genClause()]
	];
	let sentence = chooseWeighted(subs);
	for (const contraction of contractions) {
		if (roll(contractionChance)) {
			sentence = sentence.replaceAll(contraction[0], contraction[1]);
		}
	}
	return sentence + chooseWeighted(punctuation, true);
}
exports.generate = function (sentenceAmount) {
	let sentences = [];
	while (sentenceAmount > 0) {
		let sentence = genSentence();
		sentence = capitalize(sentence);
		sentences.push(sentence);
		sentenceAmount--;
	}
	return sentences.join("\n");
};