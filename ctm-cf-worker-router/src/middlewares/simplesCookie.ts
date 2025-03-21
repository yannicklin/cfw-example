import { MiddlewareData } from "ctm-cf-worker-router-core";
import { simplesLoggedInFragment, simplesLogoutFragment } from "./trafficType";
import { makeSetCookieHeader } from "./cookieJar";

// the health call centre/ Simples cookie name
export const callCentreCookieName = "isSimplesUser";
// the web ctm hostname
// the web ctm hostname
const webCtmHost = ".comparethemarket.com.au";

// adds or removes the call centre cookie on the client
export async function SimplesCookieManager(data: MiddlewareData) {
  let newRes = new Response(data.response.body, data.response);
  // add set cookie header if user is logged into Simples
  if (data.request.url.includes(simplesLoggedInFragment)) {
    newRes.headers.append("Set-Cookie", makeSetCookieHeader(callCentreCookieName, "true", true, false, "", "", webCtmHost));
  }
  // remove simples cookie if is simples logout
  if (data.request.url.includes(simplesLogoutFragment)) {
    newRes.headers.append("Set-Cookie", makeSetCookieHeader(callCentreCookieName, "", true, false, "", "Thu, 01 Jan 1970 00:00:00 GMT", webCtmHost));
  }
  return newRes;
}