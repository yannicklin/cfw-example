import { MiddlewareData } from "ctm-cf-worker-router-core";

/**
 * Returns the portions of two strings until the point where they start differing, starting from the end.
 *
 * @param {string} s1 - The first string to compare.
 * @param {string} s2 - The second string to compare.
 * @returns {[string, string]} An array containing the portions of s1 and s2 until the difference.
 */
function getDifFromEnd(s1: string, s2: string): [string, string] {
  let difIndex = 0;

  // Compare strings from the end
  while (s1[s1.length - 1 - difIndex] === s2[s2.length - 1 - difIndex]) {
    difIndex++;
    if (s1.length <= difIndex || s2.length <= difIndex) break;
  }

  // Return portions of s1 and s2 until the difference
  return [s1.substring(0, s1.length - difIndex), s2.slice(0, s2.length - difIndex)];
}

/** Rewrites the location header in a redirect response so that it
 *
 * @param data
 * @returns
 */
export async function RedirectUrlFixer(data: MiddlewareData) {
  console.log("In RedirectUrlFixer");
  //not a 300 redirect response
  if (data.response.status < 300 || data.response.status >= 400) {
    console.log("Status in RedirectUrlFixer is: " + data.response.status);
    return data.response;
  }

  const originalUrl = new URL(data.originalRequest.url);
  const requestedUrl = new URL(data.request.url);
  const redirectPath = data.response.headers.get("location");
  if(!redirectPath){
    console.error("Received redirect http status with no redirect location header - no redirect will be processed");
    return data.response;
  }
  let redirectLocation = redirectPath;
  // check whether the location header is a full or partial url (everest returns partial urls)
  if(!redirectPath.includes("http")){
    // partial path received in redirect location, so add the request protocol and host
    redirectLocation = requestedUrl.protocol + "//" + requestedUrl.hostname + redirectPath;
  }
  const redirectUrl = new URL(redirectLocation);

  //We shouldn't do anything if the redirect is actually taking us away from the requested page
  if (redirectUrl.hostname != requestedUrl.hostname) {
    console.log("hostnames dont match - aborting");
    return data.response;
  }

  console.log(
    `redirect url: ${redirectUrl.toString()}, original url: ${originalUrl.toString()}, requested url: ${requestedUrl.toString()}`
  );
  /*
  We get a dif between the original url and the requested url
    We then replace the request url dif in the redirect url with the dif from the original url
    This will remap the redirected path onto the original path that the client requested,
    that way they don't end up on the wrong path after the redirect 
  */
  const routeMapping: [string, string] = getDifFromEnd(originalUrl.pathname, requestedUrl.pathname);
  console.log("route mapping: ", routeMapping);

  //TODO: we don't actually know if this works. But it's probably a good idea
  redirectUrl.pathname = redirectUrl.pathname.replace(routeMapping[1], routeMapping[0]);

  redirectUrl.hostname = originalUrl.hostname;
  redirectUrl.port = originalUrl.port;
  redirectUrl.protocol = originalUrl.protocol;

  console.log("new redirect url: ", redirectUrl.toString());

  const newResponse = new Response(data.response.body, data.response);
  newResponse.headers.set("Location", redirectUrl.toString());

  return newResponse;
}
