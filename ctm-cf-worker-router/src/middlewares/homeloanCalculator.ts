import { PreRequestRouterObject } from "../lib/router/router.js";
import { MiddlewareData } from "ctm-cf-worker-router-core";
// This middleware manages the retrieval of the home-loans simple borrowing-power
// calculator iframe provided by the 3rd party provider, VisionAbacus
const redirectHost: string = "www.visionabacus.net";
const invalidContentTypePath: string = "/AbacusServer/JS/AbacusJS/AbacusJS_B3";

/**
 * This function manages the redirect URLs for the homeloans simple calculator iFrame
 * @param data the internal middleware object
 * @returns the updated request object
 */
export async function RouteHomeloanCalculator(data: PreRequestRouterObject) {
  const url: URL = new URL(data.middlewareData.request.url);
  const redirectUrl: URL = getRedirectURL(url);
  return new Request(redirectUrl, data.middlewareData.request);
}

function getRedirectURL(incoming: URL): URL {
  // the wordpress page hosting the calculator iFrame is configured to request the calc on the original iframe path on our domain.
  // this allows martech to track interactions with the calculator.
  incoming.hostname = redirectHost;
  return incoming;
}

/**
 * This response middleware is required to updated the content-type header of a JS file retrieved from VisionAbacus.
 * With the returned content-type of text/html, browsers will refuse to execute the script due to strict MIME type checking.
 * This fix is intended as a temporary workaround until such time as the partner updates their content-type header.
 * @param data the middleware date
 * @return the modified response
 */
export async function UpdateContentTypeHeader(data: MiddlewareData): Promise<Response> {
  let newRes: Response = new Response(data.response.body, data.response);
  if (data.originalRequest.url.includes(invalidContentTypePath)) {
    newRes.headers.set("content-type", "text/javascript");
  }
  return newRes;
}