import { getFunction, replaceVars } from 'ctm-cf-worker-router-core';

// GUID Generator as callable function.
export function generateGuid() {
  const radix = 16;
  let dateTime = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    dateTime += performance.now(); //use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(char) {
    const rand = (dateTime + Math.random() * radix) % radix | 0;
    dateTime = Math.floor(dateTime / radix);
    return (char === 'x' ? rand : (rand & 0x3) | 0x8).toString(radix);
  });
}

// Choosi are not considered here as we do not have access to their CMS to either set all the necessary Martech values or pass them in a hijacked CTA ahref
export function getDomain() {
  const hostname = window.location.hostname;
  const ctmDomain = 'comparethemarket.com.au';
  const isltDomain = 'compare.iselect.com.au';
  if (hostname.includes(ctmDomain)) {
    return ctmDomain;
  } else if (hostname.includes(isltDomain)) {
    return isltDomain;
  } else {
    return hostname;
  }
}

// Set Cookie.
export function setCookieVal(key, val) {
  document.cookie = key + '=' + val + '; Domain=' + getDomain() + '; path=/; Secure; SameSite=Strict; Max-Age=34560000;';
}

// Set User ID, preference those parsed via URL>sessionStorage than the default cookie.
export function setUserId() {
  try {
    const userId = 'user_id';
    const regex = /user_id=([^;\n]+)/;
    const user_id_session = sessionStorage.getItem(userId) || undefined;
    const match = document.cookie.match(regex);
    const user_id_cookie = !!match
      ? decodeURI(match[1])
      : undefined;
    if (!user_id_session && user_id_cookie) {
      sessionStorage.setItem(userId, user_id_cookie);
    }
  } catch (e) {
    console.error('Error setting user ID: ' + e);
  }
}

// Replaces the placeholder text in the setAnonId function with user_anonymous_id
// value generated in cookieJar.js
export function setAnonIdScript(serverAnonId) {
  return replaceVars(getFunction(setAnonId), { SERVER_ANON_ID: serverAnonId ?? '' });
}

// Persistence and creation of AnonymousID.
export function setAnonId() {
  const serverAnonId = '$SERVER_ANON_ID';
  const anonIdSeparator = '.';
  const anonIdCookieName = 'user_anonymous_id';
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const guidRegexCook = /^user_anonymous_id=[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}(?:\/.*)?.\d+$/i;

  const regEx = new RegExp(guidRegexCook, 'i');
  let anonSs =
    !!sessionStorage.getItem(anonIdCookieName) && sessionStorage.getItem(anonIdCookieName).match(guidRegex)[0]
      ? sessionStorage.getItem(anonIdCookieName)
      : undefined;
  console.log('anonSs is: ' + anonSs);
  let anonCook;
  for (const cookie of document.cookie.split(';')) {
    if (guidRegexCook.test(cookie.trim())) {
      const anonCookStr = cookie.trim();
      anonCook = anonCookStr.match(guidRegexCook)[0].substring(18, 54);
      break;
    }
  }
  console.log('anonCook is: ' + anonCook);

  try {
    // check for session storage
    if (!!anonSs) {
      console.log('Session storage set - do nothing');
    }
    // check for condition: anonCook exists
    else if (!!anonCook) {
      // only the anonymousId uuid portion is saved to session storage
      let pieces = anonCook.split(anonIdSeparator);
      sessionStorage.setItem(anonIdCookieName, pieces[0]);
      console.log('anonCook set in session');
    } else if (!!serverAnonId && serverAnonId !== '') {
      let pieces = serverAnonId.split(anonIdSeparator);
      sessionStorage.setItem(anonIdCookieName, pieces[0]);
      console.log('anonCook set in session using server anon ID: ', pieces[0]);
    }
    // set ALL the things
    else {
      // anonymousId consists of a uuid with the creation time in milliseconds, separated by the const anonIdSeparator
      let newUuid = generateGuid();
      let anonId = newUuid + anonIdSeparator + Date.now();
      sessionStorage.setItem(anonIdCookieName, newUuid);
      setCookieVal(anonIdCookieName, anonId);
      console.log('Cookies generated anew');
    }
  } catch (e) {
    // catch errors
    console.log('Error setting AnonymousID: ' + e);
  }
}
