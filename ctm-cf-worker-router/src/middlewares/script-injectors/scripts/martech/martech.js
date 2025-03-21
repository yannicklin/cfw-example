import { getFunction, getFunctionBody } from 'ctm-cf-worker-router-core';
import { generateGuid, getDomain, setAnonId, setCookieVal, setUserId } from './user.js';
import { setAllReportingChannels } from './reporting.js';

function coreMartechFunctions() {
  (() => {
    const clickID = [
      'irclid',
      'li_fat_id',
      'tcclid',
      'tblci',
      'ScCid',
      'fbclid',
      'msclikid',
      'vmcid',
      'gbraid',
      'wbraid',
      'gclid',
      'dclid'
    ];

    const tabletRegex = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i;
    const mobileRegex = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/;

    // set all queries as sessionStorage kv pairs
    // NB this function must execute first to ensure session variables are available for other scripts
    setQueryParamsAsKvs();

    // set anon id
    setAnonId();

    // set session guid
    setSessionId();

    // set user id
    setUserId();

    // set reporting channels
    setAllReportingChannels();

    // set session referrer
    setReferrer();

    // set device category
    setDeviceCat(tabletRegex, mobileRegex);

    // set advertising click ids
    setAdvClickId(clickID);
  })();
}

// Creates SessionID if doesn't exist.
export function setSessionId() {
  try {
    const sessionId = 'sessionID';
    if (!sessionStorage.getItem(sessionId)) {
      sessionStorage.setItem(sessionId, generateGuid());
    }
  } catch (e) {
    console.error('Error setting session ID' + e);
  }
}

// Saves the referrer path of the Session initiation.
export function setReferrer() {
  try {
    const REFERRER = 'referrer';
    const ctmDomain = 'comparethemarket.com.au';
    const isltDomain = 'compare.iselect.com.au';
    const docRef_sessStore = sessionStorage.getItem(REFERRER);
    if (!docRef_sessStore) {
      const docRef = document.referrer ? document.referrer.split('/')[2] : '';
      // as discussed with Martech, Choosi will not be catered for here.
      // we won't have referrer data as we dont have access to there CMS - referrer is currently being set to choosi.com.au
      if (docRef.includes(ctmDomain) || docRef.includes(isltDomain)) {
        sessionStorage.setItem(REFERRER, '');
      } else {
        sessionStorage.setItem(REFERRER, docRef);
      }
    }
  } catch (e) {
    console.error('Error setting referrer: ' + e);
  }
}

// Treat ALL URL params as key/value pairs and save in equivalent self-name sessionStorage.
export function setQueryParamsAsKvs() {
  try {
    const urlSplitOnFragment = location.href.split('#');
    let queryStringWithoutFragment = urlSplitOnFragment.length > 1 ? urlSplitOnFragment[0] : location.href;
    const queryArray = queryStringWithoutFragment.split(/[\?,\&]+/);
    for (let i = 1; i < queryArray.length; i++) {
      if (queryArray[i] !== undefined) {
        let qsPieces = queryArray[i].split('=');
        if (qsPieces.length === 2) {
          let keyVar = qsPieces[0];
          let valueVar = decodeURI(qsPieces[1]);
          sessionStorage.setItem(keyVar, valueVar);
        }
      }
    }
  } catch (e) {
    console.error('Exception populating sessionStorage with query string values: ' + e);
  }
}

// Marketing ClickID Tracker variables.
export function setAdvClickId(clickID) {
  try {
    for (let i = 0; i < clickID.length; i++) {
      let currClickID = clickID[i];
      if (!!sessionStorage.getItem(currClickID)) {
        sessionStorage.setItem('clickID_TYPE', currClickID);
        sessionStorage.setItem('clickID_VALUE', sessionStorage.getItem(currClickID));
        break;
      }
    }
  } catch (e) {
    console.error('Error setting Adv Click ID: ' + e);
  }
}

// Object Array cleaner as callable function.
export function arrayCleaner(dataModel) {
  try {
    let cleanedDataModel = {};
    for (let variable in dataModel) {
      if (dataModel[variable] !== undefined && !dataModel[variable].match(/undefined/g)) {
        cleanedDataModel[variable] = dataModel[variable];
      }
    }
    return cleanedDataModel;
  } catch (e) {
    console.error('Error cleaning array: ' + e);
  }
}

// Device Category variable as sessionStorage.
export function setDeviceCat(tabletRegex, mobileRegex) {
  try {
    const userAgent = navigator.userAgent;
    let deviceCategory = 'Desktop';

    if (tabletRegex.test(userAgent)) {
      deviceCategory = 'Tablet';
    } else if (mobileRegex.test(userAgent)) {
      deviceCategory = 'Mobile';
    }

    sessionStorage.setItem('deviceCategory', deviceCategory);
  } catch (e) {
    console.error('Error setting device category: ' + e);
  }
}

// XHR method as callable function.
export function xhrPOST(url, payload) {
  const xhr = new XMLHttpRequest;
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.onreadystatechange = function() {
    if (4 === xhr.readyState && 200 === xhr.status) {
      console.log(JSON.parse(xhr.responseText));
    }
  };
  let r = JSON.stringify(payload);
  xhr.send(r);
}

export const martechScripts = {
  setSessionId: getFunction(setSessionId),
  arrayCleaner: getFunction(arrayCleaner),
  xhrPOST: getFunction(xhrPOST),
  setAllReportingChannels: getFunction(setAllReportingChannels),
  setReferrer: getFunction(setReferrer),
  setQueryParamsAsKvs: getFunction(setQueryParamsAsKvs),
  setUserId: getFunction(setUserId),
  setCookieVal: getFunction(setCookieVal),
  getDomain: getFunction(getDomain),
  setAdvClickId: getFunction(setAdvClickId),
  generateGuid: getFunction(generateGuid),
  setDeviceCat: getFunction(setDeviceCat),
  coreMartechFunctions: getFunctionBody(coreMartechFunctions)
};
