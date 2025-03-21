import { MiddlewareData, RequestMiddlewareData } from "ctm-cf-worker-router-core";

/** cookieBlockList is a map of cookies to be explicitly blocked */
const cookieBlockList: Map<string, boolean> = new Map([
  ["ca_deviceKey", true],
  ["ca_passKey", true],
  ["ca_refreshToken", true],
  ["ca_accessToken", true],
  ["ca_idToken", true],
  ["ca_authuser", true]
]);

/** cookieBlockPattern is a regular expression pattern for matching cookies to block */
const cookieBlockPattern = new RegExp("^(CognitoIdentity|amplify).*");

/** headerBlockList is a map of headers to be explicitly blocked */
const headerBlockList: Map<string, boolean> = new Map([
  ["x-amz-security-token", true],
  ["x-amz-date", true]
]);

/**
 * HeaderLimitBytes is the maximum total size in bytes permitted for
 * request headers
 */
export const HeaderLimitBytes = 10000;

/**
 * Removes unwanted cookies and headers from the request & blocks request where the header size exceeds 10000 bytes
 * @param data the RequestMiddlewareData
 */
export async function MonsterCookieRequestFix(data: RequestMiddlewareData): Promise<Request | Response> {
  const request: Request = new Request(data.request);
  filterHeaders(request);
  blockCookies(request);
  data.request = request;
  const headerSize: number = calculateHeaderSize(request);
  if (headerSize >= HeaderLimitBytes) {
    console.log("MonsterCookieRequestFix: Header size limit exceeded - returning 400");
    return new Response(`total combined header size (in bytes) '${headerSize}' exceeds limit '${HeaderLimitBytes}'\n`, {
      status: 400,
      statusText: "Bad Request"
    });
  }
  return data.request;
}

/**
 * Deletes unwanted cookies on the client
 * @param data the MiddlewareData
 */
export async function MonsterCookieResponseFix(data: MiddlewareData): Promise<Response> {
  const request: Request = data.originalRequest;
  const cookieString: null | string = request.headers.get("Cookie");
  const newRes: Response = new Response(data.response.body, data.response);
  if (cookieString == null) {
    console.log("No cookie header received - nothing to do on the response");
    return newRes;
  }

  const cookies: string[] = cookieString.split(";");
  cookies.forEach((cookie: string): void => {
    const cookiePair: string[] = cookie.split("=", 2);
    const cookieName: string = cookiePair[0].trim();
    const inBlockList: boolean = cookieBlockList.has(cookieName);
    const matchPattern: boolean = cookieBlockPattern.test(cookieName);
    if (inBlockList || matchPattern) {
      console.log("MonsterCookieResponseFix: disallowed cookie will be deleted from the client. name: " + cookieName);
      const newCookie: string = cookieName + "= ; Domain=xxx.xxx.xxx; Path=/; expires = Thu, 01 Jan 1970 00:00:00 GMT;";
      newRes.headers.append("Set-Cookie", newCookie);
    }
  });

  return newRes;
}

/**
 * Removes unwanted cookies from the request
 * @param request incoming Request
 */
export function blockCookies(request: Request): void {
  const cookieString = request.headers.get("Cookie");
  if (cookieString == null) {
    console.log("No cookie header received - nothing to do on the request");
    return;
  }
  const cookies = cookieString.split(";");
  const permitted: Array<string> = [];
  cookies.forEach((cookie) => {
    const cookiePair = cookie.split("=", 2);
    const cookieName = cookiePair[0].trim();
    const inBlockList = cookieBlockList.has(cookieName);
    const matchPattern = cookieBlockPattern.test(cookieName);
    if (!inBlockList && !matchPattern) {
      permitted.push(cookie);
    }
  });
  request.headers.set("Cookie", permitted.join(";"));
}

/**
 * filter headers removes headers with the specified name
 * @param request incoming request
 */
export function filterHeaders(request: Request) {
  for (var pair of request.headers.entries()) {
    const headerName: string = pair[0];
    const inBlockList: boolean = headerBlockList.has(headerName);

    if (inBlockList) {
      console.log("MonsterCookieRequestFix: header is in request block list and will be removed. name: " + headerName);
      request.headers.delete(headerName);
    }
  }
}

/**
 * Calculate the total Header size in bytes for the given request
 *
 * @param request incoming Request
 * @returns the total size in bytes of all headers
 */
export function calculateHeaderSize(request: Request): number {
  let size: number = 0;
  for (var pair of request.headers.entries()) {
    const h: string = `${pair[0]}: ${pair[1]}`;
    size += calculateSizeInBytes(h);
  }
  return size;
}

/**
 * Calculate the size in bytes of the provided string
 *
 * @param str the string for which the byte size should be calculated
 * @returns the size in bytes of the string
 */
function calculateSizeInBytes(str: string): number {
  return new TextEncoder().encode(str).length;
}