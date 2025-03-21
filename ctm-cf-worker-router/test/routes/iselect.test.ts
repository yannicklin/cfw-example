import { beforeAll, describe, expect, it } from "vitest";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import worker from "../../src";
import { Config } from "../../src/config";

// @ts-ignore
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Worker", async () => {
  const ctx = createExecutionContext();

  beforeAll(async () => {
    env.CF_ACCESS_AUTH_TOKEN = process.env.CF_ACCESS_AUTH_TOKEN || "";
    env.CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
  });

  // Verify  iSelect's GTM script for journeys is injected
  it("should return injected GTM script in iSelect journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest("https://dev.compare.iselect.com.au/car-insurance/journey/prefill_check");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();
      expect(text).toContain("https://dev.compare.iselect.com.au/metrics");
      expect(text).toContain(Config.gtmConfig.iselctGtmKey);
    }
  });

  // Verify  iSelect's chat scripts is injected
  it("should return injected chat script in iSelect journey", async () => {
    // @ts-ignore
    const request = new IncomingRequest("https://dev.compare.iselect.com.au/car-insurance/journey/prefill_check");
    // @ts-ignore
    const resp = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    if (resp) {
      expect(resp.status).toBe(200);
      const text: string = await resp.text();
      expect(text).toContain("https://dev.compare.iselect.com.au/chat");
      expect(text).toContain(Config.chatConfig.iselectContainers.car.nonProd);
    }
  });

});