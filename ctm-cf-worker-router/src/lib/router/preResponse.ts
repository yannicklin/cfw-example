import { injectScripts, MiddlewareData } from "ctm-cf-worker-router-core";

/**function to be run before sending the response to the client
 * Injects any scripts accumulated in the headerScripts array
 *
 * @param data
 * @returns
 */
export function preResponseProcessing(data: MiddlewareData): Response {
  return injectScripts(data.response, data.headerScripts);
}
