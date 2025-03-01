import { createOpenAI } from "@ai-sdk/openai";
import { cosineSimilarity, embed, embedMany } from "ai";

import * as dotenv from "dotenv";
dotenv.config();

const baseURL = process.env.OPENAI_BASE_URL;
const apiKey = process.env.OPENAI_API_KEY;

if (!baseURL || !apiKey) {
	let errorMessage =
		"Error: Missing required environment variables for OpenAI integration.\n";

	if (!baseURL) {
		errorMessage += "- OPENAI_BASE_URL is not set.\n";
	}

	if (!apiKey) {
		errorMessage += "- OPENAI_API_KEY is not set.\n";
	}

	console.error(errorMessage);
	process.exit(1);
}

const openai = createOpenAI({
	baseURL,
	apiKey,
});

const model = openai.embedding("text-embedding-3-small");

const values = ["Dog", "Cat", "Car", "Bike"];

const { embeddings } = await embedMany({
	model,
	values,
});

const vectorDatabase = embeddings.map((embedding, index) => ({
	value: values[index],
	embedding,
}));

const searchItem = await embed({
	model,
	value: "Pedal",
});

const entries = vectorDatabase.map((entry) => {
	return {
		value: entry.value,
		simility: cosineSimilarity(entry.embedding, searchItem.embedding),
	};
});

const sortedEntries = entries.sort((a, b) => b.simility - a.simility);

console.dir(sortedEntries, { depth: null });
