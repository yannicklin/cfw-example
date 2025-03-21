export type middlewareConfig = {
  //Any custom config we want to pass on goes in here
};

export type RequestMiddlewareData = {
  request: Request;
  originalRequest: Request;
  headerScripts: string[];
  config: middlewareConfig;
  response: Response | null;
};

export type MiddlewareData = RequestMiddlewareData & {
  response: Response;
};

/**Just like MiddlwareData but with the response fully resolved so that we can
 * serialise it and send it to other workers
 */
export type LocalMiddlewareData = {
  response: ResponseLocal;
  config: middlewareConfig;
};

/**Like the response data type but with the body resolved so that we can serialise it and move it around
 *
 */
export type ResponseLocal = {
  readonly status: number;
  readonly statusText: string;
  readonly headers: [string, string][];
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly url: string;
  readonly cf?: Object;
  readonly body: string;
};

export function getHeader(response: ResponseLocal, header: string): string | undefined {
  //Case insensitive search because html headers are case insensitive
  let res = response.headers.find((x) => x[0].toLowerCase() == header.toLowerCase());
  return res?.[1];
}

export function toResponse(localResponse: ResponseLocal): Response {
  let headers = new Headers(localResponse.headers);
  let res: Response = new Response(localResponse.body, {
    status: localResponse.status,
    statusText: localResponse.statusText,
    cf: localResponse.cf,
    headers: headers
  });
  return res;
}

export async function makeLocalResponse(response: Response): Promise<ResponseLocal> {
  console.log("Making local version of response from: ", response.url);
  let body = await response.text();
  let headerArray = Array.from(response.headers.entries());
  headerArray.find;
  console.log("header Array:", headerArray);
  let res: ResponseLocal = { ...response, headers: headerArray, body: body };

  return res;
}

export async function makeLocalMiddlewareData(data: MiddlewareData): Promise<LocalMiddlewareData> {
  return {
    response: await makeLocalResponse(data.response),
    config: data.config
  };
}
