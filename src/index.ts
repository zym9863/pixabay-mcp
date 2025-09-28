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
const PIXABAY_VIDEO_API_URL = 'https://pixabay.com/api/videos/';
const IMAGE_TYPE_OPTIONS = ["all", "photo", "illustration", "vector"];
const ORIENTATION_OPTIONS = ["all", "horizontal", "vertical"];
const VIDEO_TYPE_OPTIONS = ["all", "film", "animation"];
const MIN_PER_PAGE = 3;
const MAX_PER_PAGE = 200;

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

/**
 * 视频对象接口，包含视频的详细信息
 */
interface PixabayVideo {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  duration: number;
  views: number;
  downloads: number;
  likes: number;
  user: string;
  /**
   * 视频文件对象，包含不同分辨率的视频 URL
   */
  videos: {
    large?: {
      url: string;
      width: number;
      height: number;
      size: number;
    };
    medium?: {
      url: string;
      width: number;
      height: number;
      size: number;
    };
    small?: {
      url: string;
      width: number;
      height: number;
      size: number;
    };
    tiny?: {
      url: string;
      width: number;
      height: number;
      size: number;
    };
  };
}

/**
 * 视频搜索 API 响应接口
 */
interface PixabayVideoResponse {
  total: number;
  totalHits: number;
  hits: PixabayVideo[];
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
 * 视频搜索参数的类型守卫函数
 */
const isValidVideoSearchArgs = (
  args: any
): args is { query: string; video_type?: string; orientation?: string; per_page?: number; min_duration?: number; max_duration?: number } =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.query === 'string' &&
  (args.video_type === undefined || typeof args.video_type === 'string') &&
  (args.orientation === undefined || typeof args.orientation === 'string') &&
  (args.per_page === undefined || typeof args.per_page === 'number') &&
  (args.min_duration === undefined || typeof args.min_duration === 'number') &&
  (args.max_duration === undefined || typeof args.max_duration === 'number');

/**
 * 验证图片检索参数，确保符合 Pixabay API 的要求。
 */
function assertValidImageSearchParams(args: { image_type?: string; orientation?: string; per_page?: number }): void {
  const { image_type, orientation, per_page } = args;

  if (image_type !== undefined && !IMAGE_TYPE_OPTIONS.includes(image_type)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `image_type 必须是 ${IMAGE_TYPE_OPTIONS.join(', ')} 之一。`
    );
  }

  if (orientation !== undefined && !ORIENTATION_OPTIONS.includes(orientation)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `orientation 必须是 ${ORIENTATION_OPTIONS.join(', ')} 之一。`
    );
  }

  if (per_page !== undefined) {
    if (!Number.isInteger(per_page)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'per_page 必须是整数。'
      );
    }
    if (per_page < MIN_PER_PAGE || per_page > MAX_PER_PAGE) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `per_page 需在 ${MIN_PER_PAGE}-${MAX_PER_PAGE} 范围内。`
      );
    }
  }
}

/**
 * 验证视频检索参数，确保符合 Pixabay API 的要求。
 */
function assertValidVideoSearchParams(args: {
  video_type?: string;
  orientation?: string;
  per_page?: number;
  min_duration?: number;
  max_duration?: number;
}): void {
  const { video_type, orientation, per_page, min_duration, max_duration } = args;

  if (video_type !== undefined && !VIDEO_TYPE_OPTIONS.includes(video_type)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `video_type 必须是 ${VIDEO_TYPE_OPTIONS.join(', ')} 之一。`
    );
  }

  if (orientation !== undefined && !ORIENTATION_OPTIONS.includes(orientation)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `orientation 必须是 ${ORIENTATION_OPTIONS.join(', ')} 之一。`
    );
  }

  if (per_page !== undefined) {
    if (!Number.isInteger(per_page)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'per_page 必须是整数。'
      );
    }
    if (per_page < MIN_PER_PAGE || per_page > MAX_PER_PAGE) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `per_page 需在 ${MIN_PER_PAGE}-${MAX_PER_PAGE} 范围内。`
      );
    }
  }

  if (min_duration !== undefined) {
    if (!Number.isInteger(min_duration) || min_duration < 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'min_duration 必须是大于等于 0 的整数。'
      );
    }
  }

  if (max_duration !== undefined) {
    if (!Number.isInteger(max_duration) || max_duration < 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'max_duration 必须是大于等于 0 的整数。'
      );
    }
  }

  if (
    min_duration !== undefined &&
    max_duration !== undefined &&
    max_duration < min_duration
  ) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'max_duration 需大于或等于 min_duration。'
    );
  }
}

/**
 * 输出 Pixabay API 错误日志，避免泄露敏感凭据信息。
 */
function logPixabayError(source: 'image' | 'video' | 'server', error: unknown): void {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string } | undefined;
    console.error(`[Pixabay ${source} error]`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      code: error.code,
      message: responseData?.message ?? error.message,
    });
    return;
  }

  if (error instanceof Error) {
    console.error(`[Pixabay ${source} error]`, {
      message: error.message,
    });
    return;
  }

  console.error(`[Pixabay ${source} error]`, {
    error: String(error),
  });
}

/**
 * Create an MCP server for Pixabay.
 */
const server = new Server(
  {
    name: "pixabay-mcp",
    version: "0.3.0",
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
      },
      {
        name: "search_pixabay_videos",
        description: "Search for videos on Pixabay",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query terms"
            },
            video_type: {
              type: "string",
              enum: ["all", "film", "animation"],
              description: "Filter results by video type",
              default: "all"
            },
            orientation: {
              type: "string",
              enum: ["all", "horizontal", "vertical"],
              description: "Filter results by video orientation",
              default: "all"
            },
            per_page: {
              type: "number",
              description: "Number of results per page (3-200)",
              default: 20,
              minimum: 3,
              maximum: 200
            },
            min_duration: {
              type: "number",
              description: "Minimum video duration in seconds",
              minimum: 0
            },
            max_duration: {
              type: "number",
              description: "Maximum video duration in seconds",
              minimum: 0
            }
          },
          required: ["query"]
        }
      }
    ]
  };
});

/**
 * Handler for the search_pixabay_images and search_pixabay_videos tools.
 */
interface ToolCallRequest {
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

server.setRequestHandler(CallToolRequestSchema, async (request: ToolCallRequest) => {
  if (!['search_pixabay_images', 'search_pixabay_videos'].includes(request.params.name)) {
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

  // 处理图片搜索
  if (request.params.name === 'search_pixabay_images') {
    if (!isValidSearchArgs(request.params.arguments)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid search arguments. "query" (string) is required.'
      );
    }

    assertValidImageSearchParams(request.params.arguments);

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
      const resultsText = response.data.hits.map((hit: PixabayImage) =>
        `- ${hit.tags} (User: ${hit.user}): ${hit.webformatURL}`
      ).join('\n');

      return {
        content: [{
          type: "text",
          text: `Found ${response.data.totalHits} images for "${query}":\n${resultsText}`
        }]
      };

    } catch (error: unknown) {
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
      logPixabayError('image', error);
      return {
        content: [{
          type: "text",
          text: errorMessage
        }],
        isError: true
      };
    }
  }

  // 处理视频搜索
  if (request.params.name === 'search_pixabay_videos') {
    if (!isValidVideoSearchArgs(request.params.arguments)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid video search arguments. "query" (string) is required.'
      );
    }

    assertValidVideoSearchParams(request.params.arguments);

    const {
      query,
      video_type = 'all',
      orientation = 'all',
      per_page = 20,
      min_duration,
      max_duration
    } = request.params.arguments;

    try {
      const params: any = {
        key: API_KEY,
        q: query,
        video_type: video_type,
        orientation: orientation,
        per_page: per_page,
        safesearch: true
      };

      // 只有在提供了时长参数时才添加到请求中
      if (min_duration !== undefined) {
        params.min_duration = min_duration;
      }
      if (max_duration !== undefined) {
        params.max_duration = max_duration;
      }

      const response = await axios.get<PixabayVideoResponse>(PIXABAY_VIDEO_API_URL, {
        params
      });

      if (response.data.hits.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No videos found for query: "${query}"`
          }]
        };
      }

      // 格式化视频搜索结果
      const resultsText = response.data.hits.map((hit: PixabayVideo) => {
        const duration = Math.floor(hit.duration);
        const videoUrl = hit.videos.medium?.url || hit.videos.small?.url || hit.videos.tiny?.url || 'No video URL available';
        return `- ${hit.tags} (User: ${hit.user}, Duration: ${duration}s): ${videoUrl}`;
      }).join('\n');

      return {
        content: [{
          type: "text",
          text: `Found ${response.data.totalHits} videos for "${query}":\n${resultsText}`
        }]
      };

    } catch (error: unknown) {
      let errorMessage = 'Failed to fetch videos from Pixabay.';
      if (axios.isAxiosError(error)) {
        errorMessage = `Pixabay Video API error: ${error.response?.status} ${error.response?.data?.message || error.message}`;
        if (error.response?.status === 400) {
           errorMessage += '. Please check if the API key is valid.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      logPixabayError('video', error);
      return {
        content: [{
          type: "text",
          text: errorMessage
        }],
        isError: true
      };
    }
  }

  // 这个不应该被执行到，但添加以确保类型安全
  throw new McpError(
    ErrorCode.MethodNotFound,
    `Unhandled tool: ${request.params.name}`
  );
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  server.onerror = (error: Error) => logPixabayError('server', error); // Add basic error logging
  process.on('SIGINT', async () => { // Graceful shutdown
      await server.close();
      process.exit(0);
  });
  await server.connect(transport);
  console.error('Pixabay MCP server running on stdio'); // Log to stderr so it doesn't interfere with stdout JSON-RPC
}

main().catch((error: unknown) => {
  console.error("Server failed to start.");
  logPixabayError('server', error);
  process.exit(1);
});
