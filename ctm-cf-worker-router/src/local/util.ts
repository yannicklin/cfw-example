import testPage from "./page.html";
import { RequestMiddlewareData } from "ctm-cf-worker-router-core";

// FIXME - confirm whether this is still required - now that we reach out to dev when running locally, an upstream server will always be located.
// We prevent recursion if the request has a header indicating it has already been through the worker.
// If recursing then return 404 because the request mustn't have hit a destination
export async function handleLocalRecursion(request: Request, testMode: string | true | null): Promise<RequestMiddlewareData> {

  // initialise the middlewareData response object
  let middlewareData: RequestMiddlewareData = {
    originalRequest: request,
    request: request,
    headerScripts: [],
    config: {},
    response: null
  };

  const recursionCount: number = Number.parseInt(request.headers.get("ctm-cf-router") ?? "0");

  if (recursionCount >= 5) {
    console.log("Calling the same worker again in the same request. returning 404 to avoid recursion ");
    if (!testMode)
      middlewareData.response = new Response(
        `Worker was called for the ${recursionCount} time in one request. This indicates recursion because nothing exists on the route other than the worker.`,
        { status: 404 }
      );
    //When in test mode we return the test page if we can't find the page
    else {
      middlewareData.response = new Response(testPage, { headers: { "content-type": "text/html" } });
    }
    // return immediately with populated response
    return middlewareData;
  }

  // update request with recursion header incremented
  let newReq: Request = new Request(request);
  newReq.headers.set("ctm-cf-router", (recursionCount + 1).toString());
  middlewareData.request = newReq;
  return middlewareData;
}