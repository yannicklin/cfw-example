import { RequestMiddlewareRegistration } from "../lib/router/middlewareRegistration";
import { PreRequestRouterObject } from "../lib/router/router";

const webCtmReRoute = async (data: PreRequestRouterObject): Promise<Request> => {
  let url: URL = new URL(data.middlewareData.request.url);
  url.hostname = "nxi.secure.xxx.xxx.xxx";
  url.protocol = "https";
  url.port = "";
  // strip trailing slash from path
  const path: string = url.pathname;
  url.pathname = path[path.length - 1] == "/" ? path.substring(0, path.length - 1) : path;
  console.log("path is: " + url.pathname);

  return new Request(url, data.middlewareData.request);
};

// this middleware re-routes all requests to CTM dev environment
// it is used when running the worker locally and by CF worker feature branches
export function getLocalRequestMiddleware(requestMiddleware: RequestMiddlewareRegistration[]): RequestMiddlewareRegistration[] {
  // Reroute all requests to dev ctm site
  requestMiddleware.unshift(
    [
      "/*",
      async (data: PreRequestRouterObject): Promise<Request> => {
        let url: URL = new URL(data.middlewareData.request.url);
        // redirect localhost traffic to dev
        if (url.hostname === "localhost") {
          url.hostname = "dev.xxx.xxx.xxx";
          url.protocol = "https";
          url.port = "";
        }
        return new Request(url, data.middlewareData.request);
      }
    ],
    ["/ctm/*", webCtmReRoute],
    ["/launcher/wars*", webCtmReRoute]
  );
  return requestMiddleware;
}