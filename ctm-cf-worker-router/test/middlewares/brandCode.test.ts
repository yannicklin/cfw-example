import {describe, expect, it, vi} from "vitest";
import {AddBrandCode} from "../../src/middlewares/brandCode";

describe('AddBrandCode', () => {
    it('should append brandCode to jsp url', () => {

        const url = "http://test.com/health.jsp"
        const req = new Request(url);

        let updated = AddBrandCode(req);

        // Assert
        updated.then(r => expect(r.url).toBe(url + "?brandCode=ctm"));
    });
});

describe('AddBrandCode', () => {
    it('should not append brandCode to non-jsp url', () => {

        const url = "http://test.com/health/"
        const req = new Request(url);

        let updated = AddBrandCode(req);

        // Assert
        updated.then(r => expect(r.url).toBe(url));
    });
});