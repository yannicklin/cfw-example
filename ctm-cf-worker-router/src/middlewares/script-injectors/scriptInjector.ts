import { getFunctionBody, InjectLocation, MiddlewareData } from "ctm-cf-worker-router-core";

export type InjectableScript = string | (() => void);

/**Adds a group of scripts to the middlewareData headerScripts which will then be injected into the
 * response just before it is sent to the client.
 * This is useful if we would like to inject many scripts all together
 *
 */
export function ScriptInjectDelayed(
  data: MiddlewareData,
  scripts: InjectableScript[],
  location = InjectLocation.HeadEnd
): Response {
  let scriptContents = scripts.map((script) => {
    if (typeof script === "string") return script;
    else return getFunctionBody(script);
  });
  switch (location) {
    case InjectLocation.HeadEnd:
      data.headerScripts.push(...scriptContents);
      break;
    case InjectLocation.BodyStart:
      throw new Error("Not implemented");
      break;
    case InjectLocation.BodyEnd:
      throw new Error("Not implemented");
      break;
  }
  return data.response;
}
