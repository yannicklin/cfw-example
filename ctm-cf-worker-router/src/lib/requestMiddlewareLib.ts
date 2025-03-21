import { LocalMiddlewareData } from "ctm-cf-worker-router-core";
import { PreRequestRouterObject } from "./router/router.js";
//This should probably actually separate the response and config
//
/**Middleware designed to edit the response in some way
 */
export type RequestMiddleWareFun = (data: PreRequestRouterObject) => Promise<Response | Request>;
/**A function that can be used as middleware
 *The name is for documentation and logging purposes
 */
export type RequestMiddleware = {
  name: string;
  func: RequestMiddleWareFun;
};

function jsonRequest(body: LocalMiddlewareData) {
  const myHeaders = new Headers();

  myHeaders.append("Content-Type", "application/json");
  return new Request("https://fake.com/a", {
    method: "POST",
    body: JSON.stringify(body),
    headers: myHeaders
  });
}

export function MakeRequestMiddleware(name: string, func: RequestMiddleWareFun): RequestMiddleware {
  return {
    func: func,
    name: name
  };
}

export async function executeRequestMiddleware(req: PreRequestRouterObject, middleware: RequestMiddleware[]) {
  for (const mid of middleware) {
    console.log("Running request middleware: ", mid.name);
    let result = await mid.func(req);
    if (result == undefined) throw "UNDEFINED:" + result;
    // If the result is a response we set it as the response. This will skip the router fetching
    if (result instanceof Response) {
      req.middlewareData.response = result;
    } else {
      // If the result is a request we set it as the request and let the router handle fetching
      req.middlewareData.request = result;
    }
  }
  return req.middlewareData;
}
