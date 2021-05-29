// Word lists
const adjectives = ["long", "sorry", "little", "richer"];
const adverbs = ["enough", "can", "not", "back", "when"];
const determiners = ["yours", "enough", "my", "a"];
const interjections = ["mmm"];
const nouns = ["lamp", "oil", "rope", "bombs", "friend", "rubies", "rupees", "link", "credit", "back"];
const properNouns = ["you", "it", "enough", "Link", "I"]; // Also includes pronouns
const prepositions = ["as", "when"];
const verbs = ["want", "is", "have", "give", "come", "are"];
// Punctuation
const punct = [", ", "; ", ": ", " — "];
const punctFinal = ["… ", "! ", "? ", "‽ "];
// Chance variables
const properChance = 0.5; // Chance of getting a proper noun or pronoun
const adjectiveChance = 0.4; // Chance of an extra adjective or adverb
const punctSpecialChance = 0.5; // Chance of a special punctuation instead of a period
const multiClauseChance = 0.2; // Chance of a complex sentence (multiple clauses)
// Helper functions
function choose(array) {
	return array[Math.floor(Math.random() * array.length)];
}
function roll(chance) {
	return Math.random() < chance;
}
function capitalize(word) {
	return word.charAt(0).toUpperCase() + word.substring(1);
}
// Generation
function genNounPhrase() {
	if (roll(properChance)) {
		return choose(properNouns);
	}
	let nounPhrase = choose(determiners) + " ";
	if (roll(adjectiveChance)) {
		nounPhrase += choose(adjectives) + " ";
	}
	nounPhrase += choose(nouns);
	return nounPhrase;
}
function genVerbPhrase() {
	if (roll(adjectiveChance)) {
		return choose(adverbs) + " " + genVerbPhrase();
	}
	return choose(verbs) + " " + genNounPhrase();
}
function genClause() {
	return genNounPhrase() + " " + genVerbPhrase();
}
function genSentence() {
	let sentence = genClause();
	if (roll(multiClauseChance)) {
		sentence += choose(punct);
		sentence += genClause();
	}
	if (roll(punctSpecialChance)) {
		sentence += choose(punctFinal);
	} else {
		sentence += ".";
	}
	return sentence;
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