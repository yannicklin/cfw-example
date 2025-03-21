import { MiddlewareData } from "ctm-cf-worker-router-core";
import { getCookie } from "../utils.js";

// the default max age to set on cookies - 400 days
const defaultMaxAge = "34560000";

export function makeSetCookieHeader(cookieName: string, cookieValue: string, httpOnly: boolean, isTest: boolean,
                                    maxAge: string = "", expires: string = "", domain: string = ""): string {
  let postfix = "";
  if (httpOnly) postfix += "; HttpOnly";
  // it appears env vars set via wrangler are created as string
  const localTesting: string = isTest?.toString().toLowerCase();
  if (localTesting === "true") {
    postfix += "; Domain=localhost;";
  } else {
    postfix += domain === "" ? "; Domain=comparethemarket.com.au;" : "; Domain=" + domain + ";";
  }
  let cookie = cookieName + "=" + cookieValue + "; path=/; Secure; SameSite=Strict";
  if (maxAge !== "") {
    cookie = cookie + "; Max-Age=" + maxAge;
  }
  if (expires !== "") {
    cookie = cookie + "; expires=" + expires;
  }
  return cookie + postfix;
}

/**
 * Cookies are created with the date created (in milliseconds) concatenated to the end of the cookie value
 * The two segments are separated with separatorText ie '.'
 * This method retrieves the cookie value excluding the trailing Date created
 * @param input the cookie value
 * @param separatorText the text used to separate the cookie value and date created
 */
function getCookieValueExclDateCreated(input: string, separatorText: string): string {
  let cookieVal;
  if (!input.includes(separatorText)) {
    cookieVal = input;
  } else {
    cookieVal = input.split(separatorText)[0];
  }
  return cookieVal;
}

/**
 * Modifies the response to save a specific cookie again as a server sent cookie with secure and httpOnly set
 * If the original cookie is ever missing the server sent cookie will be used to replace it.
 * This essentially backs up the cookie in case it ever gets cleared.
 * The backup cookie is saved for 400 days
 * @param data the MiddlewareData object
 * @param cookieName the name of the cookie to set
 * @param isTest is the env vat TESTING set to true
 * @param domain the domain on which the cookie should be created
 * @param alwaysSet should this cookie always be set
 * @returns
 */
export async function cookieJar(data: MiddlewareData, cookieName: string, isTest: boolean, domain: string, alwaysSet: boolean = false) {
  const separatorText = ".";
  // This is the period that must elapse before a cookie's max age is renewed
  // Currently set as 60 minutes described as milliseconds
  const renewalPeriod = 60 * 60 * 1000;
  let saved_cookie = getCookie(data.request.headers, cookieName + "_saved");
  let exposed_cookie = getCookie(data.request.headers, cookieName);
  let newRes = new Response(data.response.body, data.response);
  const savedMissing = saved_cookie == null;
  const needsUpdate = saved_cookie != exposed_cookie;

  // no cookies exist or saved cookie is missing, set both cookies
  if ((saved_cookie == null && exposed_cookie == null) || savedMissing || alwaysSet) {
    const cookieVal = crypto.randomUUID() + separatorText + Date.now();
    newRes.headers.append("Set-Cookie", makeSetCookieHeader(cookieName, cookieVal, false, isTest, defaultMaxAge, "", domain));
    newRes.headers.append("Set-Cookie", makeSetCookieHeader(cookieName + "_saved", cookieVal, true, isTest, defaultMaxAge, "", domain));
  }

  // both cookies exist and values match, then check if they need renewing
  else if (saved_cookie != null && exposed_cookie != null && saved_cookie == exposed_cookie) {
    let pieces = exposed_cookie.split(separatorText);
    if ((+pieces[1] + renewalPeriod) < Date.now()) {
      // time to renew cookies max age
      console.log("Renewing cookies expiry date");
      const cookieVal = pieces[0] + separatorText + Date.now();
      newRes.headers.append("Set-Cookie", makeSetCookieHeader(cookieName, cookieVal, false, isTest, defaultMaxAge, "", domain));
      newRes.headers.append("Set-Cookie", makeSetCookieHeader(cookieName + "_saved", cookieVal, true, isTest, defaultMaxAge, "", domain));
    } else {
      return data.response;
    }
  }

  // saved_cookie exists but exposed_cookie needs updating
  else if (saved_cookie != null && needsUpdate) {
    const cookieVal = getCookieValueExclDateCreated(saved_cookie, separatorText) + separatorText + Date.now();
    newRes.headers.append("Set-Cookie", makeSetCookieHeader(cookieName, cookieVal, false, isTest, defaultMaxAge, "", domain));
    newRes.headers.append("Set-Cookie", makeSetCookieHeader(cookieName + "_saved", cookieVal, true, isTest, defaultMaxAge, "", domain));
  }

  return newRes;
}
