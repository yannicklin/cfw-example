import { Environment } from "../index";
import { RequestMiddlewareRegistration, ResponseMiddlewareRegistration } from "../lib/router/middlewareRegistration";
import { Config } from "../config";
import { InjectLocation } from "ctm-cf-worker-router-core";
import { getStageCFPagePrefix } from "../utils";

export function getiSelectRequestMiddleware(mids: any, env: Environment): RequestMiddlewareRegistration[] {
  const stgCfPagePrefix: string = getStageCFPagePrefix(env);
  return [
    // branding service cf page
    [
      `${Config.cfPageRoutes.brandingBaseRoute}*`,
      [
        mids.EmbedCFAccessHeaders,
        mids.Router({
          destHost: stgCfPagePrefix + "ctm-cf-page-enterprise-branding.pages.dev",
          removeSubRoute: true,
          routePrefix: "/api/client/"
        })
      ]
    ],
    [
      `${Config.cfPageRoutes.maintenanceBaseRoute}*`,
      [
        mids.EmbedCFAccessHeaders,
        mids.Router({
          destHost: stgCfPagePrefix + "ctm-cf-page-devops-maintenance.pages.dev",
          removeSubRoute: true,
          routePrefix: "/temporary-outage/",
          staticPath: "iselect/iselect"
        })
      ]
    ],
    [
      `${Config.cfPageRoutes.staticAssetsRoute}*`,
      [
        mids.EmbedCFAccessHeaders,
        mids.Router({
          destHost: stgCfPagePrefix + "ctm-cf-page-enterprise-static-assets.pages.dev",
          removeSubRoute: true,
          routePrefix: Config.cfPageRoutes.staticAssetsRoute
        })
      ]
    ],

    ["/metrics*", [mids.RetrieveGtmContainer]],
    ["/chat*", [mids.RetrieveChatContainer]],

    // Handle Arkose Verify on Quote Result calls - as we are calling this endpoint from CF worker, we use the CTM hostname;
    // doing otherwise results in getting  blocked by CF
    ["/api/car-journey/journey/result", [mids.ArkoseVerify(env.CTM_HOSTNAME)]],
    ["/api/homecontents-journey/journey/result", [mids.ArkoseVerify(env.CTM_HOSTNAME)]],

    ["*", [mids.AddTrafficHeaders]]
  ];
}

export function getiSelectResponseMiddleware(mids: any, env: Environment): ResponseMiddlewareRegistration[] {
 return [
    // Remove extra cf auth for cloudflare pages routes
    [`${Config.cfPageRoutes.brandingBaseRoute}*`, [mids.RemoveExtraCFAuth]],
    [`${Config.cfPageRoutes.staticAssetsRoute}*`, [mids.RemoveExtraCFAuth]],
    [`${Config.cfPageRoutes.maintenanceBaseRoute}*`, [mids.RemoveExtraCFAuth]],

    // FIXME - these injection points need to be reconsidered since intro of anon prefill
    ["/car-insurance/journey/prefill_check*", [mids.ThreatAssessmentInjector(env.ISELECT_HOSTNAME)]],
    ["/home-contents-insurance/journey/prefill_check*", [mids.ThreatAssessmentInjector(env.ISELECT_HOSTNAME)]],

    ["/car-insurance/journey/*", [mids.InjectChatScript(InjectLocation.HeadEnd, Config.chatConfig.iselectContainers.car, env.ISELECT_HOSTNAME, env.ENV)]],

    ["*", [
      mids.WhiteLabelDomainScript,
      mids.CookieJar(Config.cookieNames.anonIdCookieName, env.ISELECT_HOSTNAME),
      mids.InjectCoreMartechScripts(InjectLocation.HeadEnd, Config.cookieNames.anonIdCookieName),
      mids.InjectGtmScript(InjectLocation.HeadEnd, Config.gtmConfig.iselctGtmKey, env.ISELECT_HOSTNAME)]]
  ];
}