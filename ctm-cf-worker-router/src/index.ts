import { setupRouter } from "./lib/router/router.js";
import {
  MiddlewareRegistrations,
  RequestMiddlewareRegistration,
  ResponseMiddlewareRegistration
} from "./lib/router/middlewareRegistration.js";
import { preResponseProcessing } from "./lib/router/preResponse.js";
import { ConstructRequestMiddlewares, ConstructResponseMiddlewares } from "./constructMiddlewares.js";
import { getCookie, getCTMSubdomain, SubdomainInfo } from "./utils.js";
import { RequestMiddlewareData } from "ctm-cf-worker-router-core";
import { getLifeResponseMiddleware } from "./routes/life";
import { getBusinessResponseMiddleware } from "./routes/business";
import { getiSelectRequestMiddleware, getiSelectResponseMiddleware } from "./routes/iselect";
import { getChoosiRequestMiddleware, getChoosiResponseMiddleware } from "./routes/choosi";
import { getCtmRequestMiddleware, getCtmResponseMiddleware } from "./routes/ctm";
import {
  FeatureBranchSettings,
  handleFeatureBranchRequest,
  handleFeatureBranchResponse,
  validateFeatureBranchMiddleware
} from "./feature-branch/handler";
import { RouterType } from "itty-router";
import { getLocalRequestMiddleware } from "./routes/local";
import { handleLocalRecursion } from "./local/util";

export interface Environment {
  //worker service binding
  mw_svc_example: Fetcher | undefined;
  CTM_HOSTNAME: string;
  ISELECT_HOSTNAME: string;
  CHOOSI_HOSTNAME: string;
  LIFE_HOSTNAME: string;
  ARKOSE_JS_ENDPOINT: string;
  ARKOSE_VERIFY_TIMEOUT_SECS: number;
  TESTING: boolean;
  CF_ACCESS_AUTH_TOKEN: string;
  CF_ACCESS_CLIENT_ID: string;
  CF_PAGE_PREFIX: string;
  TRACKING_DATA_RETRY: number;
  ARKOSE_SESSION_TOKEN_EXPIRY_HRS: number;
  ENV: string;
}

export async function handleRequest(request: Request, env: Environment): Promise<Response | undefined> {
  const startTime: number = Date.now();
  console.log(`=========================${request.method} ${request.url}========================================`);
  let testMode: string | boolean | null = env.TESTING || getCookie(request.headers, "cf_worker_test_mode");

  // handle feature branch request
  const middlewareData: RequestMiddlewareData = await handleFeatureBranchRequest(request, env);
  const featureConfig: FeatureBranchSettings = middlewareData.config as FeatureBranchSettings;
  // if response has been set, return it immediately
  if (middlewareData.response != null) {
    return middlewareData.response;
  }
  // update the worker request with that returned from the feature branch handler
  request = middlewareData.request;

  // handle recursion in local environment - see notes in function as to the need for this method at all
  const recursionData: RequestMiddlewareData = await handleLocalRecursion(request, testMode);
  if (recursionData.response != null) {
    return recursionData.response;
  }
  request = recursionData.request;

  // Retrieve the required middlewares suitable for the request
  const mids = ConstructResponseMiddlewares(env);
  const reqMids = ConstructRequestMiddlewares(env);
  const reqUrl: URL = new URL(request.url);

  // get request middleware routes
  let requestMiddleware: RequestMiddlewareRegistration[];
  if (env.CHOOSI_HOSTNAME === reqUrl.host) {
    requestMiddleware = getChoosiRequestMiddleware(reqMids, env);
  } else if (env.ISELECT_HOSTNAME === reqUrl.host) {
    requestMiddleware = getiSelectRequestMiddleware(reqMids, env);
  } else {
    requestMiddleware = getCtmRequestMiddleware(reqMids, reqUrl, env);
  }

  // get response middleware routes
  let responseMiddleware: ResponseMiddlewareRegistration[];
  const subdomain: SubdomainInfo = getCTMSubdomain(reqUrl.hostname);

  if (env.CHOOSI_HOSTNAME === reqUrl.host) {
    responseMiddleware = getChoosiResponseMiddleware(mids, env);
  } else if (env.ISELECT_HOSTNAME === reqUrl.host) {
    responseMiddleware = getiSelectResponseMiddleware(mids, env);
  } else if (1 == subdomain.count && "business" === subdomain.lastSub) {
    responseMiddleware = getBusinessResponseMiddleware(mids, env);
  } else if (env.LIFE_HOSTNAME === reqUrl.host) {
    responseMiddleware = getLifeResponseMiddleware(mids, env);
  } else {
    responseMiddleware = getCtmResponseMiddleware(mids, reqUrl, env);
  }

  // when running locally or for feature branches, fetch all resources from dev environment
  if (testMode || featureConfig.isFeatureSubdomain) {
    requestMiddleware = getLocalRequestMiddleware(requestMiddleware);
  }

  let middlewareReg: MiddlewareRegistrations = {
    requestMiddleware: requestMiddleware,
    responseMiddleware: responseMiddleware,
    preResponseMiddleware: preResponseProcessing
  };
  // verify whether the middleware registrations for feature branch need to be amended
  middlewareReg = validateFeatureBranchMiddleware(featureConfig, env, middlewareReg);

  const router: RouterType = setupRouter(middlewareReg.requestMiddleware, middlewareReg.responseMiddleware, middlewareReg.preResponseMiddleware);

  // Do routing
  const res: Response = await router.handle(request, mids, request);

  // handle feature branch response modification
  const newRes: Response = handleFeatureBranchResponse(featureConfig, env, res, request.method);

  const endTime: number = Date.now();
  console.log(`Cloudflare worker router execution time took ${endTime - startTime} milliseconds. Returning response with status code: ${newRes.status}`);

  return newRes;
}

//es-modules worker export
// @ts-ignore
const worker: ExportedHandler<Environment> = { fetch: handleRequest };

export default worker;
