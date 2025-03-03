import { createOpenAI } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
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

const model = openai("gpt-4o-mini");

// https://sdk.vercel.ai/docs/foundations/agents#sequential-processing-chains
async function generateMarketingCopy(input: string) {
	// First step: Generate marketing copy
	const { text: copy } = await generateText({
		model,
		prompt: `Write persuasive marketing copy for: ${input}. Focus on benefits and emotional appeal.`,
	});

	// Perform quality check on copy
	const { object: qualityMetrics } = await generateObject({
		model,
		schema: z.object({
			hasCallToAction: z.boolean(),
			emotionalAppeal: z.number().min(1).max(10),
			clarity: z.number().min(1).max(10),
		}),
		prompt: `Evaluate this marketing copy for:
			1. Presence of call to action (true/false)
			2. Emotional appeal (1-10)
			3. Clarity (1-10)

			Copy to evaluate: ${copy}`,
	});

	// If quality check fails, regenerate with more specific instructions
	if (
		!qualityMetrics.hasCallToAction ||
		qualityMetrics.emotionalAppeal < 7 ||
		qualityMetrics.clarity < 7
	) {
		const { text: improvedCopy } = await generateText({
			model,
			prompt: `Rewrite this marketing copy with:
				${!qualityMetrics.hasCallToAction ? "- A clear call to action" : ""}
				${qualityMetrics.emotionalAppeal < 7 ? "- Stronger emotional appeal" : ""}
				${qualityMetrics.clarity < 7 ? "- Improved clarity and directness" : ""}

				Original copy: ${copy}`,
		});

		return { copy: improvedCopy, qualityMetrics };
	}

	return { copy, qualityMetrics };
}

// 测试函数
async function testMarketingGenerator() {
	try {
		// 测试用例1：智能手表
		console.log("测试用例1：智能手表营销文案");
		const smartwatchResult = await generateMarketingCopy(
			"一款新型智能手表，具有心率监测、睡眠追踪和7天电池寿命",
		);
		console.log("生成的文案:", smartwatchResult.copy);
		console.log("质量评估:", smartwatchResult.qualityMetrics);
		console.log("------------------------");

		// 测试用例2：在线课程
		console.log("测试用例2：在线课程营销文案");
		const courseResult = await generateMarketingCopy(
			"Python编程入门课程，适合零基础学习者",
		);
		console.log("生成的文案:", courseResult.copy);
		console.log("质量评估:", courseResult.qualityMetrics);
		console.log("------------------------");

		// 测试用例3：有机食品
		console.log("测试用例3：有机食品营销文案");
		const organicFoodResult = await generateMarketingCopy(
			"本地有机蔬菜配送服务，每周新鲜直达",
		);
		console.log("生成的文案:", organicFoodResult.copy);
		console.log("质量评估:", organicFoodResult.qualityMetrics);
	} catch (error) {
		console.error("测试过程中发生错误:", error);
	}
}

// 运行测试
testMarketingGenerator()
	.then(() => console.log("测试完成"))
	.catch((err) => console.error("测试失败:", err));
