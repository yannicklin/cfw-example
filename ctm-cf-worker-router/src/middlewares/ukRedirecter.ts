import {InjectLocation, InjectIntoHtml, MiddlewareData} from "ctm-cf-worker-router-core";
import {getUKPopupModalHTML, noUKRedirectKey} from "./script-injectors/scripts/uk-redirect/redirect.js";
import {getCookie} from "../utils";

const ukLocationCodes: string[] = ["GB", "IE"];
const cfIpCountryHeader: string = "CF-IPCountry";
const ctmVerifiedGoodBotsHeader: string = "x-ctm-bot-verified";

// REQUEST MIDDLEWARE
/*
    This function checks for the presence and value of x-no-redirect cookie
 */
function mustNotRedirect(incoming: Request): boolean {
    // check cookie
    const cookeVal : string | null = getCookie(incoming.headers, noUKRedirectKey);
    return cookeVal === "true";
}

/*
    Sends requests, identified as UK traffic, to UK endpoint.
    This middleware must listen on root and capture all requests
 */
export async function UkRedirecter(incoming: Request): Promise<Request> {
    // route AU customers first
    const country_code : string | null = incoming.headers.get(cfIpCountryHeader);
    const verfied_bot : boolean = ("true" === incoming.headers.get(ctmVerifiedGoodBotsHeader));
    const ukClient : boolean = ukLocationCodes.includes(country_code ? country_code : "");

    // if not UK traffic - all good, forward on with no intervention
    if (!ukClient) {
        return incoming;
    }

    // if from good bots (Google, Bing, etc.)
    if (verfied_bot) {
        return incoming;
    }

    // if request has been flagged as not to be redirected, return original request
    if (mustNotRedirect(incoming)) {
        return incoming;
    }

    // if UK:
    // add x-no-redirect = false header and retrieve original request
    // response middleware below will inject user challenge scripts into the response, to be executed on the client
    const newReq: Request = new Request(incoming);
    newReq.headers.set(noUKRedirectKey, "false");
    return newReq;
}

// RESPONSE MIDDLEWARE
// only inject challenge scripts if x-no-redirect === false ie the above UkReDirecter request middleware
// has identified this request as potentially requiring redirection to UK
export async function InjectChallengeScriptsForUkTraffic(data: MiddlewareData): Promise<Response> {

    const UKPopupModalHTML: string = await getUKPopupModalHTML();

    if (data.request.headers.has(noUKRedirectKey) && data.request.headers.get(noUKRedirectKey) === 'false') {
        return InjectIntoHtml(data.response, UKPopupModalHTML, InjectLocation.BodyEnd);
    }
    return data.response;
}