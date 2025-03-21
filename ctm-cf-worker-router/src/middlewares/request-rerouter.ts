import { PreRequestRouterObject } from "../lib/router/router.js";
function changeUrl(url: URL, destHost: string, routePrefix: any, removeSubRoute: boolean) {
  const newUrl = new URL(url);
  newUrl.port = "";
  newUrl.hostname = destHost;

  let oldPath = url.pathname;
  let newPath = oldPath;
  if (removeSubRoute) {
    newPath = oldPath.replace(routePrefix, "/");
    if (oldPath === newPath) {
      throw `route ${oldPath} did not contain route prefix ${routePrefix}`;
    }
  }
  newUrl.pathname = newPath;
  return newUrl;
}
/**
 * Takes any request and removes a prefix from the url
 * Useful for rerouting a subroute to it's base route for feature branch testing
 * lets ctm.com/feature-branch/pet to serve dev.ctm.com/pet with new middleware without breaking the original
 * @param prefix url prefix to remove
 * @param data middlewareData
 * @returns new request
 */
export async function ReRouter(prefix: string, data: PreRequestRouterObject) {
  let url = new URL(data.middlewareData.request.url);
  let oldPath = url.pathname;

  let newPath = oldPath.replace(prefix, "");
  if (oldPath === newPath) {
    throw `route ${oldPath} did not contain route prefix ${prefix}`;
  }
  url.pathname = newPath;
  return new Request(url, data.middlewareData.request);
}
