import { describe, expect, it } from "vitest";
import {
    blockCookies,
    calculateHeaderSize, filterHeaders,
    HeaderLimitBytes,
    MonsterCookieRequestFix
} from "../../src/middlewares/cookieMonster";
import {Chance} from "chance";
import {RequestMiddlewareData} from "ctm-cf-worker-router-core";

function isResponse(value: Promise<Request | Response>): value is Promise<Response> {
    return (value as Promise<Response>) !== undefined;
}

function longRequest(length: number, name: string) {
    const chance = new Chance();
    const extraBytes = name.length + 2; //bytes for the name and 2 more for an = and ;
    const bigHeader = chance.string({
        length: length - extraBytes,
        alpha: true
    });
    const request = new Request("http://flowers.jpg");
    request.headers.append(name, bigHeader);
    expect(request.headers.get(name)).to.equal(bigHeader);
    return request;
}

describe("disallowed cookies are removed", () => {
    const examples = [
        "ca_deviceKey=block-this;",
        "ca_passKey=block-this;",
        "ca_refreshToken=block-this;",
        "ca_accessToken=block-this;",
        "ca_idToken=block-this;",
        "ca_authuser=block-this;",
        "CognitoIdentityCookie=block-this;",
        "amplifyCookie=block-this;"
    ];

    examples.forEach((example) => {
        it(example, async () => {
            const request = new Request("http://flowers.jpg");
            request.headers.set("Cookie", `${example} retained=keep-this;`);
            expect(request.headers.get("Cookie")).to.include(example);
            blockCookies(request);
            expect(request.headers.get("Cookie")).not.to.include(example);
            expect(request.headers.get("Cookie")).to.include("retained");
        });
    });
});

describe("A request", async () => {
    const chance = new Chance();
    it(`should return a 400 Bad Request when the header size exceeds the limit`, async () => {
        const bigHeader = chance.string({
            length: HeaderLimitBytes - 12, //10 bytes for the name and 2 more for an = and ;
            alpha: true
        });
        const request = new Request("http://flowers.jpg");
        request.headers.append("BIG_HEADER", bigHeader);
        expect(request.headers.get("BIG_HEADER")).to.equal(bigHeader);
        const data: RequestMiddlewareData = {
            originalRequest: request,
            headerScripts: [],
            request: request,
            config: {},
            response: null
        }
        const response = MonsterCookieRequestFix(data);
        if (isResponse(response)) {
            response.then(r => {
                const {status, statusText} = r;
                expect(status).to.equal(400);
                expect(statusText).to.equal("Bad Request");
            })
        }
    });
});

describe("A request should calculate the header size in bytes", () => {
    const chance = new Chance();

    it(`when randomly generating a value of ${HeaderLimitBytes} chars`, async () => {
        let request = longRequest(HeaderLimitBytes, "BIG_HEADER");
        const calculatedSize = calculateHeaderSize(request);

        expect(calculatedSize).to.equal(HeaderLimitBytes);
    });
});

describe("disallowed headers are removed", () => {
    const chance = new Chance();
    const examples = ["x-amz-security-token", "x-amz-date"];

    examples.forEach((example) => {
        it(example, async () => {
            const request = new Request("http://flowers.jpg");
            const blockedValue = chance.string({ length: 10240 });
            const permittedValue = chance.string({ length: 50 });
            request.headers.append(example, blockedValue);
            request.headers.append("permitted", permittedValue);
            expect(request.headers.get(example)).to.equal(blockedValue);
            expect(request.headers.get("permitted")).to.equal(permittedValue);
            filterHeaders(request);
            expect(request.headers.has(example)).to.be.false;
            expect(request.headers.has("permitted")).to.be.true;
            expect(request.headers.get("permitted")).to.equal(permittedValue);
        });
    });
});

