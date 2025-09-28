# pixabay-mcp MCP Server

[English](README.md)

一个用于 Pixabay 图片与视频搜索的 Model Context Protocol (MCP) 服务器，支持参数校验与计划中的结构化结果输出。

特性概览：
- 图片 / 视频检索工具（调用 Pixabay 官方 API）
- 运行时参数校验（枚举、范围、语义校验）
- 错误日志脱敏（不泄露密钥）
- 规划中：结构化 JSON payload 便于自动化处理（详见 Roadmap）

## 功能特性

### 工具
`search_pixabay_images`
  - 必填：`query` (字符串)
  - 可选：`image_type` (all|photo|illustration|vector)、`orientation` (all|horizontal|vertical)、`per_page` (3-200)
  - 返回：当前为可读文本；计划追加结构化 JSON 数组

`search_pixabay_videos`
  - 必填：`query`
  - 可选：`video_type` (all|film|animation)、`orientation`、`per_page` (3-200)、`min_duration`、`max_duration`
  - 返回：文本 + （计划）结构化 JSON，含时长与多分辨率 URL

### 配置
环境变量：
| 名称 | 必填 | 默认 | 描述 |
| ---- | ---- | ---- | ---- |
| `PIXABAY_API_KEY` | 是 | - | Pixabay API Key（统一访问图片与视频） |
| `PIXABAY_TIMEOUT_MS` | 否 | 10000（规划） | 请求超时时间 (ms) |
| `PIXABAY_RETRY` | 否 | 0（规划） | 瞬时错误重试次数 |

说明：
- 默认开启安全搜索 (safesearch=true)。
- 日志不会打印 Key。

## 使用示例

当前（纯文本响应示例）：
```
Found 120 images for "cat":
- cat, pet, animal (User: Alice): https://.../medium1.jpg
- kitten, cute (User: Bob): https://.../medium2.jpg
```

规划中的结构化结果（v0.4+）：
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

规划中的错误响应结构：
```json
{
  "content": [{ "type": "text", "text": "Pixabay API error: 400 ..." }],
  "isError": true,
  "metadata": { "status": 400, "code": "UPSTREAM_BAD_REQUEST", "hint": "检查 API Key 或参数" }
}
```

## 开发

安装依赖：
```bash
npm install
```

构建：
```bash
npm run build
```

监听开发：
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

Inspector 将提供一个 URL，用于在浏览器中访问调试工具。

## Roadmap（摘要）
| 版本 | 主题 | 关键内容 |
| ---- | ---- | ---- |
| v0.4 | 结构化 & 稳定性 | JSON payload、超时、结构化错误 |
| v0.5 | 体验 & 分页 | page/order、有限重试、模块化重构、测试 |
| v0.6 | 多源探索 | 调研 Unsplash / Pexels 抽象层 |

完整优先级与 Backlog 参见 `product.md`。

## 贡献
待 v0.5 引入测试与模块化后欢迎提交 PR，可先通过 issue 讨论 API 形态建议。

## 许可证
MIT

## 免责声明
本项目与 Pixabay 无官方关联，使用时请遵守其服务条款与速率限制。
