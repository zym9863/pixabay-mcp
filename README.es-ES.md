# Servidor MCP de Pixabay

[Versión en chino](README_zh.md)

Un servidor MCP (Model Context Protocol) para buscar imágenes y vídeos en Pixabay, con resultados estructurados y validación en tiempo real.

<a href="https://glama.ai/mcp/servers/@zym9863/pixabay-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@zym9863/pixabay-mcp/badge" alt="Servidor MCP de Pixabay" />
</a>

Este servidor MCP, escrito en TypeScript, expone herramientas de búsqueda de Pixabay a través de stdio para que los asistentes o agentes de IA puedan obtener contenido multimedia de forma segura y fiable.

Características destacadas:
- Herramientas de búsqueda de imágenes y vídeos (API oficial de Pixabay)
- Validación de argumentos en tiempo real (enums, rangos, comprobaciones semánticas)
- Registro de errores consistente sin revelar claves sensibles
- Paquetes JSON estructurados planificados para facilitar la automatización posterior (ver Hoja de ruta)

## Características

### Herramientas
`search_pixabay_images`
  - Requerido: `query` (cadena de texto)
  - Opcional: `image_type` (all|photo|illustration|vector), `orientation` (all|horizontal|vertical), `per_page` (3-200)
  - Devuelve: bloque de texto legible por humanos (actual) + (planificado) matriz JSON estructurada de resultados

`search_pixabay_videos`
  - Requerido: `query`
  - Opcional: `video_type` (all|film|animation), `orientation`, `per_page` (3-200), `min_duration`, `max_duration`
  - Devuelve: bloque de texto legible por humanos + (planificado) JSON estructurado con duración y URLs

### Configuración
Variables de entorno:
| Nombre | Requerido | Valor predeterminado | Descripción |
| ---- | -------- | ------- | ----------- |
| `PIXABAY_API_KEY` | Sí | - | Tu clave API de Pixabay (para imágenes y vídeos) |
| `PIXABAY_TIMEOUT_MS` | No | 10000 (planificado) | Tiempo de espera de la solicitud (una vez que la función esté disponible) |
| `PIXABAY_RETRY` | No | 0 (planificado) | Número de intentos de reintento para errores de red transitorios |

Notas:
- La búsqueda segura está activada por defecto.
- Las claves nunca se muestran en errores o registros estructurados.

## Ejemplos de uso

Respuesta actual (extracto de texto solo):
```
Se encontraron 120 imágenes para "gato":
- gato, mascota, animal (Usuario: Alice): https://.../medium1.jpg
- cachorro, lindo (Usuario: Bob): https://.../medium2.jpg
```

Resultado estructurado planificado (Hoja de ruta v0.4+):
```jsonc
{
  "content": [
    { "type": "text", "text": "Se encontraron 120 imágenes para \"gato\":\n- ..." },
    {
      "type": "json",
      "data": {
        "query": "gato",
        "totalHits": 120,
        "page": 1,
        "perPage": 20,
        "hits": [
          { "id": 123, "tags": ["gato","animal"], "user": "Alice", "previewURL": "...", "webformatURL": "...", "largeImageURL": "..." }
        ]
      }
    }
  ]
}
```

Respuesta de error (forma planificada):
```json
{
  "content": [{ "type": "text", "text": "Error en la API de Pixabay: 400 ..." }],
  "isError": true,
  "metadata": { "status": 400, "code": "UPSTREAM_BAD_REQUEST", "hint": "Revisa la clave API o los parámetros" }
}
```

## Desarrollo

Instalar dependencias:
```bash
npm install
```

Compilar el servidor:
```bash
npm run build
```

Modo de supervisión:
```bash
npm run watch
```

## Instalación

### Opción 1: Usar npx (Recomendado)

Añade esto a tu configuración de Claude Desktop:

En macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
En Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pixabay-mcp": {
      "command": "npx",
      "args": ["pixabay-mcp@latest"],
      "env": {
        "PIXABAY_API_KEY": "tu_clave_api_aqui"
      }
    }
  }
}
```

### Opción 2: Instalación local

1. Clonar y compilar el proyecto:

```bash
git clone https://github.com/zym9863/pixabay-mcp.git
cd pixabay-mcp
npm install
npm run build
```

2. Añadir la configuración del servidor:

```json
{
  "mcpServers": {
    "pixabay-mcp": {
      "command": "/ruta/al/pixabay-mcp/build/index.js",
      "env": {
        "PIXABAY_API_KEY": "tu_clave_api_aqui"
      }
    }
  }
}
```

### Configuración de la clave API

Obtén tu clave API de Pixabay en [https://pixabay.com/api/docs/](https://pixabay.com/api/docs/) y configúrala en la configuración anterior. La misma clave da acceso tanto a los endpoints de imágenes como de vídeos.

### Depuración

Dado que los servidores MCP se comunican a través de stdio, la depuración puede ser difícil. Recomendamos usar el [Inspector MCP](https://github.com/modelcontextprotocol/inspector), disponible como script de paquete:

```bash
npm run inspector
```

El Inspector proporcionará una URL para acceder a las herramientas de depuración en tu navegador.

## Hoja de ruta (conresumida)
| Versión | Enfoque | Elementos clave |
| ------- | ----- | --------- |
| v0.4 | Estructurado y fiabilidad | Payload JSON, tiempo de espera, errores estructurados |
| v0.5 | UX y paginación | parámetros de página/orden, reintento limitado, refactorización modular, pruebas |
| v0.6 | Exploración multi-fuente | Evaluar la integración de la abstracción de Unsplash/Pexels |

Consulta `product.md` para ver el backlog completo y la priorización.

## Contribuciones
Las contribuciones planificadas son bienvenidas una vez que las pruebas y la división modular estén disponibles (objetivo v0.5). No dudes en abrir problemas para sugerencias sobre la forma o el esquema de la API.

## Licencia
MIT

## Advertencia legal
Este proyecto no está afiliado a Pixabay. Respeta los Términos de Servicio y los límites de tasa de Pixabay.
