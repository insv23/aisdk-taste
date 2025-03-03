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

// https://sdk.vercel.ai/docs/foundations/agents#routing
async function handleCustomerQuery(query: string) {
	// First step: Classify the query type
	const { object: classification } = await generateObject({
		model: openai("gpt-4o-mini"),
		schema: z.object({
			reasoning: z.string(),
			type: z.enum(["general", "refund", "technical"]),
			complexity: z.enum(["simple", "complex"]),
		}),
		prompt: `Classify this customer question:
            ${query}
            
            Determine:
            1. Query type (general, refund, or technical)
            2. Complexity (simple or complex)
            3. Brief reasoning for classification`,
	});

	// Route based on classification
	// Set model and system prompt based on query type and complexity
	const { text: response } = await generateText({
		model:
			classification.complexity === "simple"
				? openai("gpt-4o-mini")
				: openai("o3-mini"),
		system: {
			general:
				"You are an expert customer service agent handling general inquiries.",
			refund:
				"You are a customer service agent specializing in refund requests. Follow company policy and collect necessary information.",
			technical:
				"You are a technical support specialist with deep product knowledge. Focus on clear step-by-step troubleshooting.",
		}[classification.type],
		prompt: query,
	});

	return { response, classification };
}

// 运行单个测试的函数
async function runTest(testName: string, query: string) {
	console.log(`Running test: ${testName}`);
	try {
		const result = await handleCustomerQuery(query);

		console.log(
			`Classification: ${result.classification.type} (${result.classification.complexity})`,
		);
		console.log(`Reasoning: ${result.classification.reasoning}`);
		console.log(`Response: ${result.response.substring(0, 100)}...`);
		console.log("-----------------------------------");
		return result;
	} catch (error) {
		console.error(`Test error: ${error}`);
		console.log("-----------------------------------");
		return null;
	}
}

// 主测试函数
async function runAllTests() {
	console.log("=== Starting Customer Query Handler Tests ===\n");

	// 测试一般查询
	await runTest("General Query - Simple", "What are your store hours?");

	// 测试退款查询
	await runTest(
		"Refund Query - Simple",
		"I want to return my purchase from last week. How do I get my money back?",
	);

	// 测试技术查询
	await runTest(
		"Technical Query - Simple",
		"My app keeps crashing when I try to upload photos. What should I do?",
	);

	// 测试复杂查询
	await runTest(
		"Technical Query - Complex",
		"I'm having an issue with API integration. When I send a POST request to your endpoint with the authentication headers, I'm getting a 403 error. I've verified my API key is correct and I'm following your documentation. My request includes all required parameters but still fails. Can you help me troubleshoot this issue?",
	);

	// 测试混合类型查询
	await runTest(
		"Mixed Query Type",
		"My product stopped working after the latest update and I want a refund unless you can fix it immediately.",
	);

	console.log("=== All Tests Completed ===");
}

// 执行测试
runAllTests().catch((error) => {
	console.error("Test suite failed:", error);
});
