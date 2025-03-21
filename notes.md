Set dataLaer for testing

```js
window.dataLayer = JSON.parse(`
[
  { "gtm.start": 1688528935565, "event": "gtm.js", "gtm.uniqueEventId": 1 },
  { "gtm.start": 1688528935566, "event": "gtm.js", "gtm.uniqueEventId": 2 },
  { "event": "gtm.js", "gtm.uniqueEventId": 3 },
  { "event": "test_ready", "gtm.uniqueEventId": 20 },
  { "event": "gtm.dom", "gtm.uniqueEventId": 24 },
  { "event": "gtm.dom", "gtm.uniqueEventId": 28 },
  {
    "event": "trackTransactionUpdate",
    "vertical": "car",
    "transaction": {
      "journeyId": 17030,
      "accountId": 517477,
      "vertical": "car",
      "phase": "initial",
      "brandCode": "ctm",
      "created": "2023-07-05t03:49:00.434z",
      "userAgent": "mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/114.0.0.0 safari/537.36",
      "ipAddress": "202.56.61.2"
    },
    "gtm.uniqueEventId": 32
  },
  {
    "event": "PAGE_VIEW_EVENT",
    "vertical": "car",
    "verticalFilter": "",
    "transaction": {
      "journeyId": 17030,
      "accountId": 517477,
      "vertical": "car",
      "phase": "initial",
      "brandCode": "ctm",
      "created": "2023-07-05t03:49:00.434z",
      "userAgent": "mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/114.0.0.0 safari/537.36",
      "ipAddress": "202.56.61.2"
    },
    "actionStep": "car quote start",
    "experimentId": null,
    "journey": {
      "contact": {
        "firstName": null,
        "lastName": null,
        "phone": null,
        "email": null,
        "optInPrivacy": null,
        "optInEmail": null,
        "optInPhone": null
      },
      "address": {
        "gnafId": null,
        "streetNumber": null,
        "streetName": null,
        "postcode": null,
        "suburb": null,
        "state": null,
        "parkingType": null
      },
      "data": {
        "helpers": { "isDisclaimerContentExpanded": true },
        "vehicle": {
          "rego": null,
          "redbookCodeLong": null,
          "redbookCode": null,
          "glassCode": null,
          "nviCode": null,
          "marketValue": null,
          "description": null,
          "make": null,
          "year": null,
          "model": null,
          "body": null,
          "transmission": null,
          "colour": null,
          "fuel": null,
          "alarmFitted": null,
          "immobiliserFitted": null,
          "hasOtherAccessories": null,
          "factoryOptions": null,
          "nonStandardAccessories": null,
          "modified": null,
          "damaged": null,
          "securityFeatures": null
        },
        "cover": {
          "coverType": null,
          "requestedExcess": null,
          "financeType": null,
          "useType": null,
          "currentlyInsured": null,
          "previousInsurer": null,
          "annualKilometres": null,
          "ownsAnotherCar": null,
          "ownsHome": null,
          "hasYoungerDriver": null,
          "driverOption": null,
          "dateCommencement": null,
          "driver": {
            "gender": null,
            "dob": null,
            "employmentStatus": null,
            "licenceAge": null,
            "anyPreviousClaims": null,
            "noClaimRating": null,
            "firstName": null,
            "lastName": null,
            "claimsDetails": null
          },
          "youngestDriver": { "gender": null, "dob": null, "licenceAge": null },
          "passengersPayment": null
        },
        "resultPageFilters": {
          "displayMode": "row",
          "sortBy": "productmeta.price.annualpremium",
          "frequency": "annual",
          "available": true,
          "initialised": {},
          "fetchNewResults": false,
          "currentFilterActions": [],
          "selectedProductIds": null,
          "requestedExcess": null,
          "coverType": null
        }
      }
    },
    "gtm.uniqueEventId": 36
  },
  { "event": "Function_Reset_Ecomm_Array", "ecommerce": [], "gtm.uniqueEventId": 55 },
  {
    "event": "TIMER_PAGE_VIEW_EVENT",
    "timers": { "timerName": "UVB>QS", "timeHMS": "NaN:NaN", "timeSeconds": null, "timerBucket": "30.0 min plus" },
    "gtm.uniqueEventId": 99
  },
  { "event": "gtm.load", "gtm.uniqueEventId": 106 },
  { "event": "gtm.load", "gtm.uniqueEventId": 110 }
]
`);
```
