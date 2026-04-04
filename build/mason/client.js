import { MasonService } from "zombslib";
export class TransMasonClient {
    constructor(ws) {
        this.ws = ws;
        this.ms = new MasonService();
    }
    disconnect(code) {
        var _a, _b;
        (_a = this.ms) === null || _a === void 0 ? void 0 : _a.shutdown();
        (_b = this.ws) === null || _b === void 0 ? void 0 : _b.close(code);
    }
}
