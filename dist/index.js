var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/load-routes.ts
import { Router } from "express";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
global.require = createRequire(import.meta.url);
var loadRoutes = /* @__PURE__ */ __name(async (routesPath = "build/src/routes") => {
  const absoluteRoutesPath = path.resolve(process.cwd(), routesPath);
  return await walkFiles(absoluteRoutesPath);
}, "loadRoutes");
async function walkFiles(currentDirectory) {
  const router = Router();
  const files = fs.readdirSync(currentDirectory);
  const filesMeta = files.map((file) => {
    const filePath = path.join(currentDirectory, file);
    const stats = fs.statSync(filePath);
    return { name: file, isDirectory: stats.isDirectory() };
  });
  const groupFiles = {
    routers: [],
    methods: [],
    metadata: []
  };
  filesMeta.forEach((file) => {
    if (file.isDirectory) {
      groupFiles.routers.push(file.name);
    }
    if (/metadata.(t|j)s/gi.test(file.name)) {
      if (groupFiles.metadata.length >= 1)
        throw new Error(
          "Must be just 1 metadata file per folder to avoid colissions into " + currentDirectory
        );
      groupFiles.metadata.push(file.name);
    }
    if (/^(get|post|put|patch|delete|head|options)\.(t|j)s$/gi.test(file.name)) {
      groupFiles.methods.push(file.name);
    }
  });
  console.log(groupFiles);
  for (const routy of groupFiles.routers) {
    const subRouter = await walkFiles(path.join(currentDirectory, routy));
    if (groupFiles.metadata.length > 0) {
      try {
        const metadata = (await import("file:///" + path.normalize(path.join(currentDirectory, groupFiles.metadata[0])))).metadata;
        const before = Array.isArray(metadata.middlewares) ? metadata.middlewares : metadata.middlewares?.before ?? [];
        const after = !Array.isArray(metadata.middlewares) ? metadata.middlewares?.after ?? [] : [];
        router.use(`/${routy}`, before, subRouter, after);
      } catch (e) {
        console.log(e);
      }
    } else {
      router.use(`/${routy}`, subRouter);
    }
  }
  return router;
}
__name(walkFiles, "walkFiles");
export {
  loadRoutes
};
//# sourceMappingURL=index.js.map