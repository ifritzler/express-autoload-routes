# Express Dynamic Routes Loader

The Express Dynamic Routes Loader library simplifies the dynamic loading of routes in an Express application, allowing for a more efficient organization of routes and the automatic application of middlewares.

## Installation

To install the library, use npm:

```bash
npm install express-dynamic-routes-loader
```

## Usage

1. Import the library into your application:

```typescript
import express from "express";
import path from 'path';
import { fileURLToPath } from 'url'
import { loadRoutes } from "express-dynamic-routes-loader";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
```

2. Dynamically load the routes in your Express application:

```typescript
const app = express();
app.use(express.json())

const PORT = 3000;
// Default routes in the 'src/routes' directory

async function init(): Promise<void> {
  app.use(await loadRoutes(path.join(__dirname, 'routes')))
  
  app.listen(PORT, () => {
    console.log('Server up and running on port', PORT)
  })
}

init()
```

3. Customize the location of the routes directory:

```typescript
// Specify the location of the routes directory
app.use(await loadRoutes(path.join(__dirname, 'my/custom/path')))
```

## Directory Structure of Routes

The library follows a naming convention for organizing routes. Routes and middlewares are defined in separate files with the following format:

- `route-name/{method}.ts`: Defines the route logic for a specific HTTP method.
- `route-name/metadata.ts`: Optionally defines metadata and middlewares for the route.

## Example Directory Structure

```plaintext
src
|-- routes
|   |-- users
|       |-- get.ts // List all users
|       |-- [id]
            |-- get.ts // User details
|       |-- metadata.ts
|   |-- products
|       |-- get.ts
|       |-- [id]
            |-- get.ts
|       |-- metadata.ts
```

## Route File Structure

Inside route files, export the default route as an anonymous function that takes `req`, `res`, and `next` (optional). Optionally, you can also export a named object `metadata` of type `RouteMetadata` that exposes specific middlewares for that route.

Example of `api/products/get.ts`:

```typescript
// api/products/get.ts
import { RouteMetadata } from "express-dynamic-routes-loader";

// Specific metadata for this route
export const metadata: RouteMetadata = {
  middlewares: [middleware4, middleware5],
};

// Default route
export default async (req, res, next) => {
  // Route logic
};
```


## Metadata and Middlewares

You can specify metadata and middlewares for each route in the associated `metadata` file. Metadata includes middlewares before and after the route.

Example of `metadata.ts`:

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
//   middlewares: [middleware1, middleware2] // Applies middlewares before the main handler of the route by default
// };
```
