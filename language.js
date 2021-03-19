const morshuCaps = ["Lamp", "Oil", "Rope", "Bombs", "You", "Want", "It", "It's", "Yours", "My", "Friend", "As", "Long", "Have", "Enough", "Rubies", "Sorry", "Link", "I", "Can't", "Give", "Credit", "Come", "Back", "When", "You're", "A", "Little", "Mmm", "Richer"];
const morshu = ["lamp", "oil", "rope", "bombs", "you", "want", "it", "it's", "yours", "my", "friend", "as", "long", "have", "enough", "rubies", "sorry", "Link", "link", "I", "can't", "give", "credit", "come", "back", "when", "you're", "a", "little", "mmm", "richer"];
const punct = [", ", "; ", ": ", "—"];
const punctFinal = [". ", "… ", "! ", "? ", "‽ "];
const punctStart = ["'", "\"", "(", ""];
const punctEnd = ["'", "\"", ")", "-" + randArray(morshu)];
const punctChance = 0.3; // Chance of punctuation instead of space
const punctFinalChance = 0.5; // Chance of a final instead of a non-final punctuation mark
const punctWrapChance = 0.2; // Chance of wrapping punctuation
function randArray(array) {
	return array[Math.floor(Math.random() * array.length)];
}
function randArrayFunc(array, conditional) {
	let index = Math.floor(Math.random() * array.length);
	conditional(index);
	return array[index];
}
function generateMorshu(wordCount) {
	let string = randArray(morshuCaps);
	let caps = false;
	for (let i = 0; i < wordCount - 1; i++) {
		if (Math.random() < punctChance) {
			if (Math.random() < punctFinalChance) {
				string += randArray(punctFinal);
				caps = true;
			}
			else {
				string += randArray(punct);
			}
		}
		else {
			string += " ";
		}
		if (Math.random() < punctWrapChance) {
			let punctWrapIndex = 0;
			string += randArrayFunc(punctStart, index => punctWrapIndex = index);
			string += randArray(caps ? morshuCaps : morshu);
			string += punctEnd[punctWrapIndex];
		}
		else {
			string += randArray(caps ? morshuCaps : morshu);
		}
		caps = false;
	}
	string += randArray(punctFinal);
	return string;
}