// A function to retrieve the cookie value from the cookie request header
import { Environment } from "./index";

export function getCookie(headers: Headers, cookieName: string): string | null {
  let cookies = headers.get("Cookie");
  if (cookies) {
    let cookie = cookies.match(new RegExp(cookieName + "=([^;]*)"));
    return cookie ? cookie[1] : null;
  }
  return null;
}

// A function to retrieve a cookie value from the set-cookie response header
export function getSetCookieValue(responseHeaders: Headers, cookieName: string): string | null {
  const setCookieHeaders = responseHeaders.getAll("Set-Cookie");
  for (const setCookieHeader of setCookieHeaders) {
    const cookies = setCookieHeader.split("; ");
    for (const cookie of cookies) {
      if (cookie.startsWith(`${cookieName}=`)) {
        return cookie.split("=")[1];
      }
    }
  }
  return null;
}

export function appendToCookies(headers: Headers, cookieName: string) {
  let cookies = headers.get("Set-Cookie");

  if (cookies) {
    // Split the cookie header to get an array of "cookie=value" parts
    let cookiesArray = cookies.split("; ");

    // Filter out the cookie you want to change
    cookiesArray = cookiesArray.filter((cookie) => !cookie.startsWith(cookieName + "="));

    cookiesArray.push();

    // Join the remaining cookies back into a single string
    cookies = cookiesArray.join("; ");

    // Delete the old Cookie header and add the new one without the deleted cookie
    headers.delete("Set-Cookie");
    headers.append("Set-Cookie", cookies);
  }
  return headers;
}

/*
  Utility function to log headers to console
 */
export function logHeaders(headers: Headers): void {
  headers.forEach((value, key) => {
    console.log(`${key} ==> ${value}`);
  });
}

export interface SubdomainInfo {
  count: number;
  lastSub: string;
  raw: string[];
}

/*
  Utility functions to get Subdomain(s) of CTM (comparethemarket.com.au)
 */
export function getCTMSubdomain(hostname: string): SubdomainInfo {

  let subdomainInfo: SubdomainInfo = { "count": 0, "lastSub": "", "raw": [] };

  if ("comparethemarket.com.au" !== hostname) {
    let subdomains: string[] = hostname.replace(".comparethemarket.com.au", "").split(".");
    subdomainInfo = { "count": subdomains.length, "lastSub": subdomains[0], "raw": subdomains };
  }

  return subdomainInfo;
}

// Cloudflare pages environment prefixes
export function getDefaultCFPagePrefix(env: Environment): string {
  return env.CF_PAGE_PREFIX;
}

export function getPetCFPagePrefix(env: Environment): string {
  return env.CF_PAGE_PREFIX === "uat." ? "merge." : env.CF_PAGE_PREFIX;
}

export function getStageCFPagePrefix(env: Environment): string {
  return env.CF_PAGE_PREFIX === "uat." ? "stg." : env.CF_PAGE_PREFIX;
}