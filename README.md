# pixabay-mcp MCP Server

[中文版](README_zh.md)

A Model Context Protocol server for Pixabay image search

<a href="https://glama.ai/mcp/servers/@zym9863/pixabay-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@zym9863/pixabay-mcp/badge" alt="Pixabay Server MCP server" />
</a>

This is a TypeScript-based MCP server that provides access to the Pixabay image API. It demonstrates core MCP concepts by providing:

- Tools for searching images on Pixabay
- Formatted results with image URLs and metadata
- Error handling for API requests

## Features

### Tools
- `search_pixabay_images` - Search for images on Pixabay
  - Takes a search query as required parameter
  - Optional parameters for image type, orientation, and results per page
  - Returns formatted list of image results with URLs

### Configuration
- Requires a Pixabay API key set as environment variable `PIXABAY_API_KEY`
- Safe search enabled by default
- Error handling for API issues and invalid parameters

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

1. Set up your Pixabay API key as an environment variable:

```bash
# On Windows
set PIXABAY_API_KEY=your_api_key_here

# On macOS/Linux
export PIXABAY_API_KEY=your_api_key_here
```

2. To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

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

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.