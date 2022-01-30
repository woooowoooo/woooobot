// Parts of speech
const adjectives = ["sorry", "rich", "little", "long"]; // Ordered by precedence
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
	singular: ["wants", "is", "has", "gives", "comes"], // Indicative 3rd person singular
	plural: ["want", "are", "have", "give", "come"], // Base + Indicative except 3rd person singular
	gerund: ["wanting", "being", "having", "giving", "coming"], // Gerund and present participle
	modal: ["can", "can not"] // Not a verb form
};
// Chance variables
const pluralDetChance = 0.5; // Chance of a plural noun having a determiner
const multipleChance = 0.2; // Chance of there being multiple nouns, verbs, etc.
const objectChance = 0.8; // Chance of a verb phrase having an object TODO: Replace with better transitivity stuff
const formalChance = 0.5; // Chance of a sentence having a formal tone (i.e. no contractions)
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
// RegEx ? + *
function optional(chance, generator, appendSpace = false) {
	if (!roll(chance)) {
		return "";
	}
	return appendSpace ? generator() + " " : " " + generator();
}
function plus(options, chance, separator = true, generator = false) {
	const option = choose(options);
	let selections = [generator ? options() : option];
	if (roll(chance) && (generator || (!generator && options.length > 1))) {
		if (!generator) {
			options.splice(options.indexOf(option), 1); // Prevent duplicates
		}
		selections.push(plus(options, chance, separator, generator));
	}
	return selections.join(separator ? ", " : " ");
}
function starOrdered(options, chance, separator = true, appendSpace = false) {
	let selections = [];
	for (const option of options) {
		if (roll(chance / options.length)) { // For similar probabilities as plus
			selections.push(option);
		}
	}
	if (selections.length === 0) {
		return "";
	}
	return (appendSpace ? "" : " ") + selections.join(separator ? ", " : " ") + (appendSpace ? " " : "");
}
// Generation
function genNounPhrase(verbForm) {
	const singleSubs = [
		[0.6, () => choose(determiners.singular) + " " + genAdjPhrase() + plus(nouns.singular, multipleChance, false)],
		[0.2, () => choose(nouns.proper)], // Proper noun
		[0.2, () => optional(pluralDetChance, () => choose(determiners.plural), true) + genAdjPhrase() + choose(nouns.mass)] // Mass noun
	];
	const pluralSubs = [
		[0.5, () => optional(pluralDetChance, () => choose(determiners.plural), true) + genAdjPhrase() + choose(nouns.plural)],
		[0.5, () => choose(nouns.pronoun)] // Pronoun that is not "he", "she", or "it"
	];
	return chooseWeighted(verbForm === "singular" ? singleSubs : pluralSubs);
}
function genVerbPhrase(verbForm) {
	const subs = [
		[0.6, () => choose(verbs[verbForm])],
		[0.2, () => choose(verbs.modal) + " " + choose(verbs.plural)], // Base = plural except for be
		[0.2, () => (verbForm === "singular" ? "is " : "are ") + choose(verbs.gerund)], // Present continuous
	];
	return chooseWeighted(subs) + starOrdered(adverbs, multipleChance) + optional(objectChance, () => genNounPhrase());
}
function genAdjPhrase() {
	return starOrdered(adjectives, multipleChance, true, true) + starOrdered(nouns.singular, multipleChance, false, true);
}
function genClause() {
	const number = [
		[0.6, "singular"],
		[0.4, "plural"]
	];
	const verbForm = chooseWeighted(number, false);
	return genNounPhrase(verbForm) + " " + genVerbPhrase(verbForm);
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
		[0.1, () => plus(() => genNounPhrase(), multipleChance, true, true) + ": " + genClause()]
	];
	const punctuation = [
		[0.5, "."],
		[0.2, "!"],
		[0.15, "?"],
		[0.1, "…"],
		[0.05, "‽"]
	];
	const corrections = [
		["I are", "I am"],
		["can are", "can be"],
		["can not are", "can not be"]
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
if (module === require.main) {
	console.log(exports.generate(10));
}