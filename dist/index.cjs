"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var express_autoload_routes_exports = {};
__export(express_autoload_routes_exports, {
  loadRoutes: () => loadRoutes
});
module.exports = __toCommonJS(express_autoload_routes_exports);

// src/load-routes.ts
var import_express = require("express");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var fileProtocol = "file:///";
async function loadRoutes(routesPath) {
  try {
    return await walkFiles(routesPath);
  } catch (e) {
    console.error(e.message);
    return (0, import_express.Router)();
  }
}
__name(loadRoutes, "loadRoutes");
async function walkFiles(currentDirectory, depth = 0) {
  const router = (0, import_express.Router)();
  const files = import_fs.default.readdirSync(currentDirectory);
  const filesMeta = files.map((file) => {
    const filePath = import_path.default.join(currentDirectory, file);
    const stats = import_fs.default.statSync(filePath);
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
  const parentRouteSections = currentDirectory.split(import_path.sep);
  const parentRoute = parentRouteSections[parentRouteSections.length - 1].replace(/\[([^\]]+)\]/gi, ":$1");
  let metadata = null;
  if (groupFiles.metadata.length > 0) {
    try {
      metadata = (await import(fileProtocol + import_path.default.normalize(import_path.default.join(currentDirectory, groupFiles.metadata[0])))).metadata;
    } catch (e) {
      console.error(e);
    }
  }
  for (const routy of groupFiles.routers) {
    const subRouter = await walkFiles(
      import_path.default.join(currentDirectory, routy),
      depth + 1
    );
    const before = Array.isArray(metadata?.middlewares) ? metadata?.middlewares : metadata?.middlewares?.before ?? [];
    const after = !Array.isArray(metadata?.middlewares) ? metadata?.middlewares?.after ?? [] : [];
    router.use(
      `${depth === 0 ? "/" : "/" + parentRoute}`,
      before,
      subRouter,
      after
    );
  }
  for (const fileMethod of groupFiles.methods) {
    const section = currentDirectory.split(import_path.sep).slice(-1).join("").replace(/\[([^\]]+)\]/gi, ":$1");
    const module2 = await import(fileProtocol + import_path.default.normalize(import_path.default.join(currentDirectory, fileMethod)));
    const method = getMethodName(fileMethod);
    const before = Array.isArray(module2.metadata?.middlewares) ? module2.metadata?.middlewares : module2.metadata?.middlewares?.before ?? [];
    const after = !Array.isArray(module2.metadata?.middlewares) ? module2.metadata?.middlewares?.after ?? [] : [];
    const handler = /* @__PURE__ */ __name(async (req, res, next) => {
      await module2.default(req, res, next);
      next();
    }, "handler");
    if (groupFiles.metadata.length > 0) {
      let metadata2 = null;
      try {
        metadata2 = (await import(fileProtocol + import_path.default.normalize(
          import_path.default.join(currentDirectory, groupFiles.metadata[0])
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loadRoutes
});
//# sourceMappingURL=index.cjs.map