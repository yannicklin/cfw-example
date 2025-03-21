import { injectScript, LocalMiddlewareData, toResponse } from "ctm-cf-worker-router-core";
import { scriptContent } from "./injectedFunction.js";

export interface Env {}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    let middleData = await request.json<LocalMiddlewareData>();

    console.log("Injecting script into response");
    let response = toResponse(middleData.response);

    return injectScript(response, scriptContent);
  }
};
