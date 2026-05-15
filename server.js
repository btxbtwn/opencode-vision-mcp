import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { analyze_image, compare_images, detect_objects_in_image } from "./tools.js";

const server = new McpServer(
  { name: "opencode-vision-mcp", version: "1.0.0" },
  { capabilities: { logging: {} } }
);

function ok(result) {
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
}

function fail(tool, message) {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: true, message, tool }, null, 2) }],
    isError: true,
  };
}

server.registerTool(
  "analyze_image",
  {
    title: "Analyze Image",
    description: "Analyze an image using AI vision models. Supports URLs, base64 data, and local file paths.",
    inputSchema: z.object({
      imageSource: z.string().describe("Image source: URL, base64 data URI, or local file path"),
      prompt: z.string().describe("Analysis prompt describing what to analyze"),
      mode: z.enum(["general", "palette", "hierarchy", "components"]).optional(),
      options: z.object({
        temperature: z.number().min(0).max(2).optional(),
        topP: z.number().min(0).max(1).optional(),
        topK: z.number().int().min(1).max(100).optional(),
        maxTokens: z.number().int().min(1).max(8192).optional(),
      }).optional(),
    }),
  },
  async (args) => {
    try { return ok(await analyze_image(args)); }
    catch (e) { return fail("analyze_image", e.message); }
  }
);

server.registerTool(
  "compare_images",
  {
    title: "Compare Images",
    description: "Compare multiple images using AI vision models. Minimum 2 images.",
    inputSchema: z.object({
      imageSources: z.array(z.string()).min(2).describe("Array of 2+ image sources"),
      prompt: z.string().describe("Comparison prompt"),
      options: z.object({
        temperature: z.number().min(0).max(2).optional(),
        topP: z.number().min(0).max(1).optional(),
        topK: z.number().int().min(1).max(100).optional(),
        maxTokens: z.number().int().min(1).max(8192).optional(),
      }).optional(),
    }),
  },
  async (args) => {
    try { return ok(await compare_images(args)); }
    catch (e) { return fail("compare_images", e.message); }
  }
);

server.registerTool(
  "detect_objects_in_image",
  {
    title: "Detect Objects in Image",
    description: "Detect objects in an image using AI vision models. Returns bounding boxes.",
    inputSchema: z.object({
      imageSource: z.string().describe("Image source: URL, base64 data URI, or local file path"),
      prompt: z.string().describe("What to detect or recognize in the image"),
      outputFilePath: z.string().optional(),
      viewportWidth: z.number().optional(),
      viewportHeight: z.number().optional(),
    }),
  },
  async (args) => {
    try { return ok(await detect_objects_in_image(args)); }
    catch (e) { return fail("detect_objects_in_image", e.message); }
  }
);

export async function runMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMcpServer().catch((err) => { console.error("MCP server failed:", err); process.exit(1); });
}
