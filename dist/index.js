var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/load-routes.ts
import {
  Router
} from "express";
import path, { sep } from "path";
import fs from "fs";
import chalk from "chalk";
var debugMode = process.env.AUTOLOAD_TRACER ?? false;
var fileProtocol = "file:///";
async function loadRoutes(routesPath) {
  try {
    return await walkFiles(routesPath);
  } catch (e) {
    console.error(e.message);
    return Router();
  }
}
__name(loadRoutes, "loadRoutes");
async function walkFiles(currentDirectory, depth = 0) {
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
  const parentRouteSections = currentDirectory.split(sep);
  const parentRoute = parentRouteSections[parentRouteSections.length - 1].replace(/\[([^\]]+)\]/gi, ":$1");
  let metadata = null;
  if (groupFiles.metadata.length > 0) {
    try {
      metadata = (await import(fileProtocol + path.normalize(path.join(currentDirectory, groupFiles.metadata[0])))).metadata;
    } catch (e) {
      console.error(e);
    }
  }
  for (const routy of groupFiles.routers) {
    const subRouter = await walkFiles(
      path.join(currentDirectory, routy),
      depth + 1
    );
    let before = Array.isArray(metadata?.middlewares) ? metadata?.middlewares : metadata?.middlewares?.before ?? [];
    let after = !Array.isArray(metadata?.middlewares) ? metadata?.middlewares?.after ?? [] : [];
    if (debugMode) {
      before = before.map((middy) => {
        return async (req, res, next) => {
          console.log(
            chalk.bold.hex("#06c967")("MIDDLEWARE RUNNING ON:"),
            path.join(currentDirectory, "metadata")
          );
          return middy(req, res, next);
        };
      });
      after = after.map((middy) => {
        return async (req, res, next) => {
          console.log(
            chalk.bold.hex("#06c967")("MIDDLEWARE RUNNING ON:"),
            path.join(currentDirectory, "metadata")
          );
          return middy(req, res, next);
        };
      });
    }
    router.use(
      `${depth === 0 ? "/" : "/" + parentRoute}`,
      before,
      subRouter,
      after
    );
  }
  for (const fileMethod of groupFiles.methods) {
    const section = currentDirectory.split(sep).slice(-1).join("").replace(/\[([^\]]+)\]/gi, ":$1");
    const module = await import(fileProtocol + path.normalize(path.join(currentDirectory, fileMethod)));
    const method = getMethodName(fileMethod);
    let before = Array.isArray(module.metadata?.middlewares) ? module.metadata?.middlewares : module.metadata?.middlewares?.before ?? [];
    let after = !Array.isArray(module.metadata?.middlewares) ? module.metadata?.middlewares?.after ?? [] : [];
    if (debugMode) {
      before = before.map((middy) => {
        return async (req, res, next) => {
          console.log(
            chalk.bold.hex("#06c967")("MIDDLEWARE RUNNING ON:"),
            path.join(currentDirectory, fileMethod)
          );
          return middy(req, res, next);
        };
      });
      after = after.map((middy) => {
        return async (req, res, next) => {
          console.log(
            chalk.bold.hex("#06c967")("MIDDLEWARE RUNNING ON:"),
            path.join(currentDirectory, fileMethod)
          );
          return middy(req, res, next);
        };
      });
    }
    const handler = /* @__PURE__ */ __name(async (req, res, next) => {
      await module.default(req, res, next);
      next();
    }, "handler");
    if (groupFiles.metadata.length > 0) {
      let metadata2 = null;
      try {
        metadata2 = (await import(fileProtocol + path.normalize(
          path.join(currentDirectory, groupFiles.metadata[0])
        ))).metadata;
        const insertBefore = Array.isArray(
          metadata2?.middlewares
        ) ? metadata2?.middlewares : metadata2?.middlewares?.before ?? [];
        const insertAfter = !Array.isArray(
          metadata2?.middlewares
        ) ? metadata2?.middlewares?.after ?? [] : [];
        before.unshift(...insertBefore);
        after.push(...insertAfter);
      } catch (e) {
        console.error(e);
      }
    }
    router[method ?? "get"](
      `/${section.replace(/\[([^\]]+)\]/gi, ":$1")}`,
      before,
      handler,
      after
    );
  }
  return router;
}
__name(walkFiles, "walkFiles");
function getMethodName(routePath) {
  const methodMatch = routePath.match(
    /^(get|post|put|patch|delete|head|options)\.(t|j)s$/i
  );
  if (methodMatch !== null) {
    return methodMatch[1].toLowerCase();
  }
  return null;
}
__name(getMethodName, "getMethodName");
export {
  loadRoutes
};
//# sourceMappingURL=index.js.map