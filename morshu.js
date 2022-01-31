// Parts of speech
const nouns = {
	singular: ["lamp", "rope", "bomb", "friend", "ruby", "rupee", "link", "credit", "back"],
	plural: ["lamps", "ropes", "bombs", "friends", "rubies", "rupees", "links", "credits", "backs"],
	mass: ["oil", "rope", "credit"],
	proper: ["enough", "Link"]
};
const pronouns = {
	subject: ["I", "you", "it"],
	object: ["me", "you", "it"],
	possDep: ["my", "your", "its"], // Also acts as determiners
	possInd: ["mine", "yours", "its"]
};
const determiners = {
	singular: [...pronouns.possDep, "a", "a", "a"], // Too lazy to change singular to weighted
	plural: [...pronouns.possDep, "enough"]
};
// Sorted by transitivity; each verb is of form [base + non-3p singular, 3p singular, gerund]
// Adverbs are integrated
const verbs = [
	[
		["come", "comes", "coming"],
		["come back", "comes back", "coming back"],
		["come enough", "comes enough", "coming enough"],
		["are back", "is back", "being back"],
	],
	[
		["want", "wants", "wanting"],
		["are", "is", "being"],
		["have", "has", "having"],
		["give back", "gives back", "giving back"]
	],
	[["give", "gives", "giving"]]
];
const modals = ["can", "can not"];
const adjectives = ["long", "sorry", "little", "rich"];
const conjunctions = ["as long as", "when"];
const prepositions = ["as", "when"];
const interjections = ["mmm"];
// Chance variables
const pluralDetChance = 0.5; // Chance of a plural noun having a determiner
const multipleChance = 0.2; // Chance of there being multiple nouns, verbs, etc.
const adjectiveChance = 0.1; // Chance of there being an adjective or noun adjunct
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
function genNounPhrase(verbForm, object = false) {
	const singleSubs = [
		[0.6, () => choose(determiners.singular) + " " + genAdjPhrase() + plus(nouns.singular, multipleChance, false)],
		[0.15, () => optional(pluralDetChance, () => choose(determiners.plural), true) + genAdjPhrase() + choose(nouns.mass)], // Mass noun
		[0.1, () => choose(nouns.proper)], // Proper noun
		[0.1, () => pronouns[object ? "object" : "subject"][2]], // 3p pronoun
		[0.05, () => choose(pronouns.possInd)] // "mine", "yours", "its"
	];
	const pluralSubs = [
		[0.5, () => optional(pluralDetChance, () => choose(determiners.plural), true) + genAdjPhrase() + choose(nouns.plural)],
		[0.5, () => pronouns[object ? "object" : "subject"][choose([0, 1])]] // Non-3p pronoun
	];
	return chooseWeighted(verbForm === "singular" ? singleSubs : pluralSubs);
}
function genVerbPhrase(verbForm) {
	let transitivity = choose([0, 1, 1, 1, 2]); // There are three transitive verbs out of five total
	const verb = choose(verbs[transitivity]);
	let objects = "";
	while (transitivity > 0) {
		objects += " " + genNounPhrase(roll(0.6) ? "singular" : "plural", true);
		transitivity--;
	}
	const subs = [
		[0.5, () => verb[verbForm === "singular" ? 1 : 0] + objects],
		[0.2, () => (verbForm === "singular" ? "is" : "are") + " " + choose(adjectives)], // Copula
		[0.15, () => choose(modals) + " " + verb[0] + objects], // Base = plural (except for be)
		[0.15, () => (verbForm === "singular" ? "is" : "are") + " " + verb[2] + objects] // Present continuous
	];
	return chooseWeighted(subs);
}
function genAdjPhrase() {
	return starOrdered(adjectives, adjectiveChance, true, true) + starOrdered(nouns.singular, adjectiveChance, false, true);
}
function genClause() {
	const verbForm = roll(0.6) ? "singular" : "plural";
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
		[0.1, () => plus(() => genNounPhrase(roll(0.6) ? "singular" : "plural"), multipleChance, true, true) + ": " + genClause()]
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