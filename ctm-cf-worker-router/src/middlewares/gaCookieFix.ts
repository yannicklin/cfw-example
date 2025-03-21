import { MiddlewareData } from "ctm-cf-worker-router-core";
import { getCookie } from "../utils";

/**
 * This middleware deletes long _ga cookies on the client by setting their value to empty and an expiry date in the past.
 * This was done as part of https://ctmaus.atlassian.net/browse/DO-2509
 * @param data the MiddlewareData object
 */
export async function DeleteLongGaCookie(data: MiddlewareData) : Promise< Response > {
    // regex is configured to search for cookies with _ga at the start of the name to exclude other ga cookies eg anon_ga
    let ga_cookie : string | null = getCookie(data.request.headers, "\\b_ga");
    // this gets the length of the last 2 segments (separated by .) of the GA cookie
    const segmentLength : number = ga_cookie ? ga_cookie.split('.').slice(-2).join(".").length : 0;
    let newRes : Response = new Response(data.response.body, data.response);

    if(segmentLength > 21) {
        console.log("deleting ga cookie");
        //Set cookie to empty
        const newCookie = "_ga= ; Domain=xxx.xxx.xxx; Path=/; expires = Thu, 01 Jan 1970 00:00:00 GMT";
        newRes.headers.append("Set-Cookie", newCookie);
    }
    return newRes;
}