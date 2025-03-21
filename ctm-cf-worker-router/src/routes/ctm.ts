import { RequestMiddlewareRegistration, ResponseMiddlewareRegistration } from "../lib/router/middlewareRegistration";
import { Config } from "../config";
import { Environment } from "../index";
import { InjectLocation } from "ctm-cf-worker-router-core";
import { getWordpressRequestMiddleware, getWordpressResponseMiddleware } from "./wordpress";
import { getDefaultCFPagePrefix, getPetCFPagePrefix, getStageCFPagePrefix } from "../utils";

export function getCtmRequestMiddleware(reqMids: any, reqUrl: URL, env: Environment): RequestMiddlewareRegistration[] {
  // determine CF page prefixes
  const defaultCfPagePrefix: string = getDefaultCFPagePrefix(env);
  const petCfPagePrefix: string = getPetCFPagePrefix(env);
  const stgCfPagePrefix: string = getStageCFPagePrefix(env);

  let requestMiddleware: RequestMiddlewareRegistration[] = [
    // cloudflare page routes
    [
      `${Config.cfPageRoutes.cAAuth0BaseRoute}*`,
      [
        reqMids.EmbedCFAccessHeaders,
        reqMids.Router({
          destHost: defaultCfPagePrefix + "ctm-customer-accounts-auth0-ui.pages.dev",
          removeSubRoute: true,
          routePrefix: Config.cfPageRoutes.cAAuth0BaseRoute
        })
      ]
    ],
    [
      `${Config.cfPageRoutes.petBaseRoute}*`,
      [
        reqMids.EmbedCFAccessHeaders,
        reqMids.Router({
          destHost: petCfPagePrefix + "ctmpet.pages.dev",
          removeSubRoute: true,
          routePrefix: Config.cfPageRoutes.petBaseRoute
        })
      ]
    ],
    [
      `${Config.cfPageRoutes.legalBaseRoute}*`,
      [
        reqMids.EmbedCFAccessHeaders,
        reqMids.Router({
          destHost: stgCfPagePrefix + "ctm-cf-page-enterprise-legal.pages.dev",
          removeSubRoute: true,
          routePrefix: Config.cfPageRoutes.legalBaseRoute
        })
      ]
    ],
    [
      `${Config.cfPageRoutes.cABaseRoute}*`,
      [
        reqMids.EmbedCFAccessHeaders,
        reqMids.Router({
          destHost: defaultCfPagePrefix + "ctm-customer-accounts-react-ui.pages.dev",
          removeSubRoute: false,
          routePrefix: Config.cfPageRoutes.cABaseRoute
        })
      ]
    ],
    [
      `${Config.cfPageRoutes.brandingBaseRoute}*`,
      [
        reqMids.EmbedCFAccessHeaders,
        reqMids.Router({
          destHost: stgCfPagePrefix + "ctm-cf-page-enterprise-branding.pages.dev",
          removeSubRoute: true,
          routePrefix: "/api/client/"
        })
      ]
    ],
    [
      `${Config.cfPageRoutes.staticAssetsRoute}*`,
      [
        reqMids.EmbedCFAccessHeaders,
        reqMids.Router({
          destHost: stgCfPagePrefix + "ctm-cf-page-enterprise-static-assets.pages.dev",
          removeSubRoute: true,
          routePrefix: Config.cfPageRoutes.staticAssetsRoute
        })
      ]
    ],
    [
      `${Config.cfPageRoutes.maintenanceBaseRoute}*`,
      [
        reqMids.EmbedCFAccessHeaders,
        reqMids.Router({
          destHost: stgCfPagePrefix + "ctm-cf-page-devops-maintenance.pages.dev",
          removeSubRoute: true,
          routePrefix: Config.cfPageRoutes.maintenanceBaseRoute,
          staticPath: "ctm/ctm"
        })
      ]
    ],

    // cookie monster routes
    ["/api/address/*", [reqMids.MonsterCookieRequestFix]],
    ["/api/homecontents-journey/*", [reqMids.MonsterCookieRequestFix]],
    ["/api/car-journey/*", [reqMids.MonsterCookieRequestFix]],

    // Handle Arkose Verify on Quote Result calls.
    ["/api/car-journey/journey/result", [reqMids.ArkoseVerify(env.CTM_HOSTNAME)]],
    ["/api/homecontents-journey/journey/result", [reqMids.ArkoseVerify(env.CTM_HOSTNAME)]],
    ["/api/energy-journey/journey/result", [reqMids.ArkoseVerify(env.CTM_HOSTNAME)]],
    ["/api/travel-micro-ui/productsFetch", [reqMids.ArkoseVerify(env.CTM_HOSTNAME)]],
    ["/api/pet/quote/", [reqMids.ArkoseVerify(env.CTM_HOSTNAME)]],
    ["/ctm/ajax/json/health_quote_results_ws.jsp", [reqMids.ArkoseVerify(env.CTM_HOSTNAME)]],

    // all web-ctm tomcat routes
    ["/ctm/*", [reqMids.AddBrandCode]],
    ["/ctm-leads-genesys/*", [reqMids.AddBrandCode]],
    ["/emails/*", [reqMids.AddBrandCode]],
    ["/health-quote-v2/*", [reqMids.AddBrandCode]],
    ["/reward/*", [reqMids.AddBrandCode]],
    ["/static/*", [reqMids.AddBrandCode]],

    // home-loans simple calculator redirect
    ["/Tools/B3/*", [reqMids.HLCalculatorRedirect]],
    ["/AbacusServer/*", [reqMids.HLCalculatorRedirect]],

    ["/metrics*", [reqMids.RetrieveGtmContainer]],
    ["/chat*", [reqMids.RetrieveChatContainer]],

    // all routes
    ["*", [reqMids.AddTrafficHeaders, reqMids.UkRedirecter]]

    // ["/test/*", [reqMids.TestPage]]
  ];

  // add Wordpress middleware
  requestMiddleware = requestMiddleware.concat(getWordpressRequestMiddleware(reqMids, env.ENV, reqUrl));
  return requestMiddleware;
}

export function getCtmResponseMiddleware(mids: any, reqUrl: URL, env: Environment): ResponseMiddlewareRegistration[] {
  let responseMiddleware: ResponseMiddlewareRegistration[] = [
    // One of our middleware breaks the wordpress access page, so we disable all middleware on that page
    ["/sergei-access/*", [], true],
    ["/wp-admin/*", [], true],

    // cookie monster routes
    ["/api/address/*", [mids.MonsterCookieResponseFix]],
    ["/api/homecontents-journey/*", [mids.MonsterCookieResponseFix]],
    ["/api/car-journey/*", [mids.MonsterCookieResponseFix]],

    // cloudflare pages
    // baseTag rewriting for flutter based CF pages
    [`${Config.cfPageRoutes.cAAuth0BaseRoute}*`, [mids.BaseTagRewrite(Config.cfPageRoutes.cAAuth0BaseRoute), mids.RemoveExtraCFAuth]],
    [`${Config.cfPageRoutes.petBaseRoute}*`, [mids.BaseTagRewrite(Config.cfPageRoutes.petBaseRoute), mids.RemoveExtraCFAuth]],
    [`${Config.cfPageRoutes.legalBaseRoute}*`, [mids.RemoveExtraCFAuth]],

    // Remove extra cf auth for cloudflare pages routes
    [`${Config.cfPageRoutes.brandingBaseRoute}*`, [mids.RemoveExtraCFAuth]],
    [`${Config.cfPageRoutes.cABaseRoute}*`, [mids.RemoveExtraCFAuth]],
    [`${Config.cfPageRoutes.staticAssetsRoute}*`, [mids.RemoveExtraCFAuth]],
    [`${Config.cfPageRoutes.maintenanceBaseRoute}*`, [mids.RemoveExtraCFAuth]],

    // Inject Arkose scripts at journey start.
    // Listen on journey start for everest journeys as all other journey routes are redirected to prefill_check when loading URL directly.
    // FIXME - these injection points for car and h&c need to be reconsidered since intro of anon prefill
    ["/car-insurance/journey/prefill_check*", [mids.ThreatAssessmentInjector(env.CTM_HOSTNAME)]],
    ["/home-contents-insurance/journey/start*", [mids.ThreatAssessmentInjector(env.CTM_HOSTNAME)]],
    ["/home-contents-insurance/journey/prefill_check*", [mids.ThreatAssessmentInjector(env.CTM_HOSTNAME)]],
    ["/energy/compare*", [mids.ThreatAssessmentInjector(env.CTM_HOSTNAME)]],
    // Travel allows journey steps to be loaded directly but prompts to refresh page if not in a valid session.
    ["/travel/compare*", [mids.ThreatAssessmentInjector(env.CTM_HOSTNAME)]],
    // Pet allows all journey steps to be loaded through URL.
    ["/pet/compare*", [mids.ThreatAssessmentInjector(env.CTM_HOSTNAME)]],
    ["/ctm/health_quote*", [mids.ThreatAssessmentInjector(env.CTM_HOSTNAME)]],

    // Inject Optimizely, chat and GTM scripts to Car journey
    ["/car-insurance/journey*", [
      mids.InjectOptimizelyScripts,
      mids.InjectGtmScript(InjectLocation.HeadEnd, Config.gtmConfig.ctmJourneyGtmKey, env.CTM_HOSTNAME),
      mids.InjectChatScript(InjectLocation.HeadEnd, Config.chatConfig.ctmContainers.car, env.CTM_HOSTNAME, env.ENV)
    ]],

    // Inject Optimizely, and GTM scripts to Home Contents journey
    ["/home-contents-insurance/journey*", [
      mids.InjectOptimizelyScripts,
      mids.InjectGtmScript(InjectLocation.HeadEnd, Config.gtmConfig.ctmJourneyGtmKey, env.CTM_HOSTNAME),
    ]],

    // Inject Optimizely scripts to Health (non-simples) journey
    ["/ctm/health_quote_v4*", [mids.InjectOptimizelyScripts]],
    ["/ctm/health_confirmation_*", [mids.InjectOptimizelyScripts]],

    // Home loan calculator response header modification
    ["/AbacusServer/JS/AbacusJS/AbacusJS_B3*", [mids.HLCalculatorContentTypeFix]],

    // IMT GTM container
    ["/international-money-transfers/journey*", [mids.InjectGtmScript(InjectLocation.HeadEnd, Config.gtmConfig.ctmJourneyGtmKey, env.CTM_HOSTNAME)]],

    // simples routes - simples/home.jsp and simples_logout.jsp
    ["/ctm/simples/home*", [mids.SimplesCookieManager]],
    ["/ctm/security/simples_logout*", [mids.SimplesCookieManager]],

    // Inject GTM scripts on contingency/outage page
    [`${Config.cfPageRoutes.maintenanceBaseRoute}*`, [mids.InjectGtmScript(InjectLocation.HeadEnd, Config.gtmConfig.ctmJourneyGtmKey, env.CTM_HOSTNAME)]]
  ];

  // all routes - NB: the cookieJar middleware MUST run before InjectCoreMartechScripts as the cookies are read in these scripts
  // we want our anon ID cookie set on the root domain in all environments, so empty string is passed to mids.CookieJar
  const globalMiddleware: ResponseMiddlewareRegistration[] = [["*", [
    mids.CookieJar(Config.cookieNames.anonIdCookieName, ""),
    mids.InjectCoreMartechScripts(InjectLocation.HeadEnd, Config.cookieNames.anonIdCookieName),
    mids.BodyScript,
    mids.GaCookieFix,
    mids.UkRedirectInjector,
  ]]];

  // NB it is important that wordpress middleware, is added before globalMiddleware -
  // it has been observed that anonId set-cookie headers get mangled if wordpress middleware runs after globalMiddleware
  responseMiddleware = responseMiddleware.concat(getWordpressResponseMiddleware(mids, reqUrl));
  // NB: this middleware must be added to response middleware array last, as explained above
  responseMiddleware = responseMiddleware.concat(globalMiddleware);

  return responseMiddleware;
}