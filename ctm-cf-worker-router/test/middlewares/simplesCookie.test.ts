import { describe, expect, it } from "vitest";
import { callCentreCookieName, SimplesCookieManager } from "../../src/middlewares/simplesCookie";
import { MiddlewareData } from "ctm-cf-worker-router-core";

describe('SimplesCookieManager', () => {
    it('should add set cookie header to request', () => {

        const url = "http://test.com/simples.jsp"
        const req = new Request(url);
        const response = new Response("test", { status: 200 });

        const middlewareData: MiddlewareData = {
            originalRequest: req,
            headerScripts: [],
            request: req,
            config: {},
            response: response
        };
        let updated = SimplesCookieManager(middlewareData);

        // Assert
        updated.then(r => {
          expect(r.headers.has("Set-Cookie")).toBe(true);
          const header = r.headers.get("Set-Cookie");
          expect(header).toBeTruthy();
          expect(header?.includes(callCentreCookieName)).toBe(true);
        });
    });
});

describe('SimplesCookieManager', () => {
  it('should add delete cookie header to request', () => {

    const url = "http://test.com/simples_logout.jsp"
    const req = new Request(url);
    const response = new Response("test", { status: 200 });

    const middlewareData: MiddlewareData = {
      originalRequest: req,
      headerScripts: [],
      request: req,
      config: {},
      response: response
    };
    let updated = SimplesCookieManager(middlewareData);

    // Assert
    updated.then(r => {
      expect(r.headers.has("Set-Cookie")).toBe(true);
      const header = r.headers.get("Set-Cookie");
      expect(header).toBeTruthy();
      expect(header?.includes(callCentreCookieName)).toBe(true);
      expect(header?.includes("expires=Thu, 01 Jan 1970 00:00:00 GMT")).toBe(true);
    });
  });
});