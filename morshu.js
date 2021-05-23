// Word lists
const words = ["lamp", "oil", "rope", "bombs", "you", "want", "it", "it's", "yours", "my", "friend", "as", "long", "have", "enough", "rubies", "sorry", "Link", "link", "I", "can't", "give", "credit", "come", "back", "when", "you're", "a", "little", "mmm", "richer"];
const punct = [", ", "; ", ": ", " — "];
const punctFinal = ["… ", "! ", "? ", "‽ "];
const punctWrap = {
	"'": "'",
	"\"": "\"",
	"(": ")"
};
// Chance variables
const punctChance = 0.3; // Chance of punctuation instead of space
const punctFinalChance = 0.5; // Chance of a final instead of a non-final punctuation mark
const punctSpecialChance = 0.5; // Chance of a special final punctuation instead of a period.
const punctWrapChance = 0.1; // Chance of wrapping punctuation
const hyphenChance = 0.05; // Chance of a hyphenated word
// Other variables
let final = false;
let caps = true;
// Functions
function choose(array) {
	return array[Math.floor(Math.random() * array.length)];
}
function roll(chance) {
	return Math.random() < chance;
}
function capitalize(word) {
	if (caps) {
		word = word.charAt(0).toUpperCase() + word.substring(1);
		caps = false;
	}
	return word;
}
function addPunctuation() {
	let punctuation = "";
	if (roll(punctChance)) {
		if (roll(punctFinalChance)) {
			if (roll(punctSpecialChance)) {
				punctuation = choose(punctFinal);
			} else {
				punctuation += ".";
			}
			final = true;
			caps = true;
		} else {
			punctuation += choose(punct);
		}
	} else {
		punctuation += " ";
	}
	return punctuation;
}
exports.generate = function (sentenceAmount) {
	let sentences = [];
	while (sentenceAmount > 0) {
		final = false;
		let sentence = "";
		while (!final) {
			const punct = roll(punctWrapChance) ? choose(Object.keys(punctWrap)) : "";
			sentence += punct ?? "";
			sentence += capitalize(choose(words));
			sentence += roll(hyphenChance) ? "-" + capitalize(choose(words)) : "";
			sentence += punctWrap[punct] ?? "";
			sentence += addPunctuation();
		}
		sentences.push(sentence);
		sentenceAmount--;
	}
	return sentences.join("\n");
};