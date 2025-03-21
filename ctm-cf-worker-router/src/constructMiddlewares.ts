import { InjectLocation, injectScript, MiddlewareData } from "ctm-cf-worker-router-core";
import { MakeLocalMiddleware } from "./lib/middlewareLib.js";
import { MakeRequestMiddleware } from "./lib/requestMiddlewareLib.js";
import {
  CFAccessDetails,
  CFPageRouteSettings,
  removedCFAuthCookieSet,
  routePage,
  tryAddCFAccessHeaders,
  tryRewriteBaseTag
} from "./middlewares/cf-page-router.js";
import { cookieJar } from "./middlewares/cookieJar.js";
import { ArkoseVerify } from "./middlewares/arkoseVerify.js";
import { InjectCoreMartechScripts } from "./middlewares/script-injectors/martech.js";
import { InjectOptimizelyScripts } from "./middlewares/script-injectors/optimizely.js";
import { Environment } from "./index.js";
import testPage from "./local/page.html";
import { ReRouter } from "./middlewares/request-rerouter.js";
import { RedirectUrlFixer } from "./middlewares/redirectUrlFixer.js";
import { DeleteLongGaCookie } from "./middlewares/gaCookieFix";
import { AddBrandCode } from "./middlewares/brandCode";
import { threatAssessmentInjector } from "./middlewares/script-injectors/threatAssessInjector";
import { MonsterCookieRequestFix, MonsterCookieResponseFix } from "./middlewares/cookieMonster";
import { RouteHomeloanCalculator, UpdateContentTypeHeader } from "./middlewares/homeloanCalculator";
import { InjectGtmScript, RetrieveGtmContainer } from "./middlewares/script-injectors/gtm";
import { AddTrafficHeaders } from "./middlewares/trafficType";
import { SimplesCookieManager } from "./middlewares/simplesCookie";
import { InjectChatScript, RetrieveChatContainer } from "./middlewares/script-injectors/chat";
import { ChatContainerIds } from "./config";
import { InjectChallengeScriptsForUkTraffic, UkRedirecter } from "./middlewares/ukRedirecter";

/** Constructs the various middleware available to the router */
export function ConstructResponseMiddlewares(env: Environment) {
  return {
    // Make middleware that calls to another worker
    //ServiceExample: MakeServiceMiddleware("AnonIdScriptAdder", env.mw_svc_example)

    // Setup some local middleware
    BodyScript: MakeLocalMiddleware("bodyScriptAdder", async (x) =>
      injectScript(x.response, "console.log('CF worker router body script')")
    ),

    BaseTagRewrite: (baseRoute: string) =>
      MakeLocalMiddleware("baseTagRewrite", async (x) => {
        console.log("original url ", x.originalRequest.url);
        return tryRewriteBaseTag(x.response, new URL(x.originalRequest.url), baseRoute);
      }),
    CookieJar: (cookieName: string, domain: string) => MakeLocalMiddleware("cookieJar", async (x) => cookieJar(x, cookieName, env.TESTING, domain)),
    RemoveExtraCFAuth: MakeLocalMiddleware("removeCFAuthSet", async (x) => removedCFAuthCookieSet(x.response)),
    ThreatAssessmentInjector: (host: string) => MakeLocalMiddleware("threatAssessmentInjector", async (x: MiddlewareData): Promise<Response> =>
      threatAssessmentInjector(host, env.ARKOSE_JS_ENDPOINT, x, env.TRACKING_DATA_RETRY, env.ARKOSE_SESSION_TOKEN_EXPIRY_HRS)
    ),
    InjectCoreMartechScripts: (location: InjectLocation, anonIdCookieName: string) => MakeLocalMiddleware("injectCoreMartechScripts", async (data: MiddlewareData): Promise<Response> => InjectCoreMartechScripts(data, location, anonIdCookieName)),
    Logger: MakeLocalMiddleware("logger", async (x) => {
      console.log("queries", new URL(x.request.url).searchParams);
      return x.response;
    }),
    InjectOptimizelyScripts: MakeLocalMiddleware("injectOptimizelyScripts", InjectOptimizelyScripts),
    RedirectUrlFixer: MakeLocalMiddleware("redirectUrlFixer", RedirectUrlFixer),
    GaCookieFix: MakeLocalMiddleware("gaCookieFix", DeleteLongGaCookie),
    MonsterCookieResponseFix: MakeLocalMiddleware("monsterCookieResponseFix", MonsterCookieResponseFix),
    WhiteLabelDomainScript: MakeLocalMiddleware("whiteLabelDomainScript", async (x) =>
      injectScript(x.response, "console.log('CF worker subdomain script')")
    ),
    ChoosiDomainScript: MakeLocalMiddleware("choosiDomainScript", async (x) =>
      injectScript(x.response, "console.log('CF worker choosi script')")
    ),
    HLCalculatorContentTypeFix: MakeLocalMiddleware("hLCalculatorContentTypeFix", UpdateContentTypeHeader),
    InjectGtmScript: (location: InjectLocation, gtmKey: string, hostname: string) => MakeLocalMiddleware("injectGtmScript", async (data: MiddlewareData): Promise<Response> => InjectGtmScript(data, location, gtmKey, hostname)),
    InjectChatScript: (location: InjectLocation, chatKeys: ChatContainerIds, hostname: string, env: string) => MakeLocalMiddleware("injectChatScript", async (data: MiddlewareData): Promise<Response> => InjectChatScript(data, location, chatKeys, hostname, env)),
    SimplesCookieManager: MakeLocalMiddleware("simplesCookieManager", SimplesCookieManager),
    UkRedirectInjector: MakeLocalMiddleware("ukRedirectInjector", async (x) =>
      InjectChallengeScriptsForUkTraffic(x)
  ),
  };
}

export function ConstructRequestMiddlewares(env: Environment) {
  const cfAccessCreds: CFAccessDetails = {
    cfAccessClientId: env.CF_ACCESS_CLIENT_ID ?? "potato",
    cfAccessSecret: env.CF_ACCESS_AUTH_TOKEN ?? "potaoirenstoierants"
  };

  return {
    EmbedCFAccessHeaders: MakeRequestMiddleware("embedCFAccessHeaders", async (request) => {
      return tryAddCFAccessHeaders(request.middlewareData.request, cfAccessCreds);
    }),
    Router: (config: CFPageRouteSettings) =>
      MakeRequestMiddleware(`router for ${config.routePrefix}`, async (request) =>
        routePage(request.middlewareData.request, config)
      ),
    Rerouter: (prefix: string) => MakeRequestMiddleware("rerouter for ${prefix}", async (x) => ReRouter(prefix, x)),
    TestPage: MakeRequestMiddleware(
      "testPageInjector",
      async (x) => new Response(testPage, { headers: { "content-type": "text/html" } })
    ),
    AddBrandCode: MakeRequestMiddleware("addBrandCode", async (request) =>
      AddBrandCode(request.middlewareData.request)
    ),
    ArkoseVerify: (hostname: string) => MakeRequestMiddleware("arkoseVerify", async (request) =>
      ArkoseVerify(
        request.middlewareData.request,
        hostname,
        env.ARKOSE_VERIFY_TIMEOUT_SECS,
        cfAccessCreds
      )
    ),
    MonsterCookieRequestFix: MakeRequestMiddleware("monsterCookieRequestFix", async (request) =>
      MonsterCookieRequestFix(request.middlewareData)
    ),
    HLCalculatorRedirect: MakeRequestMiddleware("hLCalculatorRedirect", async (request) => RouteHomeloanCalculator(request)),
    AddTrafficHeaders: MakeRequestMiddleware("addTrafficHeaders", async (request) => AddTrafficHeaders(request.middlewareData.request)),
    RetrieveGtmContainer: MakeRequestMiddleware("retrieveGtmContainer", async (request) => RetrieveGtmContainer(request.middlewareData.request)),
    RetrieveChatContainer: MakeRequestMiddleware("retrieveChatContainer", async (request) => RetrieveChatContainer(request.middlewareData.request)),
    UkRedirecter: MakeRequestMiddleware("ukRedirecter", async (request) =>
      UkRedirecter(request.middlewareData.request)),
  };
}
