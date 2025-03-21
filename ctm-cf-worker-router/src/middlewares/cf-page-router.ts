import { AttributeRewriter } from "ctm-cf-worker-router-core";

//We are going to make a router.
//It's going to take a url like https://mysite.com.au/app1/do-thing and return the result of getting https://app1.mysite.com.au/do-thing

export type CFPageRouteSettings = {
  //eg: routePrefix=apps/app1 : apps/app1/do-thing-> /do-thing
  routePrefix: string;
  //The server to redirect to: eg page.dev.xxx.xxx.xxx
  destHost: string;
  //Remove the route that we came from from the request to the page
  removeSubRoute: boolean;
  //Set a static route for the request sent to the cf page
  staticPath?: string;
  cfAccessDetails?: CFAccessDetails;
};

export type CFAccessDetails = {
  cfAccessClientId: string;
  cfAccessSecret: string;
};

function changeUrl(url: URL, destHost: string, routePrefix: string, removeSubRoute: boolean, staticPath?: string): URL {
  const newUrl = new URL(url);
  newUrl.port = "";
  newUrl.hostname = destHost;

  let oldPath = url.pathname;
  let newPath = oldPath;
  if (removeSubRoute) {
    newPath = oldPath.replace(routePrefix, "/");
    if (oldPath === newPath) {
      newPath = oldPath.replace(routePrefix.substring(0, routePrefix.length - 1), "");
      if (oldPath === newPath) {
        throw `route ${oldPath} did not contain route prefix ${routePrefix}`;
      }
    }
  }
  if (staticPath) {
    newPath = staticPath; 
  }
  newUrl.pathname = newPath;
  return newUrl;
}

///Used for flutter applications so that requests made will go to our proxied url rather than the default '/'
export function tryRewriteBaseTag(page: Response, myUrl: URL, routePrefix: string): Response {
  const contentType: string | null = page.headers.get("Content-Type");
  //rewrite the request if it is html
  if (contentType !== null && contentType.startsWith("text/html")) {
    myUrl.pathname = routePrefix;
    // remove url query params
    myUrl.search = "";
    const baseUrl: URL = new URL(myUrl.toString());
    console.log("rewriting base tag to ", baseUrl);
    const rewriter: HTMLRewriter = new HTMLRewriter()
      .on(
        "base",
        new AttributeRewriter("href", baseUrl.toString().endsWith("/") ? baseUrl.toString() : baseUrl.toString() + "/")
      );

    return rewriter.transform(page);
  }
  return page;
}

function removeFromCookies(headers: Headers, headerName: string, cookieName: string) {
  let cookies = headers.get(headerName);
  if (cookies) {
    // fix missing ; from CF Auth cookie
    cookies.replace(/(.*)(SameSite=\w+),(.*)/g, "$1$2;,$3");

    // Split the cookie header to get an array of "cookie=value" parts
    let cookiesArray = cookies.split(";,");

    // Filter out the cookie you want to delete
    cookiesArray = cookiesArray.filter((cookie) => !cookie.startsWith(cookieName + "="));

    // Join the remaining cookies back into a single string
    cookies = cookiesArray.join(";,");

    // Delete the old Cookie header and add the new one without the deleted cookie
    headers.set(headerName, cookies);

    console.log("Removed the " + cookieName + " cookie from the " + headerName + " header");
  }
}

/*
Removes the CF_Authorization cookie in the Set-Cookie header, set by zero trust that protects the CF page
 */
export function removedCFAuthCookieSet(page: Response): Response {
  let newPage = new Response(page.body, page);
  removeFromCookies(newPage.headers, "Set-Cookie", "CF_Authorization");
  return newPage;
}

/**
 * Adds the CF-Access-Client-Id and CF-Access-Client-Secret headers to the request if they are set
 * This will let our worker to fetch pages secured by CF Access/Zero Trust
 * @param request:Request
 * @param details CF access credentials
 */
export function tryAddCFAccessHeaders(request: Request, details: CFAccessDetails | undefined) {
  if (details == null) {
    console.log("no cf access details provided when supposed to be setting cf access headers");
    return request;
  }

  const { cfAccessClientId, cfAccessSecret } = details;

  const newHeaders = new Headers(request.headers);
  newHeaders.set("CF-Access-Client-Id", cfAccessClientId);
  newHeaders.set("CF-Access-Client-Secret", cfAccessSecret);

  return new Request(request, {
    headers: newHeaders
  });
}

export function hasCfAccessHeaders(request: Request) {
  const hasHeaders =
    request.headers.get("CF-Access-Client-Id") !== null && request.headers.get("CF-Access-Client-Secret") !== null;
  console.log(`Has cf access headers: ${hasHeaders}`);
}

// Our function to handle the response.
export function routePage(
  request: Request,
  { routePrefix, destHost, removeSubRoute, staticPath, cfAccessDetails }: CFPageRouteSettings
) {
  console.log(`routing from ${request.url} to ${destHost} using page router`);
  // The URL that is being requested.
  const url = new URL(request.url);
  const newUrl = changeUrl(url, destHost, routePrefix, removeSubRoute, staticPath);
  let req = new Request(newUrl, request);
  let newReq: Request;
  if (cfAccessDetails != undefined) {
    newReq = tryAddCFAccessHeaders(req, cfAccessDetails);
  } else {
    newReq = req;
  }

  return newReq;
}
