// Parts of speech
const adjectives = ["long", "sorry", "little", "richer"];
const adverbs = ["enough", "back"];
const conjunctions = ["as long as", "when"];
const determiners = {
	singular: ["my", "a"],
	plural: ["enough", "my"]
};
const interjections = ["mmm"];
const prepositions = ["as", "when"];
const nouns = {
	singular: ["lamp", "rope", "bomb", "friend", "ruby", "rupee", "link", "credit", "back"],
	plural: ["lamps", "ropes", "bombs", "friends", "rubies", "rupees", "links", "credits", "backs"],
	mass: ["oil"],
	proper: ["it", "yours", "enough", "Link"],
	pronoun: ["you", "I"] // "it" is also a pronoun but it is singular
};
const verbs = {
	base: ["want", "be", "have", "give", "come"], // Infinitive
	singular: ["wants", "is", "has", "gives", "comes"], // Indicative 3rd person singular
	plural: ["want", "are", "have", "give", "come"], // Indicative except 3rd person singular
	gerund: ["wanting", "being", "having", "giving", "coming"], // Gerund and present participle
	modal: ["can", "can not"] // Not a verb form
};
// Chance variables
const pluralDeterminerChance = 0.5; // Chance of a plural noun having a determiner
const multipleChance = 0.2; // Chance of there being multiple nouns, verbs, etc.
const nounPhraseChance = 0.2; // Chance of a verb phrase having a noun phrase
const formalChance = 0.5; // Chance of a sentence having a formal tone (i.e. no contractions)
// State variables
let verbForm = "singular";
// Helper functions
function choose(array) {
	return array[Math.floor(Math.random() * array.length)];
}
function chooseWeighted(array, generator = true) {
	const chance = Math.random();
	let previous = 0;
	for (const option of array) {
		if (chance < previous + option[0]) {
			return generator ? option[1]() : option[1];
		}
		previous += option[0];
	}
	const last = array.pop();
	return generator ? last[1]() : last[1]; // Last element
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
			verbForm = "singular";
			return choose(determiners.singular) +
			optional(multipleChance, () => oneOrMore(adjectives, multipleChance)) +
			" " +
			oneOrMore(nouns.singular, multipleChance, false);
		}],
		[0.2, () => { // Plural noun
			verbForm = "plural";
			return optional(pluralDeterminerChance, () => choose(determiners.plural), true) +
			optional(multipleChance, () => oneOrMore(adjectives, multipleChance), true) +
			optional(multipleChance, () => oneOrMore(nouns.singular, multipleChance, false), true) +
			choose(nouns.plural);
		}],
		[0.2, () => { // Pronoun that is not "he", "she", or "it"
			verbForm = "plural";
			return choose(nouns.pronoun);
		}],
		[0.1, () => { // Proper noun
			verbForm = "singular";
			return choose(nouns.proper);
		}],
		[0.1, () => { // Mass noun
			verbForm = "singular";
			return optional(pluralDeterminerChance, () => choose(determiners.plural), true) +
			optional(multipleChance, () => oneOrMore(adjectives, multipleChance), true) +
			optional(multipleChance, () => oneOrMore(nouns.singular, multipleChance, false), true) +
			choose(nouns.mass);
		}]
	];
	return chooseWeighted(subs);
}
function genVerbPhrase() {
	const subs = [
		[0.3, () => choose(verbs.modal) + " " + choose(verbs.base)],
		[0.7, () => choose(verbs[verbForm])]
	];
	return chooseWeighted(subs) + optional(multipleChance, () => oneOrMore(adverbs, multipleChance)) + optional(nounPhraseChance, genNounPhrase);
}
function genClause() {
	return genNounPhrase() + " " + genVerbPhrase();
}
function genSubClause() {
	return choose(prepositions) + " " + genClause();
}
function genSentence() {
	const subs = [
		[0.3, () => genClause()],
		[0.3, () => genClause() + choose([": ", "; ", `, ${choose(conjunctions)} `]) + genClause()],
		[0.15, () => genClause() + " " + genSubClause()],
		[0.15, () => genSubClause() + ", " + genClause()],
		[0.1, () => oneOrMore(() => genNounPhrase(), multipleChance, true, true) + ": " + genClause()]
	];
	const punctuation = [
		[0.5, "."],
		[0.2, "!"],
		[0.15, "?"],
		[0.1, "…"],
		[0.05, "‽"]
	];
	const corrections = [
		["I are", "I am"]
	];
	const contractions = [
		["I am", "I'm"],
		["I have", "I've"],
		["you are", "you're"],
		["you have", "you've"],
		["it is", "it's"],
		["can not", "can't"],
		["have not", "haven't"],
		["is not", "isn't"],
		["are not", "aren't"]
	];
	let sentence = chooseWeighted(subs) + chooseWeighted(punctuation, false);
	for (const correction of corrections) {
		sentence = sentence.replaceAll(correction[0], correction[1]);
	}
	if (roll(formalChance)) {
		const contractionChance = Math.random();
		for (const contraction of contractions) {
			if (roll(contractionChance)) {
				sentence = sentence.replaceAll(contraction[0], contraction[1]);
			}
		}
	}
	return capitalize(sentence);
}
exports.generate = function (sentenceAmount) {
	let sentences = [];
	while (sentenceAmount > 0) {
		sentences.push(genSentence());
		sentenceAmount--;
	}
	return sentences.join("\n");
};