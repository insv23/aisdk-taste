import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { once } from "node:events";
import { generateText, type CoreMessage } from "ai";

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

export const startServer = async () => {
	const app = new Hono();

	app.post("/api/get-completions", async (ctx) => {
		const messages: CoreMessage[] = await ctx.req.json();

		const result = await generateText({
			model,
			messages,
		});

		return ctx.json(result.response.messages);
	});

	const server = serve({
		fetch: app.fetch,
		port: 4317,
		hostname: "0.0.0.0",
	});

	// 当 Hono 服务器成功启动并准备好接受传入连接时，它会发出 "listening" 事件。
	// 程序等待 server 对象发出 "listening" 事件。
	// 一旦服务器启动并发出 "listening" 事件，Promise 解析，startServer 函数继续执行。
	// 确保服务器已经准备好连接
	await once(server, "listening");

	return server;
};
