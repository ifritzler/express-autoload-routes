import { RequestHandler, Router } from 'express';

type MiddlewareType = RequestHandler[] | {
    before?: RequestHandler[];
    after?: RequestHandler[];
};
interface RouteMetadata {
    middlewares?: MiddlewareType;
}
declare function loadRoutes(routesPath: string): Promise<Router>;

export { type MiddlewareType, type RouteMetadata, loadRoutes };
