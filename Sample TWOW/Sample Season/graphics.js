// S1 GRAPHICS
const {createCanvas, loadImage} = require("canvas");
const fs = require("fs").promises;
const FONT_STACK = "px Charter, serif";
const HEADER_HEIGHT = 240;
const ROW_HEIGHT = 120;
const WIDTH = 2400;
exports.drawScreen = async function (path, keyword, responses) {
	// Easily change to SVG by adding `, "svg"` after `ROW_HEIGHT`
	const canvas = createCanvas(WIDTH, HEADER_HEIGHT + ROW_HEIGHT * responses.length);
	const context = canvas.getContext("2d");
	// Header
	context.fillStyle = "white";
	context.fillRect(0, 0, WIDTH, HEADER_HEIGHT);
	context.fillStyle = "black";
	context.font = (HEADER_HEIGHT / 2) + FONT_STACK;
	context.textAlign = "center";
	context.fillText(keyword, WIDTH / 2, (HEADER_HEIGHT + context.measureText(keyword).actualBoundingBoxAscent) / 2);
	// Rows
	await responses.forEach(async (row, i) => {
		const offset = HEADER_HEIGHT + ROW_HEIGHT * i;
		context.fillStyle = `hsl(0, 0%, ${80 + 10 * (i % 2)}%)`;
		context.fillRect(0, offset, WIDTH, ROW_HEIGHT);
		context.fillStyle = "black";
		context.font = (ROW_HEIGHT / 3) + FONT_STACK;
		context.textAlign = "center";
		context.fillText(row[0], 60, offset + ROW_HEIGHT * 5 / 8);
		context.textAlign = "left";
		context.fillText(row[1], 120, offset + ROW_HEIGHT * 5 / 8, WIDTH - 180);
	});
	await fs.writeFile(path, canvas.toBuffer());
	console.log("Voting screen done");
};
exports.drawResults = async function (path, round, prompt, rankings, header = false) {
	header = header ? HEADER_HEIGHT : 0;
	const canvas = createCanvas(WIDTH, header + 40 + ROW_HEIGHT * rankings.length);
	const context = canvas.getContext("2d");
	// Header
	context.fillStyle = "white";
	context.fillRect(0, 0, WIDTH, header + 40);
	context.fillStyle = "black";
	if (header) {
		context.font = 40 + FONT_STACK;
		context.textAlign = "center";
		// Split the prompt into two lines
		if (context.measureText(prompt).width <= WIDTH - 60) {
			context.fillText(prompt, WIDTH / 2, 210, WIDTH - 60);
			context.font = 120 + FONT_STACK;
			context.fillText(round + " Results", WIDTH / 2, 130);
		} else {
			let line1 = [];
			let line2 = prompt.split(" ");
			const originalWidth = context.measureText(prompt).width;
			// Keep line 1 longer by looping on line 2's width instead of line 1's
			while (context.measureText(line2.join(" ")).width > originalWidth / 2) {
				line1.push(line2.shift());
			}
			context.fillText(line1.join(" "), WIDTH / 2, 170, WIDTH - 60);
			context.fillText(line2.join(" "), WIDTH / 2, 220, WIDTH - 60);
			context.font = 100 + FONT_STACK;
			context.fillText(round + " Results", WIDTH / 2, 110);
		}
	}
	context.font = 30 + FONT_STACK;
	context.textAlign = "right";
	context.fillText("Rank", 120, header + 30);
	context.textAlign = "center";
	context.fillText("Book", 180, header + 30);
	context.textAlign = "left";
	context.fillText("Author — Response", 240, header + 30);
	context.fillText("Percentile", WIDTH - 820, header + 30);
	context.fillText("Std. Deviation", WIDTH - 550, header + 30);
	context.fillText("Skew", WIDTH - 265, header + 30);
	context.fillText("Votes", WIDTH - 100, header + 30);
	// Rankings
	const hues = {
		"prize": "hsl(50, 90%, ",
		"alive": "hsl(100, 90%, ",
		"danger": "hsl(30, 90%, ",
		"dead": "hsl(0, 90%, ",
		"dummy": "hsl(0, 0%, ",
		"drp": "hsl(0, 0%, "
	};
	let typeFreqs = {};
	await rankings.forEach(async (ranking, i) => {
		const offset = header + 40 + ROW_HEIGHT * i;
		// Background
		if (ranking.type === "dummy") {
			context.fillStyle = "hsl(0, 0%, 90%)";
		} else {
			typeFreqs[ranking.type] ??= 0;
			typeFreqs[ranking.type]++;
			context.fillStyle = hues[ranking.type] + (80 - 10 * (typeFreqs[ranking.type] % 2)) + "%)";
		}
		context.fillRect(0, offset, WIDTH, ROW_HEIGHT);
		// Text
		context.fillStyle = "black";
		context.font = (ROW_HEIGHT * 2 / 3) + FONT_STACK;
		context.textAlign = "right";
		context.fillText(ranking.rank ?? "—", 120, offset + ROW_HEIGHT * 3 / 4);
		context.textAlign = "left";
		context.font = (ROW_HEIGHT / 2) + FONT_STACK;
		context.fillText(ranking.name, 120 + ROW_HEIGHT, offset + ROW_HEIGHT / 2);
		context.font = (ROW_HEIGHT / 4) + FONT_STACK;
		context.fillText(ranking.response, 123 + ROW_HEIGHT, offset + ROW_HEIGHT * 5 / 6, WIDTH - ROW_HEIGHT - 1000);
		context.font = (ROW_HEIGHT / 2) + FONT_STACK;
		context.textAlign = "right";
		context.fillText(ranking.percentile.toFixed(2) + "%", WIDTH - 600, offset + ROW_HEIGHT * 7 / 10);
		context.fillText(ranking.stDev.toFixed(2) + "%", WIDTH - 330, offset + ROW_HEIGHT * 7 / 10);
		context.fillText(ranking.skew.toFixed(2).replace("-", "–"), WIDTH - 140, offset + ROW_HEIGHT * 7 / 10);
		context.fillText(ranking.votes, WIDTH - 20, offset + ROW_HEIGHT * 7 / 10);
		const book = await loadImage("Sample TWOW/Sample Season/books/" + (ranking.book ?? "default-book.png"));
		context.drawImage(book, 120, offset, ROW_HEIGHT, ROW_HEIGHT);
	});
	await fs.writeFile(path, canvas.toBuffer());
	console.log("Results screen done");
};