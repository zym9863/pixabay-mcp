# pixabay-mcp MCP Server

[English](README.md)

一个用于Pixabay图片搜索的模型上下文协议(MCP)服务器

这是一个基于TypeScript的MCP服务器，提供对Pixabay图片API的访问。它通过以下方式展示了MCP的核心概念：

- 用于在Pixabay上搜索图片的工具
- 带有图片URL和元数据的格式化结果
- API请求的错误处理

## 功能特性

### 工具
- `search_pixabay_images` - 在Pixabay上搜索图片
  - 需要搜索查询作为必需参数
  - 可选参数包括图片类型、方向和每页结果数
  - 返回带有URL的格式化图片结果列表

### 配置
- 需要将Pixabay API密钥设置为环境变量 `PIXABAY_API_KEY`
- 默认启用安全搜索
- 处理API问题和无效参数的错误

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

1. 将Pixabay API密钥设置为环境变量：

```bash
# Windows系统
set PIXABAY_API_KEY=your_api_key_here

# macOS/Linux系统
export PIXABAY_API_KEY=your_api_key_here
```

2. 要与Claude Desktop一起使用，添加服务器配置：

MacOS系统：`~/Library/Application Support/Claude/claude_desktop_config.json`
Windows系统：`%APPDATA%/Claude/claude_desktop_config.json`

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

### 调试

由于MCP服务器通过stdio通信，调试可能会有挑战性。我们推荐使用[MCP Inspector](https://github.com/modelcontextprotocol/inspector)，它可以通过包脚本使用：

```bash
npm run inspector
```

Inspector将提供一个URL，用于在浏览器中访问调试工具。