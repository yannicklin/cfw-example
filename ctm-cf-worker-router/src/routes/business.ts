import { ResponseMiddlewareRegistration } from "../lib/router/middlewareRegistration";
import { Environment } from "../index";
import { Config } from "../config";
import { InjectLocation } from "ctm-cf-worker-router-core";

export function getBusinessResponseMiddleware(mids: any, env: Environment): ResponseMiddlewareRegistration[] {
  // business whitelabel is injecting our GA container on our behalf, so no need for the worker to do this
  return [
    // we want our anon ID cookie set on the root domain in all environments, so empty string is passed to mids.CookieJar
    ["*", [
      mids.WhiteLabelDomainScript, mids.CookieJar(Config.cookieNames.anonIdCookieName, ""),
      mids.InjectCoreMartechScripts(InjectLocation.HeadEnd, Config.cookieNames.anonIdCookieName)]]
  ];
}