import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";
import path, { sep } from "path";
import fs from "fs";
import chalk from "chalk";

const debugMode = process.env.AUTOLOAD_TRACER ?? false;

export type MiddlewareType =
  | RequestHandler[]
  | {
      before?: RequestHandler[];
      after?: RequestHandler[];
    };

export interface RouteMetadata {
  middlewares?: MiddlewareType;
}

export interface AutoloadRoutesOptions {
  root?: string;
}

export const DEFAULT_METADATA: RouteMetadata = {
  middlewares: [],
};

const fileProtocol = "file:///";

export async function loadRoutes(routesPath: string): Promise<Router> {
  try {
    return await walkFiles(routesPath);
  } catch (e: any) {
    console.error(e.message);
    return Router();
  }
}

async function walkFiles(
  currentDirectory: string,
  depth: number = 0
): Promise<Router> {
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
  // Grouping files into an object with methods routes and metadata
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
  const parentRouteSections = currentDirectory.split(sep);
  const parentRoute = parentRouteSections[
    parentRouteSections.length - 1
  ].replace(/\[([^\]]+)\]/gi, ":$1");

  let metadata: RouteMetadata | null = null;
  if (groupFiles.metadata.length > 0) {
    try {
      metadata = (
        await import(
          fileProtocol +
            path.normalize(path.join(currentDirectory, groupFiles.metadata[0]))
        )
      ).metadata;
    } catch (e) {
      console.error(e);
    }
  }

  for (const routy of groupFiles.routers) {
    const subRouter = await walkFiles(
      path.join(currentDirectory, routy),
      depth + 1
    );
    let before: RequestHandler[] = Array.isArray(metadata?.middlewares)
      ? metadata?.middlewares
      : metadata?.middlewares?.before ?? [];

    let after: RequestHandler[] = !Array.isArray(metadata?.middlewares)
      ? metadata?.middlewares?.after ?? []
      : [];

    if (debugMode) {
      before = before.map((middy) => {
        return async (req: Request, res: Response, next: NextFunction) => {
          console.log(
            chalk.bold.hex("#06c967")("MIDDLEWARE RUNNING ON:"),
            path.join(currentDirectory, "metadata")
          );
          return middy(req, res, next);
        };
      });
      after = after.map((middy) => {
        return async (req: Request, res: Response, next: NextFunction) => {
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
    const section = currentDirectory
      .split(sep)
      .slice(-1)
      .join("")
      .replace(/\[([^\]]+)\]/gi, ":$1");
    const module: { metadata?: RouteMetadata; default: RequestHandler } =
      await import(
        fileProtocol + path.normalize(path.join(currentDirectory, fileMethod))
      );
    const method = getMethodName(fileMethod);
    let before: RequestHandler[] = Array.isArray(module.metadata?.middlewares)
      ? module.metadata?.middlewares
      : module.metadata?.middlewares?.before ?? [];
    let after: RequestHandler[] = !Array.isArray(module.metadata?.middlewares)
      ? module.metadata?.middlewares?.after ?? []
      : [];

    if (debugMode) {
      before = before.map((middy) => {
        return async (req: Request, res: Response, next: NextFunction) => {
          console.log(
            chalk.bold.hex("#06c967")("MIDDLEWARE RUNNING ON:"),
            path.join(currentDirectory, fileMethod)
          );
          return middy(req, res, next);
        };
      });
      after = after.map((middy) => {
        return async (req: Request, res: Response, next: NextFunction) => {
          console.log(
            chalk.bold.hex("#06c967")("MIDDLEWARE RUNNING ON:"),
            path.join(currentDirectory, fileMethod)
          );
          return middy(req, res, next);
        };
      });
    }

    const handler = async (req: Request, res: Response, next: NextFunction) => {
      await module.default(req, res, next);
      next();
    };

    if (groupFiles.metadata.length > 0) {
      let metadata: RouteMetadata | null = null;
      try {
        metadata = (
          await import(
            fileProtocol +
              path.normalize(
                path.join(currentDirectory, groupFiles.metadata[0])
              )
          )
        ).metadata;
        const insertBefore: RequestHandler[] = Array.isArray(
          metadata?.middlewares
        )
          ? metadata?.middlewares
          : metadata?.middlewares?.before ?? [];
        const insertAfter: RequestHandler[] = !Array.isArray(
          metadata?.middlewares
        )
          ? metadata?.middlewares?.after ?? []
          : [];
        before.unshift(...insertBefore);
        after.push(...insertAfter);
      } catch (e) {
        console.error(e);
      }
    }

    // @ts-expect-error any
    router[method ?? "get"](
      `/${section.replace(/\[([^\]]+)\]/gi, ":$1")}`,
      before,
      handler,
      after
    );
  }

  return router;
}

function getMethodName(routePath: string): string | null {
  const methodMatch = routePath.match(
    /^(get|post|put|patch|delete|head|options)\.(t|j)s$/i
  );
  if (methodMatch !== null) {
    return methodMatch[1].toLowerCase();
  }
  return null;
}
