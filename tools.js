import OpenAI from "openai";
import { resolveImageSource } from "./image-service.js";

function getClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });
}

function getModel() {
  return process.env.OPENROUTER_MODEL || "openrouter/free";
}

function imageContent(dataUri, prompt) {
  return [
    { type: "image_url", image_url: { url: dataUri } },
    { type: "text", text: prompt },
  ];
}

export async function analyze_image(args) {
  const { imageSource, prompt } = args;
  if (!imageSource || !prompt) throw new Error("imageSource and prompt are required");

  const dataUri = await resolveImageSource(imageSource);
  const res = await getClient().chat.completions.create({
    model: getModel(),
    messages: [{ role: "user", content: imageContent(dataUri, prompt) }],
  });

  return {
    text: res.choices[0]?.message?.content || "",
    model: res.model,
    usage: res.usage,
  };
}

export async function compare_images(args) {
  const { imageSources, prompt } = args;
  if (!imageSources || imageSources.length < 2) throw new Error("At least 2 imageSources required");
  if (!prompt) throw new Error("prompt is required");

  const uris = await Promise.all(imageSources.map(resolveImageSource));
  const content = uris.flatMap((u) => [{ type: "image_url", image_url: { url: u } }]);
  content.push({ type: "text", text: prompt });

  const res = await getClient().chat.completions.create({
    model: getModel(),
    messages: [{ role: "user", content }],
  });

  return {
    text: res.choices[0]?.message?.content || "",
    model: res.model,
    usage: res.usage,
  };
}

export async function detect_objects_in_image(args) {
  const { imageSource, prompt } = args;
  if (!imageSource || !prompt) throw new Error("imageSource and prompt are required");

  const dataUri = await resolveImageSource(imageSource);
  const detectPrompt = `${prompt}\n\nReturn a JSON object with a "detections" array. Each entry: label (string), bbox [ymin,xmin,ymax,xmax] normalized 0-1, confidence (0-1 float).`;

  const res = await getClient().chat.completions.create({
    model: getModel(),
    messages: [{ role: "user", content: imageContent(dataUri, detectPrompt) }],
  });

  const raw = res.choices[0]?.message?.content || "";
  let detections = [];
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const json = JSON.parse(match[0]);
      detections = json.detections || [];
    }
  } catch {}

  return {
    text: raw,
    detections,
    model: res.model,
    usage: res.usage,
  };
}
