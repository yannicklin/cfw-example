import { MiddlewareData } from "ctm-cf-worker-router-core";
import { RouterType } from "itty-router";
import { ExecuteMiddleware, MiddlewareFunc } from "../middlewareLib.js";
import {
  executeRequestMiddleware as ExecuteRequestMiddleware,
  MakeRequestMiddleware,
  RequestMiddleware,
  RequestMiddleWareFun
} from "../requestMiddlewareLib.js";
import { PostRequestRouterObject, PreRequestRouterObject } from "./router.js";

export type ResponseMiddlewareRegistration = [string, MiddlewareFunc[], boolean?];

/**
 * Function designed to modify a request before it has been run.
 */
export type RequestMiddlewareRegistration = [
  string,
    RequestMiddleware[] | RequestMiddleWareFun[] | RequestMiddleWareFun
];

// a type that holds all the middlewares that will be executed in the complete request/response lifecycle
export type MiddlewareRegistrations = {
  requestMiddleware: RequestMiddlewareRegistration[];
  responseMiddleware: ResponseMiddlewareRegistration[];
  preResponseMiddleware: (input: MiddlewareData) => Response;
}

/*Attaches each item in the list of middleware to the router at the provided route
 * Order is important because the router will attempt to match the routes in the order they are provided
 * Because middleware can be set to earlyReturn
 */
export function registerResponseMiddleware(
  middleware: ResponseMiddlewareRegistration[],
  preResponseProcessing: (data: MiddlewareData) => Response,
  router: RouterType
) {
  for (let [route, fn, earlyRet] of middleware) {
    router.all(route, async (request: any, _) => {
      let req = request as PostRequestRouterObject;

      req.middlewareData = await ExecuteMiddleware(fn, req.middlewareData);
      if (earlyRet) {
        return preResponseProcessing(req.middlewareData);
      }
    });
  }
}

/**Attaches each item in the list of middleware to the router at the provided route
 * Order is important because the router will attempt to match the routes in the order they are provided
 *
 */
export function registerRequestMiddleware(middlewares: RequestMiddlewareRegistration[], router: RouterType) {
  for (let [route, middleware] of middlewares) {
    let midFuncs: RequestMiddleware[] = [];

    //determine what kind of middleware has been provided, we support just using a function as well as a full middleware type
    //Regardless all we need is a list of middleware functions to execute
    // @ts-ignore
    if (middleware instanceof Array<RequestMiddleware>) midFuncs = middleware as RequestMiddleware[];
    else { // @ts-ignore
      if (middleware instanceof Array<Function>)
        midFuncs = (middleware as RequestMiddleWareFun[]).map((func: RequestMiddleWareFun) =>
          MakeRequestMiddleware("unnamed", func)
        );
      else if (middleware instanceof Function) midFuncs = [MakeRequestMiddleware("unnamed", middleware)];
    }
    //@ts-ignore
    router.all(route, async (request: PreRequestRouterObject, _) => {
      const res = await ExecuteRequestMiddleware(request, midFuncs);
      request.middlewareData = res;
    });
  }
}
