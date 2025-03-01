import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";

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

const aiClient = createOpenAICompatible({
	name: "aiClient",
	baseURL,
	apiKey,
});

const model = aiClient("gpt-4o-mini");

export const classifySentiment = async (text: string) => {
	const { object } = await generateObject({
		model,
		prompt: text,
		output: "enum",
		enum: ["positive", "negative", "neutral"],
		system:
			"Classify the sentiment of the text as either" +
			"positive, negative, or neutral.",
	});

	return object;
};

const result = await classifySentiment("我吃了饭，吃到想吐");

console.dir(result);
