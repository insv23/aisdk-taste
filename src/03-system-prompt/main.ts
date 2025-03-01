import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { readFileSync } from "node:fs";
import path from "node:path";

import * as dotenv from "dotenv";
dotenv.config();

const baseURL = process.env.OPENAI_BASE_URL;

const openai = createOpenAI({
	baseURL,
});

const model = openai("gpt-4o-mini");

export const summaryText = async (input: string) => {
	const { text } = await generateText({
		model,
		messages: [
			{
				role: "system",
				content:
					"You are a text summarizer. " +
					"Summarize the text you receive. " +
					"Be concise. " +
					"Return only the summary. " +
					'Do not use the phrase "here is a summary". ' +
					"Highlight relevant phrases in bold. " +
					"The summary should be two sentences long.",
			},
			{
				role: "user",
				content: input,
			},
		],
	});

	return text;
};

const text = readFileSync(
	path.join(import.meta.dirname, "fox-who-devoured-history.md"),
	"utf-8",
);

const summary = await summaryText(text);

console.log(summary);
