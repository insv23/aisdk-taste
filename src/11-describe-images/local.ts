import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { readFileSync } from "node:fs";
import path from "node:path";

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

const systemPrompt =
	"You will receive an image." +
	"Please create an alt text for the image." +
	"Be concise." +
	"Use adjectives only when necessary." +
	"Do not pass 160 characters." +
	"Use simple language.";

export const describeImage = async (imagePath: string) => {
	const imageAsUint8Array = readFileSync(imagePath);

	const { text } = await generateText({
		model,
		system: systemPrompt,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "image",
						image: imageAsUint8Array,
					},
				],
			},
		],
	});

	return text;
};

const description = await describeImage(
	path.join(import.meta.dirname, "./fireworks.jpg"),
);

console.log(description);
