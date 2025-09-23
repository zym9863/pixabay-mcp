# pixabay-mcp MCP Server

[English](README.md)

一个用于Pixabay图片和视频搜索的模型上下文协议(MCP)服务器

这是一个基于TypeScript的MCP服务器，提供对Pixabay图片与视频API的访问。它通过以下方式展示了MCP的核心概念：

- 用于在Pixabay上搜索图片和视频的工具
- 带有图片/视频URL和元数据的格式化结果
- API请求的错误处理

## 功能特性

### 工具
- `search_pixabay_images` - 在Pixabay上搜索图片
  - 需要搜索查询作为必需参数
  - 可选参数包括图片类型、方向和每页结果数
  - 返回带有URL的格式化图片结果列表
- `search_pixabay_videos` - 在Pixabay上搜索视频
  - 需要搜索查询作为必需参数
  - 可选参数包括视频类型、方向、每页结果数，以及最短/最长时长过滤
  - 返回带有代表性下载URL的格式化视频结果列表

### 配置
- 需要将Pixabay API密钥设置为环境变量 `PIXABAY_API_KEY`
- 默认对图片和视频请求启用安全搜索
- 针对API问题和无效参数的错误处理

## 开发

安装依赖：
```bash
npm install
```

构建服务器：
```bash
npm run build
```

用于自动重新构建的开发模式：
```bash
npm run watch
```

## 安装

### 方式1：使用 npx（推荐）

将以下配置添加到Claude Desktop配置文件中：

MacOS系统：`~/Library/Application Support/Claude/claude_desktop_config.json`
Windows系统：`%APPDATA%/Claude/claude_desktop_config.json`

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

### 方式2：本地安装

1. 克隆并构建项目：

```bash
git clone https://github.com/zym9863/pixabay-mcp.git
cd pixabay-mcp
npm install
npm run build
```

2. 添加服务器配置：

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

### API密钥设置

从 [https://pixabay.com/api/docs/](https://pixabay.com/api/docs/) 获取您的Pixabay API密钥，并在上述配置中设置。同一个密钥即可访问图片和视频接口。

### 调试

由于MCP服务器通过stdio通信，调试可能会有挑战性。我们推荐使用[MCP Inspector](https://github.com/modelcontextprotocol/inspector)，它可以通过包脚本使用：

```bash
npm run inspector
```

Inspector将提供一个URL，用于在浏览器中访问调试工具。
