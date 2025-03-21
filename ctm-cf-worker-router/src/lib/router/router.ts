import { MiddlewareData, RequestMiddlewareData } from "ctm-cf-worker-router-core";
import { Router, RouterType } from "itty-router";
import {
  registerRequestMiddleware,
  registerResponseMiddleware,
  RequestMiddlewareRegistration,
  ResponseMiddlewareRegistration
} from "./middlewareRegistration.js";

//custom request with our extra data for the router
export interface PreRequestRouterObject {
  middlewareData: RequestMiddlewareData;
}

//custom request with our extra data for the router
export interface PostRequestRouterObject {
  middlewareData: MiddlewareData;
}

export async function getResponse(data: MiddlewareData) {
  console.log("Requesting: ", data.request.url);
  return await fetch(data.request);
}

export function setupRouter(
  requestMiddleware: RequestMiddlewareRegistration[],
  responseMiddleware: ResponseMiddlewareRegistration[],
  preResponseProcessing: (middlewareData: MiddlewareData) => Response
) {
  return setupRouterWithConfigFuncs(
    (router) => registerRequestMiddleware(requestMiddleware, router),
    (router) => registerResponseMiddleware(responseMiddleware, preResponseProcessing, router),
    preResponseProcessing
  );
}

/*
The process is as below: 
- embed request in middlewareData 
- run request middleware:
  each can change the request or return a response 
- fetch the request, unless our request middleware returned a response in which case we skip this
- make changes to response
- return response
*/

/**
 *Initialise the router
 *Add your own routes in the routingConfig function
 */
function setupRouterWithConfigFuncs(
  preRequestRoutingConfig: (router: RouterType) => void,
  postRequestRoutingConfig: (router: RouterType) => void,
  preResponseProcessing: (middlewareData: MiddlewareData) => Response
) {
  console.log("Handling response using router");
  //We make the router
  const router = Router();

  //We want to setup the data in the request for all our future middleware
  // @ts-ignore
  router.all("*", async (request: PreRequestRouterObject, workers: any, actualRequest: any) => {
    const middlewareData: RequestMiddlewareData = {
      originalRequest: actualRequest,
      headerScripts: [],
      request: actualRequest,
      config: {},
      response: null
    };
    request.middlewareData = middlewareData;
  });

  preRequestRoutingConfig(router);

  //Should run first to get the request and put it in the router
  // @ts-ignore
  router.all("*", async (request: PostRequestRouterObject, _: any) => {
    //If the response has already been set in the pre-request middleware we don't want to overwrite it
    if (request?.middlewareData?.response != null) {
      console.log("Response already set in pre-request middleware");
      return;
    }
    let response = await getResponse(request.middlewareData);
    console.log("response status code:", response.status);
    request.middlewareData.response = response;
  });

  postRequestRoutingConfig(router);

  //response should come last
  // @ts-ignore
  router.all("*", async (request: PostRequestRouterObject) => {
    //We delegate to a function to allow for some custom work to be done before all responses
    return preResponseProcessing(request.middlewareData);
  });
  return router;
}
