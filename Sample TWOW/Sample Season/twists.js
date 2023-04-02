const crypto = require("crypto");
const twists = {
	backwards: {
		title: "sdrawkcaB",
		description: "Your response will be flipped horizontally.",
		execute: function (response) {
			return response.split(/(?:)/u).reverse().join("");
		}
	},
	caesar: {
		title: "Caesar Cipher",
		description: "Every letter in your response will shifted through the alphabet.",
		execute: function (response, distance = 13, numberDistance = Math.round(distance / 2.6)) {
			return response.split("").map(letter => {
				const char = letter.charCodeAt(0);
				if (char >= 48 && char < 58) { // Only supports ASCII
					return String.fromCharCode((char - 48 + numberDistance) % 10 + 48);
				} else if (char >= 65 && char < 91) {
					return String.fromCharCode((char - 65 + distance) % 26 + 65);
				} else if (char >= 97 && char < 123) {
					return String.fromCharCode((char - 97 + distance) % 26 + 97);
				}
				return letter;
			}).join("");
		}
	},
	random: {
		title: "Random Twist",
		description: "Uses a random twist.",
		execute: function (response, list = Object.keys(twists)) {
			const twist = list[Math.floor(Math.random() * list.length)];
			return twists[twist].execute(response);
		}
	},
	replace: {
		title: "Find and Replace",
		description: "All occurances of a string will be replaced with another.",
		execute: function (response, replacee = "t", replacer = "twow") {
			return response.replaceAll(replacee, replacer);
		}
	},
	sha256: {
		title: "SHA-256",
		description: "Voters will see the possibly salted SHA-256 hash (in an email-friendly:tm: manner) of your response.",
		execute: function (response, salt = "") {
			return crypto.createHash("sha256").update(response + salt).digest("base64");
		}
	},
	snap: {
		title: "Thanos Snap",
		description: "Perfectly balanced, as all things should be.",
		execute: function (response) {
			return response.split("").filter(() => Math.random() < 0.5).join("");
		}
	}
};
module.exports = twists;