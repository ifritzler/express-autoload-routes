import { RequestHandler, Router } from "express";
import path from "path";
import fs from "fs";
import _ from "lodash";
import { createRequire } from 'node:module';

global.require = createRequire(import.meta.url);

export type MiddlewareType =
  | RequestHandler[]
  | {
      before?: RequestHandler[]
      after?: RequestHandler[]
    }

export interface RouteMetadata {
  middlewares?: MiddlewareType
}

export interface AutoloadRoutesOptions {
  root?: string
}

export const DEFAULT_METADATA: RouteMetadata = {
  middlewares: [],
}

export const loadRoutes = async (
  routesPath: string = "build/src/routes"
): Promise<Router> => {
  const absoluteRoutesPath = path.resolve(process.cwd(), routesPath);
  return await walkFiles(absoluteRoutesPath);
};

async function walkFiles(currentDirectory: string): Promise<Router> {
  const router = Router();

  const files = fs.readdirSync(currentDirectory);
  const filesMeta = files.map((file) => {
    const filePath = path.join(currentDirectory, file);
    const stats = fs.statSync(filePath);
    return { name: file, isDirectory: stats.isDirectory() };
  });
  const groupFiles: {
    routers: string[];
    methods: string[];
    metadata: string[];
  } = {
    routers: [],
    methods: [],
    metadata: [],
  };
  filesMeta.forEach((file: { name: string; isDirectory: boolean }) => {
    if (file.isDirectory) {
      groupFiles.routers.push(file.name);
    }
    if (/metadata.(t|j)s/gi.test(file.name)) {
      if (groupFiles.metadata.length >= 1)
        throw new Error(
          "Must be just 1 metadata file per folder to avoid colissions into " +
            currentDirectory
        );
      groupFiles.metadata.push(file.name);
    }
    if (
      /^(get|post|put|patch|delete|head|options)\.(t|j)s$/gi.test(file.name)
    ) {
      groupFiles.methods.push(file.name);
    }
  });
  console.log(groupFiles);

  for (const routy of groupFiles.routers) {
    const subRouter = await walkFiles(path.join(currentDirectory, routy))
    
    // Colocar el orden de middlewares y main handler
    if(groupFiles.metadata.length > 0) {
      try {
        const metadata: RouteMetadata = (await import('file:///'+path.normalize(path.join(currentDirectory, groupFiles.metadata[0])))).metadata
        const before: any[] = Array.isArray(metadata.middlewares) ? metadata.middlewares : metadata.middlewares?.before ?? []
        const after: any[] = !Array.isArray(metadata.middlewares) ? metadata.middlewares?.after ?? [] : []
        router.use(`/${routy}`, before, subRouter, after)
      }catch(e) {
        console.log(e)
      }
    } else {
      router.use(`/${routy}`, subRouter)
    }
    
    // Asigno el router principal de esta seccion
    
  }

  return router;
}
