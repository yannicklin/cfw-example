import { createExecutionContext, env, waitOnExecutionContext, fetchMock } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import worker from "../src/index";
import { Config } from "../src/config";

// cloudflare/vitest-pool-workers will start a local server on a variable port - this testUrl has no bearing on the test endpoint
// used by vitest - any paths appended to this testUrl will, however, be passed in to the worker
const testUrl = "https://localhost:3000";

const setupArkoseDetectFunction = "function setupArkoseDetect(arkoseDetect)";

// @ts-ignore
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Worker", async () => {
  const ctx = createExecutionContext();

  beforeAll(async () => {
    env.CF_ACCESS_AUTH_TOKEN = process.env.CF_ACCESS_AUTH_TOKEN || "";
    env.CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
  });

  //
  // --- GENERAL --- //
  //
  // verify injected content
  it("should return expected injected content", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl);
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      const text = await resp.text();

      // global body script has been added
      expect(text).toContain("console.log('CF worker router body script')");
      verifyInjectedCoreScriptsExist(resp, text);
    }
  });

  // check GA cookie fix
  it("should return expected GA cookie", async () => {
    const init = { headers: { "Cookie": "_ga=111.111.1111222222222233333333334444444444444444444433" } };
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/blog/", init);
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      // GA cookie fix header has been injected
      // @ts-ignore
      expect(resp.headers.has("set-cookie")).toBeTruthy();
      let found = false;
      // @ts-ignore
      for (const pair of resp.headers.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
        let key = pair[0];
        if (pair[0] == "set-cookie") {
          if (pair[1].includes("_ga=")) {
            found = true;
            break;
          }
        }
      }
      expect(found).toBeTruthy();
    }
  });

  //
  // --- Feature Branches --- //
  //
  // check Request Handler - GET
  it("should return with 307 response for GET request", async () => {

    const init = { method: "GET", headers: { "Origin": "cf-feat-11.localhost" } };
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/blog/", init);
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(307);
    }
  });

  // check Request Handler - POST
  it("should return with 307 response for POST request", async () => {

    const init = { method: "POST", headers: { "Cookie": "cf-feature-tag=cf-feat-11" } };
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/blog/", init);
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(307);
    }
  });
  // Note:: No tests yet on Feature Branches about: isRedirectAllowed(), OPTIONS, and securedEverestRoutes

  //
  // --- CloudFlare Page for LEGAL, Brands --- //
  //
  // Cloudflare pages
  it("should return PET CF page", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/pet/compare");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      // assert protected CF page has been retrieved using CF Access creds from environment
      expect(resp.status).toBe(200);

      const text = await resp.text();

      // assert pet page content is present
      expect(text).toContain("content=\"Pet Insurance\"");

      // assert base tag has been re-written
      const regex = /<base\s+href="http[^"]+\/pet\/compare\/">/;
      expect(text).toMatch(regex);
    }
  });

  it("should return LEGAL CF page", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/legal/privacy-policy");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);

      const text = await resp.text();

      // assert legal page content is present
      expect(text).toContain("<title>Compare The Market | Privacy Policy</title>");
    }
  });

  it("should return CTM branding page", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/api/client/v1/brands/ctm");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);

      const text = await resp.text();

      // assert correct branding json is returned
      expect(text).toContain("\"footer_copyright_banner_brand_name\": \"Compare the Market\"");
    }
  });

  it("should return CHOO branding page", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/api/client/v1/brands/choo");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);

      const text = await resp.text();

      // assert correct branding json is returned
      expect(text).toContain("\"footer_copyright_banner_brand_name\": \"Choosi\"");
    }
  });

  it("should return ISLT branding page", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/api/client/v1/brands/islt");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);

      const text = await resp.text();

      // assert correct branding json is returned
      expect(text).toContain("\"footer_copyright_banner_brand_name\": \"iSelect\"");
    }
  });

  //
  // --- ARKOSE --- //
  //
  // check Arkose Detect code injection - Car
  it("should return injected Arkose code in Car Journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/car-insurance/journey/prefill_check");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text = await resp.text();
      expect(text).toContain(setupArkoseDetectFunction);
    }
  });

  // check Arkose Detect code injection - Home and Content
  it("should return injected Arkose code in Home and Content Journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/home-contents-insurance/journey/prefill_check");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text = await resp.text();
      expect(text).toContain(setupArkoseDetectFunction);
    }
  });

  // check Arkose Detect code injection - Energy
  it("should return injected Arkose code in Energy Journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/energy/compare");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text = await resp.text();
      expect(text).toContain(setupArkoseDetectFunction);
    }
  });

  // check Arkose Detect code injection - Travel
  it("should return injected Arkose code in Travel Journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/travel/compare");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text = await resp.text();
      expect(text).toContain(setupArkoseDetectFunction);
    }
  });

  // check Arkose Detect code injection - Pet
  it("should return injected Arkose code in Pet Journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/pet/compare");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text = await resp.text();
      expect(text).toContain(setupArkoseDetectFunction);
    }
  });

  // check Arkose Detect code injection - Health
  it("should return injected Arkose code in Health Journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/ctm/health_quote_v4.jsp");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text = await resp.text();
      expect(text).toContain(setupArkoseDetectFunction);
    }
  });

  //
  // --- VisionAbacus --- //
  //
  // verify VisionAbacus home-loan calculator iFrame is loaded
  it("should return home loan calculator", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/Tools/B3/SuiteA/A200/Borrowing_Power_Calculator/CompareTheMarket");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text = await resp.text();
      expect(text).toContain("<title>Borrowing Power Calculator</title>");
    }
  });

  // verify VisionAbacus JS file with invalid content-type has been fixed
  it("should also return home loan calculator", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/AbacusServer/JS/AbacusJS/AbacusJS_B3");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      // @ts-ignore
      expect(resp.headers.has("content-type")).toBeTruthy();
      let found = false;
      // @ts-ignore
      for (const pair of resp.headers.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
        let key = pair[0];
        if (pair[0] == "content-type") {
          if (pair[1] == "text/javascript") {
            found = true;
            break;
          }
        }
      }
      expect(found).toBeTruthy();
    }
  });

  //
  // --- GTM --- //
  //
  // verify CTM's GTM script for white labels is injected
  it("should return injected GTM script in Life journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest("https://life.comparethemarket.com.au");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();
      expect(text).toContain("https://www.googletagmanager.com/gtm.js");
      expect(text).toContain(Config.gtmConfig.whiteLabelGtmKey);
    }
  });

  // verify CTM's GTM script for journeys is injected
  it("should return injected GTM script in IMT journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/international-money-transfers/journey/results");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();
      expect(text).toContain("https://dev.comparethemarket.com.au/metrics");
      expect(text).toContain(Config.gtmConfig.ctmJourneyGtmKey);
    }
  });

  // verify GTM proxy url retrieves gtm.js
  it("should return gtm.js for proxied GTM url", async () => {
    // @ts-ignore
    const request = new IncomingRequest(testUrl + "/metrics?id=" + Config.gtmConfig.ctmJourneyGtmKey);
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();
      expect(text).toContain("window,'google_tag_manager'");
      expect(text).toContain(Config.gtmConfig.ctmJourneyGtmKey);
    }
  });

  //
  // --- WhiteLabelling --- //
  //
  // verify Choosi middleware is injected
  it("should return injected core scripts in Choosi path", async () => {
    // @ts-ignore
    const request = new IncomingRequest("https://dev.app.choosi.com.au/car-insurance/journey/start");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();

      expect(text).toContain("console.log('CF worker choosi script')");
      verifyInjectedCoreScriptsExist(resp, text);
    }
  });

  //
  // --- UK Reroute --- //
  //
  // verify UK visitors with popup modal
  it("should show up the popup modal for UK visitors", async () => {
    const init = { headers: { "CF-IPCountry": "IE", "X-NO-UK-Redirect": "false"} };
    const request = new IncomingRequest(testUrl + "/meerkat/", init);
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();

      expect(text).toContain('<h5 class="modal-title">Did you mean to visit our Australian site?</h5>');
      expect(text).toContain("ixn_object: 'UK redirect modal'");
      expect(text).toContain("ixn_type: 'Feature CTA'");
      expect(text).toContain("ixn_action: 'Impression'");
    }
  });

  // verify UK Google Bot, should be no popup modal jumping out!
  it("should to be no popup modal for UK Google Bots", async () => {
    const init = { headers: { "CF-IPCountry": "GB", "x-ctm-bot-verified": "true"} };
    const request = new IncomingRequest(testUrl + "/about-us/", init);
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();

      expect(text).not.toContain('<h5 class="modal-title">Did you mean to visit our Australian site?</h5>');
    }
  });

  // verify AU visitors, should be no popup modal jumping out!
  it("should be no popup modal for AU visitors", async () => {
    const init = { headers: { "CF-IPCountry": "AU" } };
    const request = new IncomingRequest(testUrl + "/media-centre/", init);
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();

      expect(text).not.toContain('<h5 class="modal-title">Did you mean to visit our Australian site?</h5>');
    }
  });

  // verify Global (excepct UK) visitors, should be no popup modal jumping out!
  it("should be no popup modal for USA visitors", async () => {
    const init = { headers: { "CF-IPCountry": "US" } };
    const request = new IncomingRequest(testUrl + "/media-centre/", init);
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();

      expect(text).not.toContain('<h5 class="modal-title">Did you mean to visit our Australian site?</h5>');
    }
  });
});


//
// --- Functions --- //
//
function verifyInjectedCoreScriptsExist(resp: any, text: string): void {

  // core Martech scripts have been injected
  expect(text).toContain("function generateGuid()");
  expect(text).toContain("function setCookieVal(key, val)");
  expect(text).toContain("function setAnonId()");
  expect(text).toContain("function setUserId()");
  expect(text).toContain("function setSessionId()");
  expect(text).toContain("function setQueryParamsAsKvs()");
  expect(text).toContain("function setDeviceCat(tabletRegex, mobileRegex)");
  expect(text).toContain("function setAllReportingChannels()");
  expect(text).toContain("function setAdvClickId(clickID)");
  expect(text).toContain("function arrayCleaner(dataModel)");
  expect(text).toContain("function xhrPOST(url, payload)");

  // anon Id headers have been injected
  expect(resp.headers.has("set-cookie")).toBeTruthy();
  let original = false;
  let backup = false;
  for (const pair of resp.headers.entries()) {
    let key = pair[0];
    if (pair[0] == "set-cookie") {
      if (pair[1].includes("user_anonymous_id=")) {
        original = true;
      }
      if (pair[1].includes("user_anonymous_id_saved=")) {
        backup = true;
      }
    }
  }
  expect(original && backup).toBeTruthy();
}
