import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, type LanguageModel } from "ai";

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

export const ask = async (model: LanguageModel, prompt: string) => {
	const { text } = await generateText({
		model,
		prompt,
	});

	return text;
};

const prompt = "讲一个苏联笑话";

const anthropicResult = await ask(aiClient("claude-3-5-haiku-latest"), prompt);
console.log("claude-3-5-haiku-latest:\n");
console.log(anthropicResult);

const openaiResult = await ask(aiClient("gpt-4o-mini"), prompt);
console.log("gpt-4o-mini:\n");
console.log(openaiResult);
