// CF page route constants
type CfPageRouteConfig = {
  petBaseRoute: string
  legalBaseRoute: string
  brandingBaseRoute: string
  cABaseRoute: string,
  cAAuth0BaseRoute: string,
  staticAssetsRoute: string,
  maintenanceBaseRoute: string
}

// Cookie name constants
type CookieNameConfig = {
  anonIdCookieName: string
}

// feature branch constants
type FeatureBranchConfig = {
  featureBranchTag: string,
  featureBranchTagPattern: RegExp,
  featureCookieName: string,
  securedEverestRoutes: string[]
  everestHandoverRoutes: string[]
  everestJourneyCreateRoutes: string[]
}

// GTM constants
type GtmConfig = {
  whiteLabelGtmKey: string
  ctmJourneyGtmKey: string
  iselctGtmKey: string
  choosiGtmKey: string
  ctmGtmUrl: string
  defaultGtmUrl: string
  proxyPath: string
}

// Genesys Chat constants
export type ChatConfig = {
  genesysChatUrl: string
  proxyPath: string
  ctmContainers: CtmChatContainer
  iselectContainers: IselectChatContainer
}

export type CtmChatContainer = {
  car: ChatContainerIds
}

export type IselectChatContainer = {
  car: ChatContainerIds
}

export type ChatContainerIds = {
  prod: string
  nonProd: string
}

export type ArkoseConfig = {
  encryptApiEndpoint: string
  verifyApiEndpoint: string
}

/**
 * Global config object containing configuration that doesn't change between environments
 * */
export type Config = {
  cfPageRoutes: CfPageRouteConfig
  cookieNames: CookieNameConfig
  featureBranchConfig: FeatureBranchConfig
  gtmConfig: GtmConfig
  chatConfig: ChatConfig
  arkoseConfig: ArkoseConfig
}

/**
 * Exported global Config constant
 */
export const Config: Config = {

  cfPageRoutes: {
    petBaseRoute: "/pet/compare/",
    legalBaseRoute: "/legal/",
    brandingBaseRoute: "/api/client/*/brands/",
    cABaseRoute: "/account/",
    cAAuth0BaseRoute: "/profile/",
    staticAssetsRoute: "/static/assets/",
    maintenanceBaseRoute: "/temporary-outage/"
  },

  cookieNames: {
    anonIdCookieName: "user_anonymous_id"
  },

  featureBranchConfig: {
    featureBranchTag: "cf-feat-",
    featureBranchTagPattern: /cf-feat-\d+\b/,
    featureCookieName: "cf-feature-tag",
    securedEverestRoutes: ["/api/car-journey/", "/api/homecontents-journey/"],
    everestHandoverRoutes: ["/api/car-journey/journey/load", "/api/homecontents-journey/journey/load"],
    everestJourneyCreateRoutes: ["/api/car-journey/journey/new/ctm", "/api/homecontents-journey/journey/new/ctm"]
  },

  gtmConfig: {
    // CTMs GA 4 container for white labels ie life and business
    whiteLabelGtmKey: "GTM-PZJR3D3",
    // CTMs GA 4 container for vertical journeys ie all verticals excluding banking and Wordpress
    ctmJourneyGtmKey: "GTM-PW6ZGHG",
    // iSelects journey GTM container ID
    iselctGtmKey: "GTM-KDTNBVB4",
    // Choosi's journey GTM container ID
    choosiGtmKey: "GTM-TTFV6KJ",
    // the url to retrieve gtm.js from - this is no longer used for CTM, rather opting for the default gtm url
    ctmGtmUrl: "https://ssgtm.xxx.xxx.xxx/gtm.js",
    // the default url to retrieve gtm.js from - used when server side gtm is not in place
    defaultGtmUrl: "https://www.googletagmanager.com/gtm.js",
    // the proxy path the worker listens on, for requests to retrieve the GTM container
    proxyPath: "metrics"
  },

  chatConfig: {
    genesysChatUrl: "https://apps.mypurecloud.com.au/genesys-bootstrap/genesys.min.js",
    proxyPath: "chat",
    ctmContainers: {
      car: {
        prod: "95c2732b-2892-4b13-9e66-f310ec93c28f",
        nonProd: "1206c75c-1f48-4983-a538-2c7541e1800e"
      }
    },
    iselectContainers: {
      car: {
        prod: "4ab464e5-10c0-432f-b683-e8e102cd1538",
        nonProd: "1c27c005-4a94-434f-b535-995933560e50"
      }
    }
  },
  arkoseConfig: {
    encryptApiEndpoint: "api/verify/encrypt/v1",
    verifyApiEndpoint: "api/verify/threat/v1"
  }
};