import { InjectIntoHtml, InjectLocation, MiddlewareData } from "ctm-cf-worker-router-core";
import { ChatContainerIds, Config } from "../../config";

const CHAT_ID_PLACEHOLDER = "<<CHAT_ID_PLACEHOLDER>>";
const CHAT_PROXY_URL_PLACEHOLDER = "<<CHAT_PROXY_URL_PLACEHOLDER>>";
// cloudflare cache timeout in seconds
const CACHE_EXPIRY = 300;
// browser/cdn/proxy cache timeout in seconds
const BROWSER_CACHE_EXPIRY = 300;

const chatScript = "<script data-cfasync=\"false\" type=\"text/javascript\" charset=\"utf-8\">\n" +
  "  (function (g, e, n, es, ys) {\n" +
  "    g['_genesysJs'] = e;\n" +
  "    g[e] = g[e] || function () {\n" +
  "      (g[e].q = g[e].q || []).push(arguments)\n" +
  "    };\n" +
  "    g[e].t = 1 * new Date();\n" +
  "    g[e].c = es;\n" +
  "    ys = document.createElement('script'); ys.async = 1; ys.src = n; ys.charset = 'utf-8'; document.head.appendChild(ys);\n" +
  "  })(window, 'Genesys', '" + CHAT_PROXY_URL_PLACEHOLDER + "', {\n" +
  "    environment: 'apse2',\n" +
  "    deploymentId: '" + CHAT_ID_PLACEHOLDER + "'\n" +
  "  });\n" +
  "</script>";

function getChatContainerId(env: string, chatKeys: ChatContainerIds): string {
  if (env === "prod") {
    return chatKeys.prod;
  }
  return chatKeys.nonProd;
}

/**
 * Response middleware - Injects CTM's proxied chat script into the response
 * @param data the internal MiddlewareData object
 * @param location the location in which to inject the chat script in the html doc
 * @param chatKeys the ChatContainerIds that contain the chat container IDs for all environments
 * @param hostname the hostname of the the chat proxy url to use in the chat script - this is the url clients will request the chat script from
 * @param env the worker environment - dev, uat or prod
 * @return the Response
 */
export async function InjectChatScript(data: MiddlewareData, location: InjectLocation = InjectLocation.HeadEnd, chatKeys: ChatContainerIds, hostname: string, env: string): Promise<Response> {
  const containerId: string = getChatContainerId(env, chatKeys);
  const chatProxyUrl: string = `https://${hostname}/${Config.chatConfig.proxyPath}`;
  const injectableScript: string = chatScript.replace(CHAT_ID_PLACEHOLDER, containerId)
    .replace(CHAT_PROXY_URL_PLACEHOLDER, chatProxyUrl);
  return InjectIntoHtml(data.response, injectableScript, location);
}

/**
 * Request middleware - Retrieves the Genesys chat script first from cache, if available, otherwise from Genesys servers
 * Only requests for our custom chat proxy url are processed by this middleware
 * @param request the worker request object
 * @return the chat script response or the received request
 */
export async function RetrieveChatContainer(request: Request): Promise<Request | Response> {
  console.debug("request.url is: ", request.url);
  if (request.method !== "GET") {
    console.debug("Not a chat container request - skipping request middleware");
    return request;
  }
  const requestURL: URL = new URL(request.url);

  let chatUrl: URL = new URL(Config.chatConfig.genesysChatUrl);
  // include all search params from the incoming request
  chatUrl.search = requestURL.searchParams.toString();
  console.debug("requesting chat container from: ", chatUrl);

  // There are two methods available for caching in workers - refer https://developers.cloudflare.com/workers/reference/how-the-cache-works/
  // We are leveraging cloudflare edge caching via the fetch api here (https://developers.cloudflare.com/workers/examples/cache-using-fetch/), which means the response is cached across cloudflare's global network - this is suggested method by Cloudflare
  // The alternative method, using workers cache api (https://developers.cloudflare.com/workers/examples/cache-api) only caches the response in the data centre where the worker is located
  // @ts-ignore
  let response: Response = await fetch(chatUrl, {
      cf: {
        // Always cache this fetch for a max of 30 seconds before revalidating the resource
        cacheTtl: CACHE_EXPIRY,
        cacheEverything: true,
        cacheKey: chatUrl.toString()
      }
    }
  );

  response = new Response(response.body, response);
  // Set cache control headers to cache on browser and shared-caches (eg proxy and CDNs)
  response.headers.set("Cache-Control", `max-age=${BROWSER_CACHE_EXPIRY}`);
  return response;
}