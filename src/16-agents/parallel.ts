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

// https://sdk.vercel.ai/docs/foundations/agents#parallel-processing
// Example: Parallel code review with multiple specialized reviewers
type SecurityReview = {
	vulnerabilities: string[];
	riskLevel: "low" | "medium" | "high";
	suggestions: string[];
};

type PerformanceReview = {
	issues: string[];
	impact: "low" | "medium" | "high";
	optimization: string[];
};

type MaintainabilityReview = {
	concerns: string[];
	qualityScore: number;
	recommendations: string[];
};

type CodeReviewResult = {
	security: SecurityReview;
	performance: PerformanceReview;
	maintainability: MaintainabilityReview;
	summary: string;
};

async function parallelCodeReview(code: string): Promise<CodeReviewResult> {
	// Run parallel review
	const [securityReview, performanceReview, maintainabilityReview] =
		await Promise.all([
			generateObject({
				model,
				system:
					"You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.",
				schema: z.object({
					vulnerabilities: z.array(z.string()),
					riskLevel: z.enum(["low", "medium", "high"]),
					suggestions: z.array(z.string()),
				}),
				prompt: `Review this code:
                    ${code}`,
			}),

			generateObject({
				model,
				system:
					"You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.",
				schema: z.object({
					issues: z.array(z.string()),
					impact: z.enum(["low", "medium", "high"]),
					optimization: z.array(z.string()),
				}),
				prompt: `Review this code:
                    ${code}`,
			}),

			generateObject({
				model,
				system:
					"You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.",
				schema: z.object({
					concerns: z.array(z.string()),
					qualityScore: z.number().min(1).max(10),
					recommendations: z.array(z.string()),
				}),
				prompt: `Review this code:
                    ${code}`,
			}),
		]);

	const reviewData = {
		security: securityReview.object,
		performance: performanceReview.object,
		maintainability: maintainabilityReview.object,
	};

	// Aggregate results using another model instance
	const { text: summary } = await generateText({
		model,
		system: "You are a technical lead summarizing multiple code reviews.",
		prompt: `Synthesize these code review results into a concise summary with key actions:
            ${JSON.stringify(reviewData, null, 2)}`,
	});

	return { ...reviewData, summary };
}

// 测试函数
async function testParallelCodeReview() {
	console.log("开始测试 parallelCodeReview 函数...");

	// 测试用例 - 有潜在问题的示例代码
	const sampleCode = `
        function login(username, password) {
          // 不安全的查询构建方式
          const query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
          
          // 密码在客户端暴露
          localStorage.setItem('credentials', username + ':' + password);
          
          // 潜在的性能问题 - 大型循环
          for(let i = 0; i < 10000; i++) {
            console.log("Processing login step: " + i);
          }
          
          // 可维护性问题 - 重复代码，命名不清
          function a() {
            let x = 1;
            let y = 2;
            return x + y;
          }
          
          function b() {
            let x = 1;
            let y = 2;
            return x + y;
          }
          
          return query;
        }
      `;

	try {
		// 执行并记录开始时间
		const startTime = Date.now();
		console.log("正在执行代码审查...");

		// 调用并获取结果
		const result = await parallelCodeReview(sampleCode);

		// 记录完成时间
		const endTime = Date.now();
		console.log(`代码审查完成！耗时: ${endTime - startTime}ms`);

		// 打印每种审查的结果
		// 安全审查结果
		console.log("\n=== 安全审查结果 ===");
		console.log(`风险等级: ${result.security.riskLevel}`);
		console.log("发现的漏洞:");
		result.security.vulnerabilities.forEach((vuln, i) => {
			console.log(`  ${i + 1}. ${vuln}`);
		});
		console.log("建议:");
		result.security.suggestions.forEach((suggestion, i) => {
			console.log(`  ${i + 1}. ${suggestion}`);
		});

		// 性能审查结果
		console.log("\n=== 性能审查结果 ===");
		console.log(`影响程度: ${result.performance.impact}`);
		console.log("发现的问题:");
		result.performance.issues.forEach((issue, i) => {
			console.log(`  ${i + 1}. ${issue}`);
		});
		console.log("优化建议:");
		result.performance.optimization.forEach((opt, i) => {
			console.log(`  ${i + 1}. ${opt}`);
		});

		// 可维护性审查结果
		console.log("\n=== 可维护性审查结果 ===");
		console.log(`质量评分: ${result.maintainability.qualityScore}/10`);
		console.log("发现的问题:");
		result.maintainability.concerns.forEach((concern, i) => {
			console.log(`  ${i + 1}. ${concern}`);
		});
		console.log("建议:");
		result.maintainability.recommendations.forEach((rec, i) => {
			console.log(`  ${i + 1}. ${rec}`);
		});

		console.log("\n=== 摘要 ===");
		console.log(result.summary);

		console.log("\n测试完成！");
		return result;
	} catch (error) {
		console.error("测试失败:", error);
		throw error;
	}
}

// 执行测试
console.log("=======================================");
console.log("开始 parallelCodeReview 功能测试");
console.log("=======================================\n");

testParallelCodeReview()
	.then((result) => {
		console.log("\n测试成功完成!");
	})
	.catch((error) => {
		console.error("\n测试失败:", error);
	});
