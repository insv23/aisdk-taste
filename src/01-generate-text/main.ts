import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import * as dotenv from "dotenv";
dotenv.config();

const baseURL = process.env.OPENAI_BASE_URL;

const openai = createOpenAI({
	baseURL,
});

const model = openai("gpt-4o-mini");

export const answerQuestion = async (prompt: string) => {
	const { text } = await generateText({
		model,
		prompt,
	});

	return text;
};

const answer = await answerQuestion(
	"What is the chemical formula for dihydrogen monoxide?",
);

console.log(answer);
