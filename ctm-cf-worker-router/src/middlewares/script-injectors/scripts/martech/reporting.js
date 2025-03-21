// Reporting Channel logic (for daily KPI reports).
export function setAllReportingChannels() {
  const SIMPLES_APP = 'Simples App';
  const PUSH_NOTIFICATIONS = 'Push Notifications';
  const BRAND_PAID_SEARCH = 'Brand Paid Search';
  const PAID_SEARCH = 'Paid Search';
  const AFFILIATES = 'Affiliates';
  const EMAIL_ASSIST = 'Email Assist';
  const EMAIL = 'Email';
  const DIRECT = 'Direct';
  const ORGANIC_SEARCH = 'Organic Search';
  const SOCIAL = 'Social';
  const REFERRAL = 'Referral';
  const DISPLAY = 'Display';
  const OTHER_ADVERTISING = 'Other Advertising';
  const SMS = 'SMS';
  const OFFLINE = 'Offline';
  const CROSS_NETWORK = 'Cross-network';
  const AUDIO = 'Audio';
  const NATIVE = 'Native';
  const PAID_SOCIAL = 'Paid Social';
  const PAID_VIDEO = 'Paid Video';
  const PAID_OTHER = 'Paid Other';
  const ORGANIC_SOCIAL = 'Organic Social';
  const ORGANIC_VIDEO = 'Organic Video';
  const UNATTRIBUTED = 'Unattributed';
  const REPORTING_CHANNEL = 'reportingChannel';
  const REPORTING_CHANNEL_V2 = 'reportingChannelV2';

  const LANDING_REFERRER_DOMAIN_RAW = sessionStorage.getItem('referrer') || '';
  const LANDING_FULL_URL = sessionStorage.getItem('landing_page_full_url') || '';
  const UTM_MEDIUM = sessionStorage.getItem('utm_medium') || '';
  const UTM_SOURCE = sessionStorage.getItem('utm_source') || '';
  const UTM_CAMPAIGN = sessionStorage.getItem('utm_campaign') || '';
  const UTM_CONTENT = sessionStorage.getItem('utm_content') || '';
  const UTM_TERM = sessionStorage.getItem('utm_term') || '';
  const LANDING_REFERRER_DOMAIN = transformedReferrerDomain();

  // Channel grouping regex strings.
  const PAID_MARKETING_REGEX = /^(.*cp(m|c|a|v|p)|ppc|re(target|market|mkt)ing|paid.*)$/i;
  const DISPLAY_BANNER_REGEX = /^(display|banner|expandable|interstitial|cpm|cpv)$/i;
  const DISPLAY_AND_MARKETING_REGEX = /^(.*cp(m|c|a|v|p)|display|ppc|re(target|market|mkt)ing|paid.*)$/i;
  const REFERRAL_REGEX = /^(referral|app|link)$/i;
  const SEARCH_REGEX = /( |-|_|\+)search( |-|_|\+)/i;
  const MAIL_REGEX = /e(| |-|_|\+)mail/i;
  const CTM_DOMAIN_REGEX = /(comparethemarket-com(|-au)\.cdn\.ampproject\.org)/i;
  const CTM_DOMAIN_AU_REGEX = /(comparethemarket-com-au\.cdn\.ampproject\.org)/i;
  const SOCIAL_MEDIA_REGEX = /^(social(|( |-|_|\+)network|( |-|_|\+)media)|sm)$/i;
  const ORGANIC_REGEX = /^organic$/i;
  const DISPLAY_REGEX = /display/i;
  const SMS_REGEX = /sms/i;
  const SMS_REGEX_V2 = /^sms$/i;
  const VIDEO_REGEX = /video/i;
  const QUOTE_REGEX = /quote/i;
  const APP_REGEX = /^app$/i;

  // Site/source classification regex strings
  const sourceClassificationRegex = [
    /^360\.cn/i,
    /^alice(\.com)?/i,
    /^aol(\.com)?/i,
    /^ask(\.com)?/i,
    /^auone(\.com)?/i,
    /^avg(\.com)?/i,
    /^babylon(\.com)?/i,
    /^baidu(\.com)?/i,
    /^biglobe(\.co|\.ne)?\.jp?/i,
    /^(www\.)?bing(\.com)?/i,
    /^centrum\.cz/i,
    /^cn\.bing\.com/i,
    /^cnn(\.com)?/i,
    /^comcast(\.com)?/i,
    /^conduit(\.com)?/i,
    /^daum(\.net)?/i,
    /^dogpile(\.com)?/i,
    /^duckduckgo(\.com)?/i,
    /^ecosia\.org/i,
    /^email\.seznam\.cz/i,
    /^eniro/i,
    /^exalead\.com/i,
    /^excite\.com/i,
    /^firmy\.cz/i,
    /^globo(\.com)?/i,
    /^go\.mail\.ru/i,
    /^google(-play)?/i,
    /^(www\.)?google\.com(\.au)?/i,
    /^incredimail(\.com)?/i,
    /^kvasir(\.com)?/i,
    /^lens\.google\.com/i,
    /^lite\.qwant\.com/i,
    /^lycos/i,
    /^m\.(baidu|naver(\.com|\.search)?|sogou)\.com/i,
    /^mail\.(rambler|yandex)\.ru/i,
    /^microsoft/i,
    /^msn(\.com)?/i,
    /^najdi(\.com)?/i,
    /^naver(\.com)?/i,
    /^news\.google\.com/i,
    /^ntp\.msn\.com/i,
    /^onet(\.pl)?/i,
    /^play\.google\.com/i,
    /^qwant(\.com)?/i,
    /^rakuten(\.co\.jp)?/i,
    /^rambler(\.ru)?/i,
    /^search\.aol\.(co\.uk|com)/i,
    /^search\.google\.com/i,
    /^search\.smt\.docomo\.ne\.jp/i,
    /^search\.(ukr\.net|results)/i,
    /^.*\.search\.yahoo\.com/i,
    /^secureurl\.ukr\.net/i,
    /^seznam(\.cz)?/i,
    /^so\.com/i,
    /^sogou(\.com)?/i,
    /^sp-web\.search\.auone\.jp/i,
    /^startsiden(\.no)?/i,
    /^suche\.aol\.de/i,
    /^terra/i,
    /^tut\.by/i,
    /^ukr(\.com)?/i,
    /^virgilio(\.com)?/i,
    /^wap\.sogou\.com/i,
    /^webmaster\.yandex\.ru/i,
    /^websearch\.rakuten\.co\.jp/i,
    /^x(\.com)?$/i,
    /^yahoo(\.co\.jp|\.com)?/i,
    /^yandex(\.(by|com(\.tr)?|fr|kz|ru|ua|uz|com))?/i,
    /^zen\.yandex\.ru/i
  ];

  const socialSourcesRegex = [
    /^.*\.blogspot\.com/i,
    /^digg(\.com)?/i,
    /^disqus(\.com)?/i,
    /^((l|lm|m|mtouch|web)\.)?facebook(\.com)?/i,
    /^fb/i,
    /^.*feedspot(\.com)?/i,
    /^flipboard(\.com)?/i,
    /^(l\.)instagram(\.com)?/i,
    /^insta/i,
    /^ig/i,
    /^linkedin(\.com)?/i,
    /^lnkd\.in/i,
    /^medium\.com/i,
    /^messages\.google\.com/i,
    /^(l\.)?messenger\.com/i,
    /^((m\.)?blog\.|cafe\.)?naver(\.com)?/i,
    /^news\.ycombinator\.com/i,
    /^.*pinterest(\.com)?/i,
    /^quora(\.com)?/i,
    /^(old\.)?reddit(\.com)?/i,
    /^sites\.google\.com?/i,
    /^smartnews(\.com)?/i,
    /^t\.co/i,
    /^twitter(\.com)?/i,
    /^tiktok(\.com)?/i,
    /^tripadvisor(\.com(\.au)?)?/i,
    /^trustpilot(\.com)?/i,
    /^.*\.weebly\.com/i,
    /^.*\.wordpress\.com/i,
    /^web\.yammer\.com/i,
    /^groups\.google\.com/i,
    /^zalo(\.com)?/i
  ];

  const videoSourcesRegex = [
    /^blog\.twitch\.tv/i,
    /^crackle(\.com)?/i,
    /^curiositystream(\.com)?/i,
    /^d\.tube/i,
    /^dailymotion(\.com)?/i,
    /^dashboard\.twitch\.tv/i,
    /^disneyplus(\.com)?/i,
    /^fast\.wistia\.net/i,
    /^help\.(hulu|netflix)\.com/i,
    /^hulu(\.com)?/i,
    /^id\.twitch\.tv/i,
    /^iq(\.com)?/i,
    /^iqiyi(\.com)?/i,
    /^jobs\.netflix\.com/i,
    /^justin\.tv/i,
    /^m\.(twitch|youtube)\.com/i,
    /^music\.youtube\.com/i,
    /^netflix(\.com)?/i,
    /^player\.(twitch|vimeo)\.com/i,
    /^ted(\.com)?/i,
    /^twitch(\.tv)?/i,
    /^utreon(\.com)?/i,
    /^veoh(\.com)?/i,
    /^viadeo\.journaldunet\.com/i,
    /^vimeo(\.com)?/i,
    /^wistia(\.com)?/i,
    /^youku(\.com)?/i,
    /^youtube(\.com)?/i
  ];

  const combineOperatorEnum = {
    OR: '|',
    AND: ''
  };

  const SEARCH_SOURCES_REGEX = getCombinedRegex(sourceClassificationRegex, combineOperatorEnum.OR, true);
  const SOCIAL_SOURCES_REGEX = getCombinedRegex(socialSourcesRegex, combineOperatorEnum.OR, true);
  const VIDEO_SOURCES_REGEX = getCombinedRegex(videoSourcesRegex, combineOperatorEnum.OR, true);

  /**
   * Combine regex in given list.
   * @param RegexList: RegExp[]                   Regex list to be combined
   * @param operator: combineOperatorEnum         Operator to combine regex list items
   * @param group: boolean                        Add regex list as single group
   * @returns {*}
   */
  function getCombinedRegex(RegexList, operator, group) {
    try {
      let combinedRegex;
      RegexList.forEach((reg) => {
        combinedRegex = combinedRegex == null ? new RegExp(reg.source) : new RegExp(combinedRegex.source + operator + reg.source);
      });
      if (group) {
        combinedRegex = new RegExp('(' + combinedRegex.source + ')$');
      }
      return combinedRegex;
    } catch (ex) {
      console.error('Error combining regex: ' + ex);
    }
  }

  // Set reporting channels to session storage, if not already set.
  if (sessionStorage.getItem(REPORTING_CHANNEL_V2) == null) {
    sessionStorage.setItem(REPORTING_CHANNEL_V2, setChannelGroupingV2());
  }
  if (sessionStorage.getItem(REPORTING_CHANNEL) == null) {
    sessionStorage.setItem(REPORTING_CHANNEL, setChannelGrouping());
  }

  // Definitions version: 202307005
  function setChannelGrouping() {
    try {
      if (isSimplesApp()) return SIMPLES_APP;
      else if (isPushNotification()) return PUSH_NOTIFICATIONS;
      else if (isBrandPaidSearch()) return BRAND_PAID_SEARCH;
      else if (isPaidSearch()) return PAID_SEARCH;
      else if (isAffiliates()) return AFFILIATES;
      else if (isEmailAssist()) return EMAIL_ASSIST;
      else if (isEmail()) return EMAIL;
      else if (isDirect()) return DIRECT;
      else if (isOrganicSearch()) return ORGANIC_SEARCH;
      else if (isSocial()) return SOCIAL;
      else if (isReferral()) return REFERRAL;
      else if (isDisplay()) return DISPLAY;
      else if (isOtherAdvertising()) return OTHER_ADVERTISING;
      else if (isSMS()) return SMS;
      else return '(Other)';
    } catch (err) {
      let errorMsg = 'Error setting channel grouping: ' + err;
      console.error(errorMsg);
      return errorMsg;
    }
  }

  function setChannelGroupingV2() {
    try {
      if (isSimplesAppV2()) return SIMPLES_APP;
      else if (isOffline()) return OFFLINE;
      else if (isCrossNetwork()) return CROSS_NETWORK;
      else if (isAudio()) return AUDIO;
      else if (isPushNotificationV2()) return PUSH_NOTIFICATIONS;
      else if (isSMSV2()) return SMS;
      else if (isEmailAssist()) return EMAIL_ASSIST;
      else if (isEmail()) return EMAIL;
      else if (isAffiliates()) return AFFILIATES;
      else if (isDisplayV2()) return DISPLAY;
      else if (isNative()) return NATIVE;
      else if (isPaidSocial()) return PAID_SOCIAL;
      else if (isPaidVideo()) return PAID_VIDEO;
      else if (isBrandPaidSearch()) return BRAND_PAID_SEARCH;
      else if (isPaidSearch()) return PAID_SEARCH;
      else if (isPaidOther()) return PAID_OTHER;
      else if (isOrganicSocial()) return ORGANIC_SOCIAL;
      else if (isOrganicVideo()) return ORGANIC_VIDEO;
      else if (isOrganicSearchV2()) return ORGANIC_SEARCH;
      else if (isReferralV2()) return REFERRAL;
      else if (isDirect()) return DIRECT;
      else if (isUnattributed()) return UNATTRIBUTED;
      else return 'Unassigned';
    } catch (err) {
      let errorMsg = 'Error setting channel grouping (V2): ' + err;
      console.error(errorMsg);
      return errorMsg;
    }
  }

  // Test/verification notes:

  // utm_source=simplesapp&utm_medium=app&utm_campaign=test%20campaign
  function isSimplesApp() {
    return !!UTM_SOURCE.match(/^simples(fuel|app)$/i) && !!UTM_MEDIUM.match(APP_REGEX);
  }

  // utm_source=simples-app&utm_medium=app&utm_campaign=test%20campaign
  // should be only for reportingChannelv2, reportingChannel might be "Referral"
  function isSimplesAppV2() {
    return !!UTM_SOURCE.match(/^simples.*(fuel|app)$/i) && !!UTM_MEDIUM.match(APP_REGEX);
  }

  // utm_source=test&utm_medium=push_notification&utm_campaign=test
  // should be only for reportingChannel, reportingChannelv2 will be "Unassigned"
  function isPushNotification() {
    return !!UTM_MEDIUM.match(/^push_notification$/i);
  }

  // utm_source=test&utm_medium=push&utm_campaign=test
  // should be only for reportingChannelv2, reportingChannel might be "(Other)"
  function isPushNotificationV2() {
    return !!UTM_MEDIUM.match(/push$/i) || !!UTM_MEDIUM.match(/mobile/i) || !!UTM_SOURCE.match(/^firebase$/i);
  }

  // utm_source=bing&utm_medium=cpc&utm_campaign=bing%20search%20brand%20testing
  function isBrandPaidSearch() {
    return (!!UTM_SOURCE.match(SEARCH_SOURCES_REGEX) || !!LANDING_REFERRER_DOMAIN.match(SEARCH_SOURCES_REGEX))
      && !!UTM_MEDIUM.match(PAID_MARKETING_REGEX)
      && !!UTM_CAMPAIGN.match(SEARCH_REGEX)
      && !!UTM_CAMPAIGN.match(/( |-|_|\+)brand( |-|_|\+)/i);
  }

  // utm_source=google&utm_medium=cpc&utm_campaign=google%20search%20campaign
  function isPaidSearch() {
    return (!!UTM_SOURCE.match(SEARCH_SOURCES_REGEX) || !!LANDING_REFERRER_DOMAIN.match(SEARCH_SOURCES_REGEX))
      && !!UTM_MEDIUM.match(PAID_MARKETING_REGEX)
      && !!UTM_CAMPAIGN.match(SEARCH_REGEX);
  }

  // utm_source=test&utm_medium=affiliate&utm_campaign=test
  function isAffiliates() {
    return !!UTM_MEDIUM.match(/^affiliate$/i) || !!LANDING_FULL_URL.match(/irclickid=/i);
  }

  // utm_source=testsuperquotetest&utm_medium=email&utm_campaign=test
  function isEmailAssist() {
    return (!!UTM_MEDIUM.match(MAIL_REGEX) || !!UTM_SOURCE.match(MAIL_REGEX))
      && (!!UTM_MEDIUM.match(QUOTE_REGEX) || !!UTM_SOURCE.match(QUOTE_REGEX));
  }

  // utm_source=test&utm_medium=email&utm_campaign=test
  function isEmail() {
    return !!UTM_MEDIUM.match(MAIL_REGEX) || !!UTM_SOURCE.match(MAIL_REGEX);
  }

  // manually clear all variables; referrer, utm_medium and utm_source
  function isDirect() {
    return !LANDING_REFERRER_DOMAIN && !UTM_MEDIUM && !UTM_SOURCE;
  }

  // manually set "referrer" as "google.com.au" in sessionStorage and clear all other variables
  function isOrganicSearch() {
    return (!!UTM_SOURCE.match(SEARCH_SOURCES_REGEX)
        || !!LANDING_REFERRER_DOMAIN.match(SEARCH_SOURCES_REGEX)
        || !!UTM_MEDIUM.match(ORGANIC_REGEX)
        || !!UTM_SOURCE.match(CTM_DOMAIN_AU_REGEX)
        || !!LANDING_REFERRER_DOMAIN.match(CTM_DOMAIN_AU_REGEX))
      && !UTM_MEDIUM.match(DISPLAY_AND_MARKETING_REGEX);
  }

  // manually set "referrer" as "google.com.au" in sessionStorage and clear all other variables
  function isOrganicSearchV2() {
    return !!UTM_SOURCE.match(SEARCH_SOURCES_REGEX)
      || !!LANDING_REFERRER_DOMAIN.match(SEARCH_SOURCES_REGEX)
      || !!UTM_MEDIUM.match(ORGANIC_REGEX)
      || !!UTM_SOURCE.match(CTM_DOMAIN_REGEX)
      || !!LANDING_REFERRER_DOMAIN.match(CTM_DOMAIN_REGEX);
  }

  // manually set "referrer" as "linkedin.com" in sessionStorage and clear all other variables
  // should be only for reportingChannel, reportingChannelv2 will be "Organic Social"
  function isSocial() {
    return !!UTM_SOURCE.match(SOCIAL_SOURCES_REGEX)
      || !!LANDING_REFERRER_DOMAIN.match(SOCIAL_SOURCES_REGEX)
      || !!UTM_MEDIUM.match(/(social|video|a13fs)/i)
      || !!UTM_CAMPAIGN.match(VIDEO_REGEX);
  }

  // manually set "referrer" as "ozbargain.com.au" in sessionStorage and clear all other variables
  function isReferral() {
    return ((!!LANDING_REFERRER_DOMAIN && !UTM_MEDIUM && !UTM_SOURCE) || !!UTM_MEDIUM.match(REFERRAL_REGEX))
      && !UTM_SOURCE.match(/(outlook\.live\.com|mail)/i)
      && !UTM_MEDIUM.match(DISPLAY_AND_MARKETING_REGEX);
  }

  // manually set "referrer" as "ozbargain.com.au" in sessionStorage and clear all other variables
  function isReferralV2() {
    return (!!LANDING_REFERRER_DOMAIN && !UTM_MEDIUM && !UTM_SOURCE) || !!UTM_MEDIUM.match(REFERRAL_REGEX);
  }

  // utm_source=test&utm_medium=test&utm_campaign=display
  function isDisplay() {
    return !!UTM_MEDIUM.match(DISPLAY_BANNER_REGEX)
      || !!UTM_CAMPAIGN.match(DISPLAY_REGEX)
      || !!UTM_MEDIUM.match(/native/i);
  }

  // utm_source=test&utm_medium=display&utm_campaign=test
  function isDisplayV2() {
    return !!UTM_MEDIUM.match(DISPLAY_BANNER_REGEX)
      || !!UTM_CAMPAIGN.match(DISPLAY_REGEX);
  }

  // utm_source=test&utm_medium=paid-stuff&utm_campaign=test
  // should be only for reportingChannel, reportingChannelv2 might be "Paid Other"
  function isOtherAdvertising() {
    return !!UTM_MEDIUM.match(PAID_MARKETING_REGEX);
  }

  // utm_source=test&utm_medium=organismsnail&utm_campaign=test
  // should be only for reportingChannel, reportingChannelv2 might be "Unassigned"
  function isSMS() {
    return !!UTM_MEDIUM.match(SMS_REGEX) || !!UTM_SOURCE.match(SMS_REGEX);
  }

  // utm_source=test&utm_medium=sms&utm_campaign=test
  // both reportingChannelv2 and reportingChannel might be "SMS"
  function isSMSV2() {
    return !!UTM_MEDIUM.match(SMS_REGEX_V2) || !!UTM_SOURCE.match(SMS_REGEX_V2);
  }

  // utm_source=test&utm_medium=offline&utm_campaign=test
  // should be only for reportingChannelv2, reportingChannel will be "(Other)"
  function isOffline() {
    return !!UTM_MEDIUM.match(/^offline$/i);
  }

  // utm_source=test&utm_medium=test&utm_campaign=testcross-networktest
  // should be only for reportingChannelv2, reportingChannel will be "(Other)"
  function isCrossNetwork() {
    return !!UTM_CAMPAIGN.match(/cross-network/i);
  }

  // utm_source=test&utm_medium=audio&utm_campaign=test
  // should be only for reportingChannelv2, reportingChannel will be "Display"
  function isAudio() {
    return !!UTM_MEDIUM.match(/^audio$/i);
  }

  // utm_source=test&utm_medium=native&utm_campaign=test
  // should be only for reportingChannelv2, reportingChannel will be "Display"
  function isNative() {
    return !!UTM_MEDIUM.match(/^native$/i);
  }

  // utm_source=facebook&utm_medium=paid-social&utm_campaign=test
  // should be only for reportingChannelv2, reportingChannel will be "Social"
  function isPaidSocial() {
    return (!!UTM_SOURCE.match(SOCIAL_SOURCES_REGEX) || !!LANDING_REFERRER_DOMAIN.match(SOCIAL_SOURCES_REGEX))
      && !!UTM_MEDIUM.match(PAID_MARKETING_REGEX);
  }

  // utm_source=test&utm_medium=paid-stuff&utm_campaign=test
  // AND manually set "referrer" as "youtube.com" in sessionStorage
  // should be only for reportingChannelv2, reportingChannel might be "Other Advertising"
  function isPaidVideo() {
    return (!!UTM_SOURCE.match(VIDEO_SOURCES_REGEX) || !!LANDING_REFERRER_DOMAIN.match(VIDEO_SOURCES_REGEX))
      && !!UTM_MEDIUM.match(PAID_MARKETING_REGEX);
  }

  // utm_source=test&utm_medium=paid-stuff&utm_campaign=test
  // should be only for reportingChannelv2, reportingChannel will be "Other Advertising"
  function isPaidOther() {
    return !!UTM_MEDIUM.match(PAID_MARKETING_REGEX);
  }

  // manually set "referrer" as "lm.facebook.com" in sessionStorage
  // should be only for reportingChannelv2, reportingChannel might be "Social"
  function isOrganicSocial() {
    return !!UTM_SOURCE.match(SOCIAL_SOURCES_REGEX)
      || !!LANDING_REFERRER_DOMAIN.match(SOCIAL_SOURCES_REGEX)
      || !!UTM_MEDIUM.match(SOCIAL_MEDIA_REGEX);
  }

  // manually set "referrer" as "twitch.tv" in sessionStorage
  // should be only for reportingChannelv2, reportingChannel might be "Referral"
  function isOrganicVideo() {
    return !!UTM_SOURCE.match(VIDEO_SOURCES_REGEX)
      || !!LANDING_REFERRER_DOMAIN.match(VIDEO_SOURCES_REGEX)
      || !!UTM_MEDIUM.match(VIDEO_REGEX);
  }

  // utm_source=test&utm_medium=unattributed&utm_campaign=test
  // should be only for reportingChannelv2, reportingChannel will be "(Other)
  function isUnattributed() {
    return !!UTM_MEDIUM.match(/^unattributed$/i);
  }

  function transformedReferrerDomain() {
    const noProtocol = LANDING_REFERRER_DOMAIN_RAW.replace(/(^\w+:|^)\/\//, '');
    const noWww = noProtocol.replace('www.', '');
    let transformed = noWww;
    if (noWww.charAt(noWww.length - 1) === '/') {
      transformed = noWww.slice(0, -1);
    }
    return transformed;
  }
}
