import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";
import { z } from "zod";

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

const schema = z.object({
	name: z.string().describe("The name of user"),
	age: z.number().int().positive().describe("The user's age"),
	email: z.string().email().describe("The user's email address, @example.com"),
});

export const createFakeusers = async (input: string) => {
	const { object } = await generateObject({
		model,
		prompt: input,
		system: "You are generating fake users data",
		output: "array",
		schema,
	});

	return object;
};

const fakeUsers = await createFakeusers("生成五条用户数据，用户来自中国");

console.dir(fakeUsers, { depth: null });
