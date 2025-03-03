import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
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

const openai = createOpenAI({
	baseURL,
	apiKey,
});

const schema = z.object({
	text: z.string().describe("The word or sentence to analyze"),
	letter: z
		.string()
		.length(1)
		.describe("The letter to count (single character)"),
});

type Params = z.infer<typeof schema>;

const countLetterTool = tool({
	description:
		"Count the number of occurrences of a specific letter in a given text. " +
		'Examples: how many "r" in "strawberry", how many "a" in "alibaba".',
	parameters: schema,
	execute: ({ text, letter }: Params): Promise<number> => {
		const textLower = text.toLowerCase();
		const letterLower = letter.toLowerCase();

		let count = 0;
		for (const char of textLower) {
			if (char === letterLower) count++;
		}

		return Promise.resolve(count);
	},
});

// 创建基于AI的字母计数应用
async function letterCount(prompt: string): Promise<string> {
	const { text: answer } = await generateText({
		model: openai("gpt-4o-mini", { structuredOutputs: true }),
		tools: {
			countLetter: countLetterTool,
		},
		maxSteps: 5,
		system:
			"你是一个专门分析文本中字母出现频率的助手。" +
			"当用户询问某个单词或句子中特定字母出现的次数时，" +
			"使用countLetter工具进行计算，并提供清晰的回答。",
		prompt: prompt,
	});

	return answer;
}

// 测试函数
async function main() {
	try {
		// 测试用例
		const question = '在单词"strawberry"中，字母"r"出现了几次？';
		const answer = await letterCount(question);
		console.log(`问题: ${question}`);
		console.log(`回答: ${answer}`);
	} catch (error) {
		console.error("处理过程中出错:", error);
	}
}

// 运行测试
main();
