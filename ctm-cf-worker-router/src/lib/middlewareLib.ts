import { LocalMiddlewareData, makeLocalMiddlewareData, MiddlewareData } from "ctm-cf-worker-router-core";

//This should probably actually separate the response and config
//
/**Middleware designed to edit the response in some way
 */
export type ResponseMiddleware = (data: MiddlewareData) => Promise<Response>;

/**A function that can be used as middleware
 *The name is for documentation and logging purposes
 */
export type MiddlewareFunc = {
  name: string;
  func: ResponseMiddleware;
};

function jsonRequest(body: LocalMiddlewareData) {
  const myHeaders = new Headers();

  myHeaders.append("Content-Type", "application/json");
  return new Request("https://fake.com/a", {
    method: "POST",
    body: JSON.stringify(body),
    headers: myHeaders
  });
}
/**Makes a middleware from a service binding to another cloudflare worker
 *
 */
export function MakeServiceMiddleware(
  name: string,
  fetcher: Fetcher | undefined,
  triggerOnly: boolean = false
): MiddlewareFunc {
  if (fetcher === undefined || fetcher === null) throw "fetcher must not be null or undefined";
  return {
    func: async (data: MiddlewareData) => {
      let localData = await makeLocalMiddlewareData(data);
      let res = await fetcher.fetch(jsonRequest(localData));
      return res;
    },
    name: name
  };
}

/** Makes middleware from a any js function
 *
 * @param name
 * @param fetcher
 * @returns
 */
export function MakeLocalMiddleware(
  name: string,
  fetcher: (middleware: MiddlewareData) => Promise<Response>
): MiddlewareFunc {
  return {
    func: fetcher,
    name: name
  };
}

export async function ExecuteMiddleware(funcs: MiddlewareFunc[], data: MiddlewareData) {
  for (let middleware of funcs) {
    console.log(`Running middleware: ${middleware.name}`);
    //Execute our middleware and feed in the currentResponse
    let response = await middleware.func(data);
    data.response = response instanceof Object ? response : data.response;
  }
  return data;
}
