import { InjectIntoHtml, InjectLocation, MiddlewareData } from "ctm-cf-worker-router-core";
import { Config } from "../../config";

const GTM_KEY_PLACEHOLDER = "<<GTM_KEY_PLACEHOLDER>>";
const GTM_PROXY_URL_PLACEHOLDER = "<<GTM_PROXY_URL_PLACEHOLDER>>";
// cloudflare cache timeout in seconds
const CACHE_EXPIRY = 30;
// browser/cdn/proxy cache timeout in seconds
const BROWSER_CACHE_EXPIRY = 180;

const script = "<script data-cfasync=\"false\">(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':" +
  "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0]," +
  "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n" +
  "'" + GTM_PROXY_URL_PLACEHOLDER + "?id='+i+dl;f.parentNode.insertBefore(j,f);" +
  "})(window,document,'script','dataLayer','" + GTM_KEY_PLACEHOLDER + "');" +
  "</script>";

/**
 * Response middleware - Injects CTM's proxied GTM script into the response
 * @param data the internal MiddlewareData object
 * @param location the location in which to inject the GTM script in the html doc
 * @param gtmKey the GTM container ID to use in the GTM script
 * @param hostname the hostname of the GTM proxy url to use in the GTM script
 * @return the Response
 */
export async function InjectGtmScript(data: MiddlewareData, location: InjectLocation = InjectLocation.HeadEnd, gtmKey: string, hostname: string): Promise<Response> {
  const gtmProxyUrl: string = `https://${hostname}/${Config.gtmConfig.proxyPath}`;
  const injectableScript: string = script.replace(GTM_KEY_PLACEHOLDER, gtmKey)
    .replace(GTM_PROXY_URL_PLACEHOLDER, gtmProxyUrl);
  return InjectIntoHtml(data.response, injectableScript, location);
}

/**
 * Request middleware - Retrieves the content of gtm.js first from cache, if available, otherwise from GTM servers
 * Only requests for our custom gtm proxy url are processed by this middleware
 * @param request the worker request object
 * @return the gtm.js content response or the received request
 */
export async function RetrieveGtmContainer(request: Request): Promise<Request | Response> {
  console.debug("request.url is: ", request.url);
  if (request.method !== "GET") {
    console.debug("Not a GTM container request - skipping request middleware");
    return request;
  }
  const requestURL: URL = new URL(request.url);

  let gtmUrl: URL = new URL(Config.gtmConfig.defaultGtmUrl);
  // include all search params from the incoming request - this will contain the GTM_ID plus any others for GTM preview etc
  gtmUrl.search = requestURL.searchParams.toString();
  console.debug("requesting GTM container from: ", gtmUrl);

  // There are two methods available for caching in workers - refer https://developers.cloudflare.com/workers/reference/how-the-cache-works/
  // We are leveraging cloudflare edge caching via the fetch api here (https://developers.cloudflare.com/workers/examples/cache-using-fetch/), which means the response is cached across cloudflare's global network - this is suggested method by Cloudflare
  // The alternative method, using workers cache api (https://developers.cloudflare.com/workers/examples/cache-api) only caches the response in the data centre where the worker is located
  // @ts-ignore
  let response: Response = await fetch(gtmUrl, {
      cf: {
        // Always cache this fetch for a max of 30 seconds before revalidating the resource
        cacheTtl: CACHE_EXPIRY,
        cacheEverything: true,
        cacheKey: gtmUrl.toString()
      }
    }
  );

  response = new Response(response.body, response);
  // Set cache control headers to cache on browser and shared-caches (eg proxy and CDNs)
  response.headers.set("Cache-Control", `max-age=${BROWSER_CACHE_EXPIRY}`);
  return response;
}