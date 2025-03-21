/**
 * Adds the determined traffic type header to the request
 * Traffic type is typically based on Cloudflare's Connecting IP header, query params and header values,
 * distinguishing between internal, external and call centre traffic
 * @param incoming The incoming request
 * @returns the updated request, with traffic type header
 */
import { getCookie } from "../utils";
import { callCentreCookieName } from "./simplesCookie";
import IPCIDR from "ip-cidr";

// The defined traffic types
export enum TrafficType {
  CALL_CENTRE = "INTERNAL_CALL_CENTRE",
  INTERNAL = "INTERNAL",
  AUTOMATED_TEST = "SYNTHETICS",
  EXTERNAL = "EXTERNAL",
}

// The traffic type header key to add
export const trafficHeaderKey: string = "x-ctm-traffic-type";

// the path fragments identifying the health call centre logged in url
export const simplesLoggedInFragment = "ctm/simples/home.jsp";
// the path fragment identifying the health call centre logout page
export const simplesLogoutFragment = "ctm/security/simples_logout.jsp";

// the multi-pass/ automated test url param key
const automatedTestUrlParam = "automated-test";

// refer here for CTM CIDR ranges - https://ctmaus.atlassian.net/wiki/spaces/DO/pages/113541121/CTM+Environment+Public+IP+Address+Ranges
const syntheticCidrRanges: IPCIDR[] = [
  // the unicorn egress CIDR ranges that the selenium cluster executes multi-pass tests from
  new IPCIDR("13.236.81.73/32"),
  new IPCIDR("52.62.150.168/32"),
  new IPCIDR("13.54.163.135/32"),
  new IPCIDR("2406:da2c:c:100::/56"),
  // new relic CIDR ranges for synthetic monitors
  new IPCIDR("3.26.252.0/24"),
  new IPCIDR("3.26.245.128/25"),
  new IPCIDR("3.27.51.0/25"),
  // the legacy selenium CIDR ranges that may execute legacy multi-pass tests
  new IPCIDR("13.54.55.150/32"),
  new IPCIDR("13.54.250.208/32"),
  // Saucelabs CIDR ranges - refer to prod CF WAF Rule: AWS DEV Bypass - Saucelabs POC
  new IPCIDR("13.55.11.204/32"),
  new IPCIDR("13.54.42.28/32"),
  new IPCIDR("13.54.148.101/32")
];

// the new relic synthetic monitor request header
export const newRelicSyntheticHeaderName = "x-abuse-Info";
// the new relic synthetic monitor request header value fragment
const newRelicSyntheticHeaderValue = "Request sent by a synthetic monitor";

// the cloudflare connecting IPv4 header name - note this is the same as true-client-ip (https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#true-client-ip-enterprise-plan-only)
export const connectingIpv4HeaderName = "cf-connecting-ip";
// the cloudflare connecting IPv6 header name
export const connectingIpv6HeaderName = "cf-connecting-ipv6";

// the CTM office and VPN CIDR ranges
const officeCidrRanges = [
  new IPCIDR("202.56.60.0/23"),
  new IPCIDR("202.56.61.2/32")
];

// the iSelect office CIDR ranges
const iSelectCidrRanges = [
  new IPCIDR("104.30.134.155/32"),
  new IPCIDR("104.30.133.228/32")
];

export async function AddTrafficHeaders(incoming: Request): Promise<Request> {
  const updatedRequest: Request = new Request(incoming);
  const trafficType: TrafficType = getTrafficType(incoming);
  updatedRequest.headers.set(trafficHeaderKey, trafficType);
  console.log("Traffic type is: ", trafficType);
  return updatedRequest;
}

// Determines the traffic type based on the incoming request
function getTrafficType(request: Request): TrafficType {
  if (isAutomatedTest(request)) {
    return TrafficType.AUTOMATED_TEST;
  }
  if (isHealthCallCentre(request)) {
    return TrafficType.CALL_CENTRE;
  }
  if (isInternalUser(request)) {
    return TrafficType.INTERNAL;
  }
  return TrafficType.EXTERNAL;
}

function isAutomatedTest(request: Request): boolean {
  const url: URL = new URL(request.url);

  // test for multi-pass tests using query param
  if (url.searchParams.has(automatedTestUrlParam) && url.searchParams.get(automatedTestUrlParam) === "true") {
    return true;
  }

  // test for New Relic synthetic monitors using new relic synthetic header - refer https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/administration/identify-synthetic-monitoring-requests-your-app/
  if (request.headers.has(newRelicSyntheticHeaderName)) {
    const value: string | null = request.headers.get(newRelicSyntheticHeaderName);
    if (value?.includes(newRelicSyntheticHeaderValue)) {
      return true;
    }
  }

  // lastly test selenium and new relic CIDR ranges
  const ip: string | null = request.headers.get(connectingIpv4HeaderName) ?? request.headers.get(connectingIpv6HeaderName);
  if (ip !== null) {
    return isInCidrRange(ip, syntheticCidrRanges);
  }

  return false;
}

function isHealthCallCentre(request: Request): boolean {
  // test for presence of Simples cookie
  // this cookie is only set once a user logs in
  const isSimplesUser: string | null = getCookie(request.headers, callCentreCookieName);
  return isSimplesUser === "true";
}

function isInternalUser(request: Request): boolean {
  if (request.headers.has(connectingIpv4HeaderName)) {
    const ip: string | null = request.headers.get(connectingIpv4HeaderName);
    if (ip !== null) {
      return isInCidrRange(ip, officeCidrRanges) ||
        isInCidrRange(ip, iSelectCidrRanges);
    }
  }
  return false;
}

function isInCidrRange(ip: string, ranges: IPCIDR[]): boolean {
  if (ip === null) return false;
  const ipAddress: IPCIDR.Address = IPCIDR.createAddress(ip);
  for (const range of ranges) {
    if (range.contains(ipAddress)) {
      return true;
    }
  }
  return false;
}