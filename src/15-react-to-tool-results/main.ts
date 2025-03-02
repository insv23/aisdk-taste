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

const model = openai("gpt-4o-mini");

interface LatLon {
	lat: number;
	lon: number;
}

interface Weather {
	temperature: number;
	condition: string;
}

/**
 * Retrieves the latitude and longitude for a given city.
 * @param city - The English name of the city.
 * @returns The latitude and longitude of the city.
 */
async function getLatLon(city: string): Promise<LatLon> {
	// Example implementation (replace with actual API call or geocoding library).
	// Hardcoded coordinates for demonstrating.

	const cityCoordinates: Record<string, LatLon> = {
		"san francisco": { lat: 37.7749, lon: -122.4194 },
		"new york": { lat: 40.7128, lon: -74.006 },
		london: { lat: 51.5074, lon: -0.1278 },
		tokyo: { lat: 35.6895, lon: 139.6917 },
		beijing: { lat: 39.9042, lon: 116.4074 },
		shanghai: { lat: 31.2304, lon: 121.4737 },
	};

	const normalizedCity = city.trim().toLocaleLowerCase();

	if (cityCoordinates[normalizedCity]) {
		return cityCoordinates[normalizedCity];
	}

	return { lat: 37.7749, lon: -122.4194 };
}

const getLatLonTool = tool({
	description: "Retrieves the latitude and longitude for a given city.",
	parameters: z.object({
		city: z.string().describe("The English name of the city"),
	}),
	execute: async ({ city }) => {
		return await getLatLon(city);
	},
});

/**
 * Retrieves the weather information for the given latitude and longitude coordinates.
 * @param coordinates - The latitude ang longitude coordinates.
 * @returns The weather information.
 */
async function getWeatherByLatLon(coordinates: LatLon): Promise<Weather> {
	// Example implementation (replace with actual weather API call).
	// Simulating weather data based on coordinates for demonstration.

	const { lat, lon } = coordinates;

	let temperature = 20;
	if (lat > 40) {
		temperature = 15;
	} else if (lat < 20) {
		temperature = 28;
	}

	let weatherCondition = "Sunny";
	if (lon > 0 && lon < 120) {
		weatherCondition = "Cloudy";
	} else if (lon < -40) {
		weatherCondition = "Overcast";
	}

	return { temperature: temperature, condition: weatherCondition };
}

const getWeatherByLatLonTool = tool({
	description:
		"Retrieves the weather information for the given latitude and longitude coordinates.",
	parameters: z.object({
		lat: z.number().describe("The latitude"),
		lon: z.number().describe("The longitude"),
	}),
	execute: async ({ lat, lon }) => {
		return await getWeatherByLatLon({ lat, lon });
	},
});

async function getCityWeather(userPrompt: string) {
	const { steps, text } = await generateText({
		model,
		system: `你是一个天气助手，能够帮助用户查询各个城市的天气情况。
    处理用户的天气查询请求时，请遵循以下步骤：
    1. 从用户输入中识别出城市名称
    2. 使用 getLatLon 工具获取该城市的经纬度坐标
    3. 使用返回的坐标调用 getWeatherByLatLon 工具获取天气信息
    4. 向用户提供一个友好的天气报告，包括温度和天气状况
    
    如果用户使用非英文查询城市天气（如中文、日文等），请正确提取城市名称并使用英文名称调用工具。
    例如："北京天气怎么样" → 提取城市名"北京"，使用英文名"Beijing"调用工具。`,
		prompt: userPrompt,
		tools: {
			getLatLon: getLatLonTool,
			getWeatherByLatLon: getWeatherByLatLonTool,
		},
		maxSteps: 5,
	});

	const weatherResponse = {
		rawSteps: steps,
		finalResponse: text,
	};

	return weatherResponse;
}

const result = await getCityWeather("北京天气怎么样");
console.log(JSON.stringify(result, null, 2));
