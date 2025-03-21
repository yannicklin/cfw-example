import { InjectIntoHtml, InjectLocation, MiddlewareData, replaceVars } from "ctm-cf-worker-router-core";
import { arkoseScripts } from "./scripts/arkose";
import { Config } from "../../config";

const scriptWrapperStart = "<div style=\"display: none; visibility: hidden;\">\n <script data-cfasync=\"false\" type=\"text/javascript\" src=\"$ARKOSE_JS_ENDPOINT\" data-callback=\"setupArkoseDetect\" async defer></script>\n <script data-cfasync=\"false\">\n function $ARKOSE_SETUP_FUNC {";
const scriptWrapperEnd = "}\n </script>\n <div id=\"arkose-detect\" style=\"display: none\"/>\n</div>";

const RESULT_STR = "result";

/**
 * Injects Threat/Risk assessment code.
 * @param hostname the hostname of the the encrypt endpoint
 * @param arkoseJsEndpoint Arkose JS endpoint
 * @param data Middleware data to retrieve response from
 * @param trackingDataRetry Number of times to attempt retrieving data from dataLayer
 * @param arkoseSessionTokenExpiryHrs
 */
export function threatAssessmentInjector(
  hostname: string,
  arkoseJsEndpoint: string,
  data: MiddlewareData,
  trackingDataRetry: number,
  arkoseSessionTokenExpiryHrs: number
): Response {

  // Do not inject code on result request.
  if (data.originalRequest.url.includes(RESULT_STR)) {
    return data.response;
  }
  const encryptEndpoint: string = `https://${hostname}/${Config.arkoseConfig.encryptApiEndpoint}`;

  const updatedScript = replaceVars(
    scriptWrapperStart + arkoseScripts.setupArkoseDetect + scriptWrapperEnd,
    {
      RAY_ID: data.request.headers.get("cf-ray") ?? "",
      THREAT_ENCRYPT_ENDPOINT: encryptEndpoint,
      TRACKING_DATA_RETRY: trackingDataRetry,
      ARKOSE_SESSION_TOKEN_EXPIRY_HRS: arkoseSessionTokenExpiryHrs,
      ARKOSE_JS_ENDPOINT: arkoseJsEndpoint,
      ARKOSE_SETUP_FUNC: "setupArkoseDetect(arkoseDetect)",
      ARKOSE_DETECT_PROP: "arkoseDetect"
    }
  );

  return InjectIntoHtml(
    data.response,
    updatedScript,
    InjectLocation.BodyEnd
  );
}
