#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';

// Pixabay API Key from environment variable
const API_KEY = process.env.PIXABAY_API_KEY;
const PIXABAY_API_URL = 'https://pixabay.com/api/';

// Interface for Pixabay API response (simplified)
interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  views: number;
  downloads: number;
  likes: number;
  user: string;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

// Type guard for tool arguments
const isValidSearchArgs = (
  args: any
): args is { query: string; image_type?: string; orientation?: string; per_page?: number } =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.query === 'string' &&
  (args.image_type === undefined || typeof args.image_type === 'string') &&
  (args.orientation === undefined || typeof args.orientation === 'string') &&
  (args.per_page === undefined || typeof args.per_page === 'number');

/**
 * Create an MCP server for Pixabay.
 */
const server = new Server(
  {
    name: "pixabay-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes a "search_pixabay_images" tool.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_pixabay_images",
        description: "Search for images on Pixabay",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query terms"
            },
            image_type: {
              type: "string",
              enum: ["all", "photo", "illustration", "vector"],
              description: "Filter results by image type",
              default: "all"
            },
            orientation: {
              type: "string",
              enum: ["all", "horizontal", "vertical"],
              description: "Filter results by image orientation",
              default: "all"
            },
            per_page: {
              type: "number",
              description: "Number of results per page (3-200)",
              default: 20,
              minimum: 3,
              maximum: 200
            }
          },
          required: ["query"]
        }
      }
    ]
  };
});

/**
 * Handler for the search_pixabay_images tool.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'search_pixabay_images') {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`
    );
  }

  if (!API_KEY) {
    throw new McpError(
      ErrorCode.InternalError,
      'Pixabay API key (PIXABAY_API_KEY) is not configured in the environment.'
    );
  }

  if (!isValidSearchArgs(request.params.arguments)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Invalid search arguments. "query" (string) is required.'
    );
  }

  const { query, image_type = 'all', orientation = 'all', per_page = 20 } = request.params.arguments;

  try {
    const response = await axios.get<PixabayResponse>(PIXABAY_API_URL, {
      params: {
        key: API_KEY,
        q: query,
        image_type: image_type,
        orientation: orientation,
        per_page: per_page,
        safesearch: true // Enable safe search by default
      },
    });

    if (response.data.hits.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No images found for query: "${query}"`
        }]
      };
    }

    // Format the results
    const resultsText = response.data.hits.map(hit =>
      `- ${hit.tags} (User: ${hit.user}): ${hit.webformatURL}`
    ).join('\n');

    return {
      content: [{
        type: "text",
        text: `Found ${response.data.totalHits} images for "${query}":\n${resultsText}`
      }]
    };

  } catch (error) {
    let errorMessage = 'Failed to fetch images from Pixabay.';
    if (axios.isAxiosError(error)) {
      errorMessage = `Pixabay API error: ${error.response?.status} ${error.response?.data?.message || error.message}`;
      // Pixabay might return 400 for invalid key, but doesn't give a clear message
      if (error.response?.status === 400) {
         errorMessage += '. Please check if the API key is valid.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Pixabay MCP Error:", errorMessage, error); // Log the full error server-side
    return {
      content: [{
        type: "text",
        text: errorMessage
      }],
      isError: true
    };
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  server.onerror = (error) => console.error('[MCP Error]', error); // Add basic error logging
  process.on('SIGINT', async () => { // Graceful shutdown
      await server.close();
      process.exit(0);
  });
  await server.connect(transport);
  console.error('Pixabay MCP server running on stdio'); // Log to stderr so it doesn't interfere with stdout JSON-RPC
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
