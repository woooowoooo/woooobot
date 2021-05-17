const morshuCaps = ["Lamp", "Oil", "Rope", "Bombs", "You", "Want", "It", "It's", "Yours", "My", "Friend", "As", "Long", "Have", "Enough", "Rubies", "Sorry", "Link", "I", "Can't", "Give", "Credit", "Come", "Back", "When", "You're", "A", "Little", "Mmm", "Richer"];
const morshu = ["lamp", "oil", "rope", "bombs", "you", "want", "it", "it's", "yours", "my", "friend", "as", "long", "have", "enough", "rubies", "sorry", "Link", "link", "I", "can't", "give", "credit", "come", "back", "when", "you're", "a", "little", "mmm", "richer"];
const punct = [", ", "; ", ": ", "—"];
const punctFinal = [". ", "… ", "! ", "? ", "‽ "];
const punctStart = ["'", "\"", "(", ""];
const punctEnd = ["'", "\"", ")", "-" + rand(morshu)];
const punctChance = 0.3; // Chance of punctuation instead of space
const punctFinalChance = 0.5; // Chance of a final instead of a non-final punctuation mark
const punctWrapChance = 0.15; // Chance of wrapping punctuation
function rand(array) {
	return array[Math.floor(Math.random() * array.length)];
}
exports.generate = function (wordCount) {
	let string = rand(morshuCaps);
	let caps = false;
	for (let i = 0; i < wordCount - 1; i++) {
		if (Math.random() < punctChance) {
			if (Math.random() < punctFinalChance) {
				string += rand(punctFinal);
				caps = true;
			} else {
				string += rand(punct);
			}
		} else {
			string += " ";
		}
		if (Math.random() < punctWrapChance) {
			let punctWrapIndex = Math.floor(Math.random() * punctStart.length);
			string += punctStart[punctWrapIndex];
			string += rand(caps ? morshuCaps : morshu);
			string += punctEnd[punctWrapIndex];
		} else {
			string += rand(caps ? morshuCaps : morshu);
		}
		caps = false;
	}
	string += rand(punctFinal);
	return string;
};