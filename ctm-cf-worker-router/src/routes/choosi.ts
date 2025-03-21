import { Environment } from "../index";
import { RequestMiddlewareRegistration, ResponseMiddlewareRegistration } from "../lib/router/middlewareRegistration";
import { Config } from "../config";
import { InjectLocation } from "ctm-cf-worker-router-core";
import { getStageCFPagePrefix } from "../utils";

export function getChoosiRequestMiddleware(mids: any, env: Environment): RequestMiddlewareRegistration[] {
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
          routePrefix: Config.cfPageRoutes.maintenanceBaseRoute,
          staticPath: "choosi/choosi"
        })
      ]
    ],

    ["/metrics*", [mids.RetrieveGtmContainer]],

    ["*", [mids.AddTrafficHeaders]]
  ];
}

export function getChoosiResponseMiddleware(mids: any, env: Environment): ResponseMiddlewareRegistration[] {
  // inject the Anon ID and core martech scripts on choosi domain
  return [
    // Remove extra cf auth for cloudflare pages routes
    [`${Config.cfPageRoutes.brandingBaseRoute}*`, [mids.RemoveExtraCFAuth]],
    [`${Config.cfPageRoutes.maintenanceBaseRoute}*`, [mids.RemoveExtraCFAuth]],

    ["*", [
      mids.ChoosiDomainScript, mids.CookieJar(Config.cookieNames.anonIdCookieName, env.CHOOSI_HOSTNAME),
      mids.InjectCoreMartechScripts(InjectLocation.HeadEnd, Config.cookieNames.anonIdCookieName),
      mids.InjectGtmScript(InjectLocation.HeadEnd, Config.gtmConfig.choosiGtmKey, env.CHOOSI_HOSTNAME)
    ]]
  ];
}