// Parts of speech
const nouns = {
	singular: ["lamp", "rope", "bomb", "friend", "ruby", "rupee", "link", "credit", "back"],
	plural: ["lamps", "ropes", "bombs", "friends", "rubies", "rupees", "links", "credits", "backs"],
	mass: ["oil", "rope", "credit"],
	proper: ["Link"]
};
const pronouns = {
	subject: ["I", "you", "it"],
	object: ["me", "you", "it"],
	possDep: ["my", "your", "its"], // Also acts as determiners
	possInd: ["mine", "yours", "its"],
	enough: "enough"
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
		["are back", "is back", "being back"]
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
const questionChance = 0.2;
const singularChance = 0.6; // Chance of a singular noun
const pluralDetChance = 0.5; // Chance of a plural noun having a determiner
const notChance = 0.5; // Chance of a verb being qualified with "not"
const multipleChance = 0.2; // Chance of there being multiple nouns, verbs, etc.
const adjectiveChance = 0.1; // Chance of there being an adjective or noun adjunct
const enoughChance = 0.5; // Chance of an adjective being qualified with "enough"
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
function genNounPhrase(verbForm, object = false, direct = true) {
	const singleSubs = [
		[0.5, () => choose(determiners.singular) + " " + genAdjPhrase() + choose(nouns.singular)],
		[0.2, () => optional(pluralDetChance, () => choose(determiners.plural), true) + genAdjPhrase() + choose(nouns.mass)], // Mass noun
		[0.1, () => choose(nouns.proper)], // Proper noun
		[0.1, () => pronouns[object ? "object" : "subject"][2]], // 3p pronoun
		[0.1, () => choose(pronouns.possInd)] // "mine", "yours", "its"
	];
	const pluralSubs = [
		[0.5, () => optional(pluralDetChance, () => choose(determiners.plural), true) + genAdjPhrase() + choose(nouns.plural)],
		[0.5, () => pronouns[object ? "object" : "subject"][choose([0, 1])]] // Non-3p pronoun
	];
	if (verbForm === "singular" && object && direct && roll(0.2)) {
		return pronouns.enough;
	}
	return chooseWeighted(verbForm === "singular" ? singleSubs : pluralSubs);
}
function genAdjPhrase() {
	return starOrdered(adjectives, adjectiveChance, true, true) + starOrdered(nouns.singular, adjectiveChance, false, true);
}
function genClause(question = false) {
	// Choose verb
	const verbForm = roll(singularChance) ? "singular" : "plural";
	const singularity = verbForm === "singular" ? 1 : 0;
	let transitivity = choose([0, 1, 1, 1, 2]); // There are three transitive verbs out of five total
	const verb = choose(verbs[transitivity]);
	// Verb arguments
	const subject = genNounPhrase(verbForm);
	let objects = "";
	while (transitivity > 0) {
		objects += " " + genNounPhrase(roll(singularChance) ? "singular" : "plural", true, transitivity === 1);
		transitivity--;
	}
	// Generate rest of clause
	function questionSwitch(verb) {
		return (question ? verb + " " + subject : subject + " " + verb) + " " + optional(notChance, () => "not", true);
	}
	const subs = [
		[0.5, () => !question ? (subject + " " + verb[singularity] + objects) : chooseWeighted(subs)], // Would be a valid question if there was "do"
		[0.2, () => questionSwitch(["are", "is"][singularity]) + choose(adjectives) + optional(enoughChance, () => pronouns.enough)], // Copula
		[0.15, () => questionSwitch(choose(["can", "can't"])) + (verb[0] !== "are" ? verb[0] : "be") + objects], // Base = plural (except for be)
		[0.15, () => questionSwitch(["are", "is"][singularity]) + verb[2] + objects] // Present continuous
	];
	return chooseWeighted(subs);
}
function genSubClause() {
	return choose(prepositions) + " " + genClause();
}
function genSentence() {
	const isQuestion = roll(questionChance);
	const subs = [
		[0.35, () => genClause(isQuestion)],
		[0.15, () => genClause() + choose([": ", "; "]) + genClause(isQuestion)],
		[0.15, () => genClause(isQuestion) + " " + genSubClause()],
		[0.15, () => genSubClause() + ", " + genClause(isQuestion)],
		[0.1, () => genClause(isQuestion) + ", " + choose(conjunctions) + " " + genClause()],
		[0.1, () => plus(() => genNounPhrase(roll(singularChance) ? "singular" : "plural"), multipleChance, true, true) + ": " + genClause(isQuestion)]
	];
	const punctuation = [
		[0.6, "."],
		[0.3, "!"],
		[0.1, "…"],
	];
	const questionPunct = [
		[0.8, "?"],
		[0.2, "‽"]
	];
	const corrections = [
		["I are", "I am"],
		["are I", "am I"]
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
	let sentence = chooseWeighted(subs) + chooseWeighted(isQuestion ? questionPunct : punctuation, false);
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