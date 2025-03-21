import { ResponseMiddlewareRegistration } from "../lib/router/middlewareRegistration";
import { Config } from "../config";
import { InjectLocation } from "ctm-cf-worker-router-core";
import { Environment } from "../index";

export function getLifeResponseMiddleware(mids: any, env: Environment): ResponseMiddlewareRegistration[] {
  // we are managing our GA container for life whitelabel via the CF worker
  return [
    ["*", [
      mids.WhiteLabelDomainScript, mids.CookieJar(Config.cookieNames.anonIdCookieName, ""),
      mids.InjectCoreMartechScripts(InjectLocation.HeadStart, Config.cookieNames.anonIdCookieName),
      mids.InjectGtmScript(InjectLocation.HeadEnd, Config.gtmConfig.whiteLabelGtmKey, env.LIFE_HOSTNAME)]]
  ];
}