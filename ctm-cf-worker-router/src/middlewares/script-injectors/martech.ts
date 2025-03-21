import { InjectLocation, injectScripts, MiddlewareData } from "ctm-cf-worker-router-core";
import { martechScripts as ms } from "./scripts/martech/martech.js";
import { getCookie, getSetCookieValue } from "../../utils";
import { setAnonIdScript } from "./scripts/martech/user";

const xhrPOST = `
function xhrPOST(url, payload) {
    const xhr = new XMLHttpRequest;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (4 === xhr.readyState && 200 === xhr.status) {
            console.log(JSON.parse(xhr.responseText));
        }
    };
    let r = JSON.stringify(payload);
    xhr.send(r);
}
`;

const arrayCleaner = `
function arrayCleaner(dataModel) {
    try {
        let cleanedDataModel = {};
        for (let variable in dataModel) {
            if (dataModel[variable] !== undefined && !dataModel[variable].match(/undefined/g)) {
                cleanedDataModel[variable] = dataModel[variable];
            }
        }
        return cleanedDataModel;
    } catch (e) {
        console.error("Error cleaning array: " + e);
    }
}
`;

const scripts = [
  xhrPOST,
  arrayCleaner,
  ms.generateGuid,
  ms.setCookieVal,
  ms.getDomain,
  ms.setUserId,
  ms.setSessionId,
  ms.setReferrer,
  ms.setQueryParamsAsKvs,
  ms.setDeviceCat,
  ms.setAllReportingChannels,
  ms.setAdvClickId,
  ms.coreMartechFunctions
];

/**
 * Updates the setAnonId script with the anonId value from the request or response cookie headers
 * and appends it to the list of Martech scripts at the required position.
 * This has been provided to overcome a race condition between setting anon ID cookies and reading them on the client.
 * @param data The middleware data object
 * @param anonIdCookieName the anonymousID cookie name
 */
function getMartechScripts(data: MiddlewareData, anonIdCookieName: string) {
  // first check for anon ID in request headers - this will be populated on all but the first request
  let serverAnonId: string | null = getCookie(data.request.headers, anonIdCookieName);
  // then check for anon ID in response headers - this will only be populated on the first request, or if the cookie created time is more than 1 hour old
  if (!serverAnonId) {
    serverAnonId = getSetCookieValue(data.response.headers, anonIdCookieName);
  }
  // NB create a copy of the scripts array, so as not to mutate the original list
  const result = scripts.slice();
  // add setAnonId script above setUserId in the scripts array
  result.splice(4, 0, setAnonIdScript(serverAnonId));
  return result;
}

/**
 * Injects the main collection of core martech scripts that they would like to run on all ctm pages
 * @param data the internal MiddlewareData object
 * @param location the location that the scripts should be injected on the page
 * @param anonIdCookieName the anonymousID cookie name
 * @return the response
 */
export async function InjectCoreMartechScripts(data: MiddlewareData, location: InjectLocation = InjectLocation.HeadEnd, anonIdCookieName: string): Promise<Response> {
  return injectScripts(data.response, getMartechScripts(data, anonIdCookieName), location);
}
