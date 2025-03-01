import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamObject } from "ai";
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
	recipe: z.object({
		name: z.string().describe("The title of the ricipe"),
		ingredients: z
			.array(z.object({ name: z.string(), amount: z.string() }))
			.describe("The ingredients needed for the recipe"),
		steps: z.array(z.string()).describe("The steps to make the recipe"),
	}),
});

export const createRecipe = async (prompt: string) => {
	const result = await streamObject({
		model,
		prompt,
		schema,
		schemaName: "Recipe",
		system:
			"You are helping a user create a recipe." +
			"Use British English variants of ingredient names," +
			"like Coriander over Cilantro.",
	});

	for await (const obj of result.partialObjectStream) {
		console.clear();
		console.dir(obj, { depth: null });
	}

	const finalObject = await result.object;

	return finalObject.recipe;
};

await createRecipe("如何制作腌黄瓜?");
