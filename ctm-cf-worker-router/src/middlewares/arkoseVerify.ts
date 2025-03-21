import { CFAccessDetails, tryAddCFAccessHeaders } from "./cf-page-router";
import { Config } from "../config";

/**
 * Handle Threat Verify requests.
 * Call Threat-API /verify endpoint and return incoming request.
 *
 * @returns {Promise<Response>}
 */
export async function ArkoseVerify(incoming: Request, hostname: string, timeout: number, cfAccessDetails: CFAccessDetails): Promise<Request> {
  const endpoint: string = `https://${hostname}/${Config.arkoseConfig.verifyApiEndpoint}`;
  const body = JSON.stringify({
    "sessionToken": getSessionToken(incoming)
  });
  const req = new Request(endpoint, {
    method: "POST",
    body: body,
    headers: incoming.headers
  });
  // Add CF Auth headers to get around Zero Trust in DEV and UAT. No Zero Trust in PROD.
  const reqWithCFHeaders = tryAddCFAccessHeaders(req, cfAccessDetails);

  // Call Threat Verify.
  const threatRequest = new Promise((resolve, reject) => {
    fetch(reqWithCFHeaders)
      .then(response => {
        response.text().then((bodyText) => {
          if (response.status === 200) {
            resolve(bodyText);
          } else {
            console.error(`Verify failure. Response status: ${response.status}; Res text: ${bodyText})`);
          }
        }).catch((err) => {
          console.error("Error reading response body as text:", err);
        });
      }).catch((e) => {
      console.error("bed shat: ", e);
      reject(e);
    });
  });

  // Set timeout.
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject("Threat Verify request timed out, continuing with incoming request.");
    }, 1000 * timeout);
  });

  // Race Threat request with configured timeout.
  await Promise.race([
    threatRequest,
    timeoutPromise
  ]).then((res) => {
    console.log("Threat api verify success: ", res);
  }).catch((errorRes) => {
    console.error("Threat api verify failed: ", errorRes);
    if (errorRes instanceof Response) {
      errorRes.json().then((json) => {
        console.error("JSON error response:", json);
      }).catch((parseError: any) => {
        console.error("Failed to parse error response as JSON. Error: ", parseError);
      });
    } else if (errorRes instanceof Error) {
      console.error("Error msg: ", errorRes.message);
    } else {
      console.error("Unexpected error type.");
    }
  });

  // Return incoming request as is.
  return incoming;
}

/**
 *
 * Get sessionToken from cookie.
 * @param request
 */
function getSessionToken(request: Request): string | undefined {
  let token;
  request.headers.get("cookie")?.split(";").forEach(cookie => {
    const parts = cookie.match(/(.*?)=(.*)$/);
    if (parts && parts[1].trim() === "sessionToken") {
      token = parts[2];
    }
  });
  return token;
}
