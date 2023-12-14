# Express Dynamic Routes Loader

La librería Express Dynamic Routes Loader simplifica la carga dinámica de rutas en una aplicación Express, permitiendo una organización más eficiente de las rutas y la aplicación de middlewares de manera automática.

## Instalación

Para instalar la librería, utiliza npm:

```bash
npm install express-dynamic-routes-loader
```

## Uso

1. Importa la librería en tu aplicación:

```typescript
import express from "express";
import path from 'path';
import { fileURLToPath } from 'url'
import { loadRoutes } from "express-dynamic-routes-loader";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
```

2. Carga dinámicamente las rutas en tu aplicación Express:

```typescript
const app = express();
app.use(express.json())

const PORT = 3000;
// Rutas por defecto en el directorio 'routes'

async function init(): Promise<void> {
  app.use(await loadRoutes(path.join(__dirname, 'routes')))
  
  app.listen(PORT, () => {
    console.log('Server up and running on port', PORT)
  })
}

init()
```

3. Personaliza la ubicación del directorio de rutas:

```typescript
app.use(await loadRoutes(path.join(__dirname, 'mi/ruta/personalizada')))
```

## Estructura del Directorio de Rutas

La librería sigue una convención de nomenclatura para la organización de las rutas. Las rutas y middlewares se definen en archivos separados con el siguiente formato:

- `nombre-ruta/{método}.ts`: Define la lógica de la ruta para un método HTTP específico.
- `nombre-ruta/metadata.ts`: Opcionalmente, define metadatos y middlewares para la rutas que esten dentro del mismo nivel de anidacion.

## Ejemplo de Estructura

```plaintext
src
|-- routes
|   |-- usuarios
|       |-- get.ts // Listar usuarios
|       |-- [id]
            |-- get.ts // Detalle de usuario
|       |-- metadata.ts
|   |-- productos
|       |-- get.ts
|       |-- [id]
            |-- get.ts
|       |-- metadata.ts
```

## Estructura del Archivo de Ruta

Dentro de los archivos de ruta, exporta la ruta por defecto como una función anónima que recibe `req`, `res`, y `next` (opcional). Opcionalmente, puedes exportar de forma nombrada un objeto `metadata` del tipo `RouteMetadata` que exponga middlewares específicos para esa ruta.

Ejemplo de `api/products/get.ts`:

```typescript
// api/products/get.ts
import { RouteMetadata } from "express-dynamic-routes-loader";

// Metadatos específicos para esta ruta
export const metadata: RouteMetadata = {
  middlewares: [middleware4, middleware5],
};

// Ruta por defecto
export default async (req, res, next) => {
  // Lógica de la ruta
};
```


## Metadatos y Middlewares

Puedes especificar metadatos y middlewares para cada ruta en el archivo `metadata` asociado. Los metadatos incluyen middlewares antes y después de la ruta.

Ejemplo de `metadata.ts`:

```typescript
// metadata.ts
import { MiddlewareType } from "express-dynamic-routes-loader";

export const metadata: RoutesMetadata = {
  middlewares: {
    before: [middleware1, middleware2],
    after: [middleware3],
  },
};

// export const metadata: RoutesMetadata = {
//   middlewares: [middleware1, middleware2] // Aplica los middlewares antes del handler principal de la ruta
// };
```
