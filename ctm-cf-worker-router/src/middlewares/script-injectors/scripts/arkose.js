import { getFunctionBody } from "ctm-cf-worker-router-core";

function setupArkoseDetect() {
    // Vars replaced on injection.
    const RAY_ID = "$RAY_ID";
    const ARKOSE_SESSION_TOKEN_EXPIRY_HRS = $ARKOSE_SESSION_TOKEN_EXPIRY_HRS;
    const TRACKING_DATA_RETRY = $TRACKING_DATA_RETRY;
    const THREAT_ENCRYPT_ENDPOINT = "$THREAT_ENCRYPT_ENDPOINT";
    const ARKOSE_DETECT_PROP = $ARKOSE_DETECT_PROP;

    const sessionTokenKey = "sessionToken";

    let encryptPayload = {
        "journeyId": "",
        "anonymousId": window.sessionStorage.getItem("user_anonymous_id"),
        "cloudflareRayId": RAY_ID,
        "vertical": "",
        "userId": window.sessionStorage.getItem('user_id'), // set to sessionStorage for logged in user
        "brandCode": ""
    };

    // Delete cookie, to account for cookie loaded from another tab.
    deleteCookie(sessionTokenKey);

    let trackingDataIntervalCount = 1;
    let trackingDataInterval = setInterval(() => {
        if (getTrackingData() === true || trackingDataIntervalCount >= TRACKING_DATA_RETRY) {
            clearInterval(trackingDataInterval);
            let xhr = new XMLHttpRequest();
            xhr.open('POST', THREAT_ENCRYPT_ENDPOINT, true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            // Check to see if user_anonymous_id is populated.
            // GTM injected core functions will run after this script and user_anonymous_id is not available on page load.
            if (encryptPayload.anonymousId === null) {
                encryptPayload.anonymousId = window.sessionStorage.getItem("user_anonymous_id");
            }

            xhr.send(JSON.stringify(encryptPayload));

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let OBJencodedData = JSON.parse(xhr.response).encodedData

                    ARKOSE_DETECT_PROP.setConfig({
                        data: {
                            blob: OBJencodedData
                        },
                        selector: '#arkose-detect',
                        mode: 'inline',
                        onCompleted: function (response) {
                            let OBJsessionToken = response.token;
                            setSessionToken(OBJsessionToken);
                        }
                    });
                }
            }
        }
        trackingDataIntervalCount++;
    }, 2000);

    // Get tracking data from dataLayer.
    function getTrackingData() {
        if (typeof dataLayer === 'undefined') {
            return false;
        }
        for (let i = 0; i <= dataLayer.length; i++) {
            // Check if page_view_event has loaded and retrieve data.
            if (dataLayer[i]?.event === "PAGE_VIEW_EVENT" || dataLayer[i]?.event === "trackQuoteEvent") {
                encryptPayload.vertical = dataLayer[i].vertical;
                encryptPayload.brandCode = "ctm";
                // Get Journey ID for verticals on Atlas stack.
                if (encryptPayload.vertical === "travel" || encryptPayload.vertical === "pet" || encryptPayload.vertical === "energy") {
                    encryptPayload.journeyId = dataLayer[i].tracking?.journeyID;
                } else if(encryptPayload.vertical === "health" ) {
                    // Get Journey ID for web_ctm.
                    encryptPayload.journeyId = dataLayer[i].transactionID;
                } else if (encryptPayload.vertical === "car" || encryptPayload.vertical === "home_contents") {
                    // For verticals in Everest stack check multiple PAGE_VIEW_EVENTs in dataLayer if transaction is not set.
                    // Unlike other verticals, we retrieve Journey ID and brandCode from dataLayer.transaction
                    // and this is not set on initial PAGE_VIEW_EVENT which is loaded on ../journey/prefill_check.
                    // ..journey/start will set transaction to dataLayer.
                    if (dataLayer[i].transaction === undefined) {
                        continue;
                    }
                    encryptPayload.journeyId = dataLayer[i].transaction.journeyId;
                    encryptPayload.brandCode = dataLayer[i].transaction.brandCode;
                }
                return true;
            }
        }
        return false;
    }

    function setSessionToken(token) {
        // Add token to session storage to be accessible by GTM till CF middleware (for verify) is deployed.
        sessionStorage.setItem(sessionTokenKey, token);

        // Add token to cookie to be used by CF middleware.
        setCookie(token);
    }

    function setCookie(token) {
        document.cookie = sessionTokenKey + "=" + token + "; expires= " + getSessionTokenExpiry() + "; path=/; sameSite=strict; secure";
    }

    function deleteCookie(token) {
        document.cookie = sessionTokenKey + "=" + token + "; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; sameSite=strict; secure";
    }

    function getSessionTokenExpiry() {
        const date = new Date();
        date.setTime(date.getTime() + (ARKOSE_SESSION_TOKEN_EXPIRY_HRS * 60 * 60 * 1000));
        return "expires=" + date.toUTCString();
    }

    // Add cookie with sessionToken when tab is visible.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (sessionStorage.getItem('sessionToken') === null) {
                deleteCookie(sessionTokenKey);
            } else {
                setCookie(sessionStorage.getItem(sessionTokenKey));
            }
        }
    });
}

export const arkoseScripts = {
    setupArkoseDetect: getFunctionBody(setupArkoseDetect)
}
