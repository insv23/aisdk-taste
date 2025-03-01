import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import path from "node:path";
import { readFileSync } from "node:fs";

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

const anthropic = createAnthropic({
	baseURL,
	apiKey,
});

const model = anthropic("claude-3-5-haiku-20241022");

const schema = z
	.object({
		total: z.number().describe("The total amount of the invoice."),
		currency: z.string().describe("The currency of the total amount."),
		invoiceNumber: z.string().describe("The invoice number."),
		companyAddress: z
			.string()
			.describe("The address of the company or person issuing the invoice."),
		companyName: z
			.string()
			.describe("The name of the company issuing the invoice."),
		invoiceeAddress: z
			.string()
			.describe("The address of the company or person receiving the invoice."),
	})
	.describe("The extracted data from the invoice.");

export const extractDataFromInvoice = async (invoicePath: string) => {
	const { object } = await generateObject({
		model,
		system:
			"You will receive an invoice.  Please extract the data from the invoice.",
		schema,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "file",
						data: readFileSync(invoicePath),
						mimeType: "application/pdf",
					},
				],
			},
		],
	});

	return object;
};

const result = await extractDataFromInvoice(
	path.join(import.meta.dirname, "./invoice-1.pdf"),
);

console.dir(result, { depth: null });
