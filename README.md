# pixabay-mcp MCP Server

[中文版](README_zh.md)

A Model Context Protocol (MCP) server for Pixabay image and video search with structured results & runtime validation.

<a href="https://glama.ai/mcp/servers/@zym9863/pixabay-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@zym9863/pixabay-mcp/badge" alt="Pixabay Server MCP server" />
</a>

This TypeScript MCP server exposes Pixabay search tools over stdio so AI assistants / agents can retrieve media safely and reliably.

Highlights:
- Image & video search tools (Pixabay official API)
- Runtime argument validation (enums, ranges, semantic checks)
- Consistent error logging without leaking sensitive keys
- Planned structured JSON payloads for easier downstream automation (see Roadmap)

## Features

### Tools
`search_pixabay_images`
  - Required: `query` (string)
  - Optional: `image_type` (all|photo|illustration|vector), `orientation` (all|horizontal|vertical), `per_page` (3-200)
  - Returns: human-readable text block (current) + (planned) structured JSON array of hits

`search_pixabay_videos`
  - Required: `query`
  - Optional: `video_type` (all|film|animation), `orientation`, `per_page` (3-200), `min_duration`, `max_duration`
  - Returns: human-readable text block + (planned) structured JSON with duration & URLs

### Configuration
Environment variables:
| Name | Required | Default | Description |
| ---- | -------- | ------- | ----------- |
| `PIXABAY_API_KEY` | Yes | - | Your Pixabay API key (images & videos) |
| `PIXABAY_TIMEOUT_MS` | No | 10000 (planned) | Request timeout once feature lands |
| `PIXABAY_RETRY` | No | 0 (planned) | Number of retry attempts for transient network errors |

Notes:
- Safe search is enabled by default.
- Keys are never echoed back in structured errors or logs.

## Usage Examples

Current (text only response excerpt):
```
Found 120 images for "cat":
- cat, pet, animal (User: Alice): https://.../medium1.jpg
- kitten, cute (User: Bob): https://.../medium2.jpg
```

Planned structured result (Roadmap v0.4+):
```jsonc
{
  "content": [
    { "type": "text", "text": "Found 120 images for \"cat\":\n- ..." },
    {
      "type": "json",
      "data": {
        "query": "cat",
        "totalHits": 120,
        "page": 1,
        "perPage": 20,
        "hits": [
          { "id": 123, "tags": ["cat","animal"], "user": "Alice", "previewURL": "...", "webformatURL": "...", "largeImageURL": "..." }
        ]
      }
    }
  ]
}
```

Error response (planned shape):
```json
{
  "content": [{ "type": "text", "text": "Pixabay API error: 400 ..." }],
  "isError": true,
  "metadata": { "status": 400, "code": "UPSTREAM_BAD_REQUEST", "hint": "Check API key or parameters" }
}
```

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

Watch mode:
```bash
npm run watch
```

## Installation

### Option 1: Using npx (Recommended)

Add this to your Claude Desktop configuration:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pixabay-mcp": {
      "command": "npx",
      "args": ["pixabay-mcp@latest"],
      "env": {
        "PIXABAY_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Option 2: Local Installation

1. Clone and build the project:

```bash
git clone https://github.com/zym9863/pixabay-mcp.git
cd pixabay-mcp
npm install
npm run build
```

2. Add the server config:

```json
{
  "mcpServers": {
    "pixabay-mcp": {
      "command": "/path/to/pixabay-mcp/build/index.js",
      "env": {
        "PIXABAY_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### API Key Setup

Get your Pixabay API key from [https://pixabay.com/api/docs/](https://pixabay.com/api/docs/) and set it in the configuration above. The same key grants access to both image and video endpoints.

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

## Roadmap (Condensed)
| Version | Focus | Key Items |
| ------- | ----- | --------- |
| v0.4 | Structured & Reliability | JSON payload, timeout, structured errors |
| v0.5 | UX & Pagination | page/order params, limited retry, modular refactor, tests |
| v0.6 | Multi-source Exploration | Evaluate integrating Unsplash/Pexels abstraction |

See `product.md` for full backlog & prioritization.

## Contributing
Planned contributions welcome once tests & module split land (v0.5 target). Feel free to open issues for API shape / schema suggestions.

## License
MIT

## Disclaimer
This project is not affiliated with Pixabay. Respect Pixabay's Terms of Service and rate limits.
