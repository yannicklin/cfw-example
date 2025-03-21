import { Config } from "../config";
import { Environment } from "../index";
import { getCookie } from "../utils";
import { MiddlewareData, RequestMiddlewareData } from "ctm-cf-worker-router-core";
import { MiddlewareRegistrations } from "../lib/router/middlewareRegistration";

// This type holds the feature branch data, determined on a per request basis
export type FeatureBranchSettings = {
  isFeatureSubdomain: boolean;
  featureTag: string;
  isRedirectAllowed: boolean;
  hasFeatureCookie: boolean;
  isFeatureOrigin: boolean;
};


// determines whether the request to the dev worker, from a feature branch is eligible to be redirected.
// these redirects instruct the client to make their request, using the feature branch sub domain
function isRedirectAllowed(request: Request): boolean {
  const reqUrl: URL = new URL(request.url);

  // don't redirect auth0 callbacks
  const isAuth0Callback: boolean = reqUrl.pathname.includes("/login/callback");
  console.log("isAuth0Callback is: " + isAuth0Callback);

  // don't redirect requests to everest /journey/new/ctm
  // this creates the journey with the account id in the JWT - we want to use the JWT from the client,
  // so that calls to handover (which checks the journey account ID against the JWT), will succeed
  let isEverestJourneyCreate: boolean = false;
  for (const route of Config.featureBranchConfig.everestJourneyCreateRoutes) {
    if (reqUrl.pathname.includes(route)) {
      isEverestJourneyCreate = true;
      break;
    }
  }

  // don't redirect everest handovers - they require an auth header where the JWT account id claim matches that of the journey,
  // so we allow them through to dev, using the access_token from the client
  let isEverestHandover: boolean = false;
  for (const route of Config.featureBranchConfig.everestHandoverRoutes) {
    if (reqUrl.pathname.includes(route)) {
      isEverestHandover = true;
      break;
    }
  }

  // don't redirect energy activity requests - they also require a JWT account id claim that matches the journey
  const isEnergyActivityRequest: boolean = reqUrl.pathname.includes("/api/energy-journey/journey/activity");

  // don't redirect pet handover
  const isPetHandover: boolean = reqUrl.pathname.includes("/api/pet/quote/handover");

  return !(isAuth0Callback || isEverestJourneyCreate || isEverestHandover || isEnergyActivityRequest || isPetHandover);
}


export async function handleFeatureBranchRequest(request: Request, env: Environment): Promise<RequestMiddlewareData> {
  // initialise the middlewareData response object
  let middlewareData: RequestMiddlewareData = {
    originalRequest: request,
    request: request,
    headerScripts: [],
    config: {},
    response: null
  };

  // check if this is a feature branch worker ie has received a request from a feature branch path
  const reqUrl: URL = new URL(request.url);
  const isFeatureSubdomain: boolean = reqUrl.hostname.includes(Config.featureBranchConfig.featureBranchTag);

  // get feature tag value in the following order:
  // 1. subdomain
  // 2. feature cookie
  // 3. origin
  let featureTag: string = "";
  if (isFeatureSubdomain) {
    const hostMatches: RegExpMatchArray | null = reqUrl.hostname.match(Config.featureBranchConfig.featureBranchTagPattern);
    if (hostMatches) {
      featureTag = hostMatches[0];
    }
  }

  // check if this is the dev worker that has been invoked from a feature branch ie feature tag cookie exists
  const cookieFeatureTag: string | null = getCookie(request.headers, Config.featureBranchConfig.featureCookieName);
  const hasFeatureCookie: boolean = cookieFeatureTag != null && cookieFeatureTag.includes(Config.featureBranchConfig.featureBranchTag);
  if (hasFeatureCookie && featureTag === "") {
    featureTag = !!cookieFeatureTag ? cookieFeatureTag : "";
  }

  // check if this is the dev worker that has been invoked from a feature branch ie is feature origin
  // @ts-ignore
  const isFeatureOrigin: boolean = request.headers.has("Origin") && request.headers.get("Origin").includes(Config.featureBranchConfig.featureBranchTag);
  if (isFeatureOrigin) {
    const origin: string | null = request.headers.get("Origin");
    const originVal: string = !!origin ? origin : "";
    const originMatches: RegExpMatchArray | null = originVal.match(Config.featureBranchConfig.featureBranchTagPattern);
    if (originMatches && featureTag === "") {
      featureTag = originMatches[0];
    }
  }

  // browsers do not allow redirects on OPTIONS requests
  const isOptionsRequest: boolean = request.method.includes("OPTIONS");

  const redirectAllowed: boolean = (env.ENV === "dev" && ! (isFeatureSubdomain || isOptionsRequest)) && isRedirectAllowed(request);

  // set feature branch config on the middlewareData response object
  middlewareData.config = {
    isFeatureSubdomain: isFeatureSubdomain,
    featureTag: featureTag,
    isRedirectAllowed: redirectAllowed,
    hasFeatureCookie: hasFeatureCookie,
    isFeatureOrigin: isFeatureOrigin
  };

  if (env.ENV === "dev") {
    if (!isFeatureSubdomain && (hasFeatureCookie || isFeatureOrigin) && redirectAllowed ) {
      // this is a request to the dev worker, called directly from the feature branch - send redirect back to client, to call using feature branch subdomain
      const redirectUrl: URL = new URL(reqUrl.toString());
      if (redirectUrl.host.includes(".secure")) {
        redirectUrl.host = (featureTag === "" ? "nxi" : featureTag) + ".secure.xxx.xxx.xxx";
      } else {
        redirectUrl.host = (featureTag === "" ? "" : featureTag + ".") + "dev.xxx.xxx.xxx";
      }
      const response: Response = new Response(null, { status: 307 });
      response.headers.append("Location", redirectUrl.toString());
      // needed for the pet journey request
      response.headers.append("Access-Control-Allow-Credentials", "true");

      console.log("Request from feature branch has bypassed the feature worker - redirecting request back to feature branch with redirect url: " + redirectUrl.toString());
      middlewareData.response = response;

    } else if (isFeatureSubdomain && !isOptionsRequest) {
      // where we redirect feature branch requests that have called directly to dev, the browsers strips sensitive headers (eg Cookie and Authorization), before following the redirect location. For secured everest routes this results in a 401.
      // We therefore add an Authorisation header, to feature requests only, to allow these requests to succeed.
      for (const route of Config.featureBranchConfig.securedEverestRoutes) {
        if (reqUrl.pathname.includes(route)) {
          // get auth token
          const authReq: Request = new Request("https://dev.xxx.xxx.xxx/api/account/token/anonymous/ctm", { method: "GET" });
          const authRes: Response = await fetch(authReq);
          const data = await authRes.json();
          // @ts-ignore
          const newAuthToken: string = data.access_token;
          // add auth header to request
          const authRequest: Request = new Request(request);
          authRequest.headers.append("Authorization", "Bearer " + newAuthToken);
          middlewareData.request = authRequest;
          console.info("Added auth header to secured everest endpoint");
          break;
        }
      }
    }
  }

  return middlewareData;
}


// if dev worker has been invoked from a feature branch, remove all middleware,
// so that request/response modification can be managed in the feature branch worker.
// Note this is expected to only occur on OPTIONS requests, everest and pet Handover, everest journey create or energy activity requests.
// requests from a feature CF worker to DEV, will bypass the DEV worker all together
export function validateFeatureBranchMiddleware(featureConfig: FeatureBranchSettings, env: Environment, middlewareReg: MiddlewareRegistrations): MiddlewareRegistrations {
  if (env.ENV === "dev" && (!featureConfig.isFeatureSubdomain &&
    (featureConfig.hasFeatureCookie || featureConfig.isFeatureOrigin)) && !featureConfig.isRedirectAllowed ) {
    console.log("Disabling all middleware, for requests from feature branch");
    middlewareReg.requestMiddleware = [];
    middlewareReg.responseMiddleware = [];
    middlewareReg.preResponseMiddleware = (data: MiddlewareData) => data.response;
  }
  return middlewareReg;
}


export function handleFeatureBranchResponse(featureConfig: FeatureBranchSettings, env: Environment, res: Response, requestMethod: string): Response {
  let newRes: Response = new Response(res.body, res);

  if (env.ENV === "dev" && featureConfig.isFeatureSubdomain) {

    // if feature branch, and hasFeatureCookie is missing, set feature tag cookie
    if (!featureConfig.hasFeatureCookie) {
      const cookieVal: string = Config.featureBranchConfig.featureCookieName + "=" + featureConfig.featureTag + "; Domain=xxx.xxx.xxx; Path=/; Secure; SameSite=None;";
      newRes.headers.append("Set-Cookie", cookieVal);
    }

    // if this is a feature branch request, and 301/2 has been received from the upstream server, then change to 307 so that the browser
    // uses the original http method and doesn't resort to a GET by default
    // Note: This redirect is hotfix on some vertical journey calls with Feature Branches, but no specific scenarios found in recall
    if ((res.status === 301 || res.status === 302) && requestMethod != "GET") {
      console.log("Request from feature branch has been reidrected with new status: 308");

      newRes = new Response(newRes.body, { status: 308 });
    }
  }

  return newRes;
}