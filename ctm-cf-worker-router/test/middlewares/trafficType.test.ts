import { describe, expect, it } from "vitest";
import {
  AddTrafficHeaders,
  connectingIpv4HeaderName,
  connectingIpv6HeaderName,
  newRelicSyntheticHeaderName,
  trafficHeaderKey,
  TrafficType
} from "../../src/middlewares/trafficType";

describe("AddTrafficHeaders", () => {
  it("should add synthetics traffic header to request for multipass", async () => {

    const url = "http://test.com/random?automated-test=true";
    const req = new Request(url);

    const updated = await AddTrafficHeaders(req);
    console.log(updated);

    // Assert
    expect(updated.headers.has(trafficHeaderKey)).toBe(true);
    const header = updated.headers.get(trafficHeaderKey);
    expect(header).toBeTruthy();
    expect(header?.includes(TrafficType.AUTOMATED_TEST)).toBe(true);
  });
});

describe("AddTrafficHeaders", () => {
  it("should add synthetics traffic header to request based on ipv4", async () => {

    const url = "http://test.com/random";
    let req = new Request(url);
    req.headers.append(connectingIpv4HeaderName, "13.236.81.73");

    const updated = await AddTrafficHeaders(req);

    // Assert
    expect(updated.headers.has(trafficHeaderKey)).toBe(true);
    const header = updated.headers.get(trafficHeaderKey);
    expect(header).toBeTruthy();
    expect(header?.includes(TrafficType.AUTOMATED_TEST)).toBe(true);
  });
});

describe("AddTrafficHeaders", () => {
  it("should add synthetics traffic header to request based on ipv6", async () => {

    const url = "http://test.com/random";
    let req = new Request(url);
    req.headers.append(connectingIpv6HeaderName, "2406:DA2C:000C:01FF:FFFF:FFFF:FFFF:FFFF");

    const updated = await AddTrafficHeaders(req);

    // Assert
    expect(updated.headers.has(trafficHeaderKey)).toBe(true);
    const header = updated.headers.get(trafficHeaderKey);
    expect(header).toBeTruthy();
    expect(header?.includes(TrafficType.AUTOMATED_TEST)).toBe(true);
  });
});

describe("AddTrafficHeaders", () => {
  it("should add synthetics traffic header to request for new relic", async () => {

    const url = "http://test.com/random";
    let req = new Request(url);
    req.headers.append(newRelicSyntheticHeaderName, "Request sent by a synthetic monitor (/docs/synthetics/new-relic-synthetics/administration/identify-synthetics-requests-your-app) - monitor id: 1234 | account id: 1234");

    const updated = await AddTrafficHeaders(req);

    // Assert
    expect(updated.headers.has(trafficHeaderKey)).toBe(true);
    const header = updated.headers.get(trafficHeaderKey);
    expect(header).toBeTruthy();
    expect(header?.includes(TrafficType.AUTOMATED_TEST)).toBe(true);
  });
});

describe("AddTrafficHeaders", () => {
  it("should add call centre traffic header to request", async () => {

    const url = "http://test.com/ctm/simples/home.jsp";
    let req = new Request(url);
    req.headers.append("Cookie", "isSimplesUser=true");

    const updated = await AddTrafficHeaders(req);

    // Assert
    expect(updated.headers.has(trafficHeaderKey)).toBe(true);
    const header = updated.headers.get(trafficHeaderKey);
    expect(header).toBeTruthy();
    expect(header?.includes(TrafficType.CALL_CENTRE)).toBe(true);
  });
});

describe("AddTrafficHeaders", () => {
  it("should add internal traffic header to request", async () => {

    const url = "http://test.com/random";
    let req = new Request(url);
    req.headers.append(connectingIpv4HeaderName, "202.56.60.10");

    const updated = await AddTrafficHeaders(req);

    // Assert
    expect(updated.headers.has(trafficHeaderKey)).toBe(true);
    const header = updated.headers.get(trafficHeaderKey);
    expect(header).toBeTruthy();
    expect(header?.includes(TrafficType.INTERNAL)).toBe(true);
  });
});

describe("AddTrafficHeaders", () => {
  it("should add external traffic header to request", async () => {

    const url = "http://test.com/random";
    let req = new Request(url);
    req.headers.append(connectingIpv4HeaderName, "192.16.21.10");

    const updated = await AddTrafficHeaders(req);

    // Assert
    expect(updated.headers.has(trafficHeaderKey)).toBe(true);
    const header = updated.headers.get(trafficHeaderKey);
    expect(header).toBeTruthy();
    expect(header?.includes(TrafficType.EXTERNAL)).toBe(true);
  });
});
