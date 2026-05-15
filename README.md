# opencode-vision-mcp

MCP server for vision capabilities in OpenCode — screenshot capture and AI image analysis using OpenRouter models.

## Setup

```bash
npm install
```

## Usage

Configure in your MCP settings:

```json
{
  "mcpServers": {
    "opencode-vision": {
      "command": "node",
      "args": ["/path/to/opencode-vision-mcp/server.js"]
    }
  }
}
```

## Features

- `vision_analyze` — Analyze images with AI vision models
- `vision_compare` — Compare multiple images
- `vision_detect_objects` — Object detection in images

## Requirements

- Node.js 18+
- OpenRouter API key
