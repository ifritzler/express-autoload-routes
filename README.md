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
import { loadRoutes } from "express-dynamic-routes-loader";
```

2. Carga dinámicamente las rutas en tu aplicación Express:

```typescript
const app = express();

// Rutas por defecto en el directorio 'src/routes'
loadRoutes(app);
```

3. Personaliza la ubicación del directorio de rutas:

```typescript
// Especifica la ubicación del directorio de rutas
loadRoutes(app, 'mi/ruta/personalizada');
```

## Estructura del Directorio de Rutas

La librería sigue una convención de nomenclatura para la organización de las rutas. Las rutas y middlewares se definen en archivos separados con el siguiente formato:

- `nombre-ruta/[método].ts`: Define la lógica de la ruta para un método HTTP específico.
- `nombre-ruta/metadata.ts`: Opcionalmente, define metadatos y middlewares para la ruta.

## Ejemplo de Estructura

```plaintext
src
|-- routes
|   |-- usuarios
|       |-- lista.get.ts
|       |-- detalle.get.ts
|       |-- metadata.ts
|   |-- productos
|       |-- lista.get.ts
|       |-- detalle.get.ts
|       |-- metadata.ts
```

## Metadatos y Middlewares

Puedes especificar metadatos y middlewares para cada ruta en el archivo `metadata.ts` asociado. Los metadatos incluyen middlewares antes y después de la ruta.

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
```

## Estructura del Archivo de Ruta

Dentro de los archivos de ruta, exporta la ruta por defecto como una función anónima que recibe `req`, `res`, y `next`. Opcionalmente, puedes exportar de forma nombrada un objeto `metadata` del tipo `RouteMetadata` que exponga middlewares específicos para esa ruta.

Ejemplo de `mi-ruta.get.ts`:

```typescript
// mi-ruta.get.ts
import { RouteMetadata } from "express-dynamic-routes-loader";

// Metadatos específicos para esta ruta
export const metadata: RouteMetadata = {
  middlewares: [middleware4, middleware5],
};

// Ruta por defecto
export default (req, res, next) => {
  // Lógica de la ruta
};
```
