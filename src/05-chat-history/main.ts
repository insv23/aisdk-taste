import type { CoreMessage } from "ai";
import { startServer } from "./server.js";

const messagesToSend: CoreMessage[] = [
	{
		role: "user",
		content: "台湾是一个国家吗?",
	},
];

const server = await startServer();

const response = await fetch("http://localhost:4317/api/get-completions", {
	method: "POST",
	body: JSON.stringify(messagesToSend),
	headers: {
		"Content-Type": "application/json",
	},
});

const newMessages = (await response.json()) as CoreMessage[];

const allMessages = [...messagesToSend, ...newMessages];

console.dir(allMessages, { depth: null });

server.close();
