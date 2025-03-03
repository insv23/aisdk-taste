import { createOpenAI } from "@ai-sdk/openai";
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

const openai = createOpenAI({
	baseURL,
	apiKey,
});

// https://sdk.vercel.ai/docs/foundations/agents#orchestrator-worker
async function implementFeature(featureRequest: string) {
	// Orchestrator: Plan the implementation
	const { object: implementationPlan } = await generateObject({
		model: openai("o3-mini"),
		schema: z.object({
			files: z.array(
				z.object({
					purpose: z.string(),
					filePath: z.string(),
					changeType: z.enum(["create", "modify", "delete"]),
				}),
			),
			estimatedComplexity: z.enum(["low", "medium", "high"]),
		}),
		system:
			"You're a senior software architect planing feature implementations.",
		prompt: `Analyze this feature request and create a implementation plan:
            ${featureRequest}`,
	});

	// Workers: Execute the planned changes
	const fileChanges = await Promise.all(
		implementationPlan.files.map(async (file) => {
			// Each worker is specialized for the type of change
			const workerSystemPrompt = {
				create:
					"You are an expert at implementing new files following the best practices and project patterns.",
				modify:
					"You are an expert at modifying existing code while maintaining consistency and avoiding regression.",
				delete:
					"You are an expert at safely removing code while ensuring no break changes.",
			}[file.changeType];

			const { object: change } = await generateObject({
				model: openai("gpt-4o-mini"),
				schema: z.object({
					explanation: z.string(),
					code: z.string(),
				}),
				system: workerSystemPrompt,
				prompt: `Implement the change for ${file.filePath} to support:
                    ${file.purpose}
                    
                    Consider the overall feature context:
                    ${featureRequest}`,
			});

			return {
				file,
				implementation: change,
			};
		}),
	);

	return { plan: implementationPlan, changes: fileChanges };
}

// 简单的测试函数
async function testImplementFeature() {
	try {
		console.log("开始测试 implementFeature 函数...");

		// 测试案例 - 简单的特性请求
		const featureRequest = `
      添加一个用户个人资料页面，用户可以:
      1. 查看自己的基本信息
      2. 编辑个人信息
      3. 更新头像
    `;

		console.log(`特性请求: ${featureRequest}`);
		console.log("正在生成实现计划...");

		// 调用实现特性的函数
		const result = await implementFeature(featureRequest);

		// 输出计划
		console.log("\n--- 实现计划 ---");
		console.log(`估计复杂度: ${result.plan.estimatedComplexity}`);
		console.log("需要修改的文件:");
		result.plan.files.forEach((file, index) => {
			console.log(
				`${index + 1}. ${file.filePath} (${file.changeType}) - ${file.purpose}`,
			);
		});

		// 输出每个文件的具体变更
		console.log("\n--- 文件变更详情 ---");
		result.changes.forEach((change, index) => {
			console.log(`\n文件 ${index + 1}: ${change.file.filePath}`);
			console.log(`变更类型: ${change.file.changeType}`);
			console.log(`目的: ${change.file.purpose}`);
			console.log(`说明: ${change.implementation.explanation}`);
			console.log("代码:");
			console.log("----------------------------");
			console.log(change.implementation.code);
			console.log("----------------------------");
		});

		console.log("\n测试完成!");
		return result;
	} catch (error) {
		console.error("测试过程中发生错误:", error);
		throw error;
	}
}

// 运行测试
testImplementFeature()
	.then((result) => {
		console.log("测试成功完成");
	})
	.catch((error) => {
		console.error("测试失败:", error);
	});
