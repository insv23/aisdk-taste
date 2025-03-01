import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import * as dotenv from "dotenv";
dotenv.config();

const baseURL = process.env.OPENAI_BASE_URL;

const openai = createOpenAI({
	baseURL,
});

const model = openai("gpt-4o-mini");

export const answerQuestion = async (prompt: string) => {
	const { textStream } = streamText({
		model,
		prompt,
	});

	let fullText = "";

	for await (const text of textStream) {
		process.stdout.write(text);
		fullText += text;
	}

	// 当 shell（如 Zsh、Bash 或其他）收到没有以换行符结尾的输出时，
	// 它通常会显示一个视觉提示（如 % 符号）来表示最后一行是“不完整的”
	process.stdout.write("\n");

	return fullText;
};

await answerQuestion("太阳是什么颜色的?");
