import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import * as fs from "node:fs/promises";
import { format } from "date-fns";

import * as dotenv from "dotenv";
import { z } from "zod";
import path from "node:path";
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

const model = openai("gpt-4o-mini");

// 日记目录路径
const DIARY_DIR = path.join(import.meta.dirname, "diary");

// 获取日记文件的完整路径
const getDiaryPath = async (date: string) => {
	try {
		await fs.access(DIARY_DIR);
	} catch (error) {
		// 目录不存在，创建
		await fs.mkdir(DIARY_DIR, { recursive: true });
	}
	return path.join(DIARY_DIR, `${date}.txt`);
};

const readDiaryTool = tool({
	description: "读取指定日期的日记",
	parameters: z.object({
		date: z.string().describe("日记的日期，格式为 YYYY-MM-DD"),
	}),
	execute: async ({ date }) => {
		try {
			const filePath = await getDiaryPath(date);
			const content = await fs.readFile(filePath, "utf-8");
			return { success: true, content };
		} catch (error) {
			return { success: false, error: `找不到${date}的日记` };
		}
	},
});

const writeDiaryTool = tool({
	description: "写入指定日期的日记",
	parameters: z.object({
		date: z.string().describe("日记的日期，格式为 YYYY-MM-DD"),
		content: z.string().describe("日记内容"),
	}),
	execute: async ({ content, date }) => {
		try {
			const filePath = await getDiaryPath(date);
			await fs.writeFile(filePath, content);
			return { success: true, message: `成功保存${date}的日记` };
		} catch (error) {
			return { success: error, message: "保存日记失败" };
		}
	},
});

const getToday = (): string => {
	return format(new Date(), "yyyy-MM-dd");
};

const handleDiaryRequest = async (userPrompt: string) => {
	const currentDate = getToday();

	const { steps } = await generateText({
		model,
		system: `你是一个日记助手。今天是 ${currentDate}。分析用户的自然语言输入，判断用户是想要读取日记还是写入日记。
    - 如果用户想要读取日记，使用readDiary工具并提取用户提到的日期。如果用户没有指定日期，默认为今天 (${currentDate})。
    - 如果用户想要写入日记，使用writeDiary工具并提取用户想要记录的内容。如果用户没有指定日期，默认为今天 (${currentDate})。
    - 日期格式为YYYY-MM-DD，例如2025-03-01。`,
		prompt: userPrompt,
		tools: {
			readDiary: readDiaryTool,
			writeDiary: writeDiaryTool,
		},
	});

	// 找到最后一个 toolResults 步骤，并返回其 result
	for (let i = steps.length - 1; i >= 0; i--) {
		if (steps[i].toolResults && steps[i].toolResults.length > 0) {
			return steps[i].toolResults[0].result;
		}
	}

	return steps;
	// return { success: false, error: "No tool results found" };
};

const testDiary = async () => {
	// 模拟用户补写昨天的日记
	const writeYesterdayResult = await handleDiaryRequest(
		"帮我补写一下昨天的日记，昨天去爬了山",
	);
	console.log("补写昨天日记:\n");
	console.log(JSON.stringify(writeYesterdayResult, null, 2));

	// 模拟用户记录今天的日记
	const writeTodayResult = await handleDiaryRequest("今天骑了 10 公里自行车");
	console.log("记录今天日记:\n");
	console.log(JSON.stringify(writeTodayResult, null, 2));

	// 模拟用户查询今天的日记
	const queryResult = await handleDiaryRequest("今天发生了什么");
	console.log("查询今天:\n");
	console.log(JSON.stringify(queryResult, null, 2));

	// 模拟用户查询昨天的日记
	const queryYesterdayResult = await handleDiaryRequest("昨天发生了什么");
	console.log("查询昨天:\n");
	console.log(JSON.stringify(queryYesterdayResult, null, 2));

	// 更模糊的查询
	const fuzzyQueryResult = await handleDiaryRequest(
		"昨天和今天这两天发生了什么",
	);
	console.log("查询昨天和今天发生了什么:\n");
	console.log(JSON.stringify(fuzzyQueryResult, null, 2));
};

testDiary();
