import {
  arrayCleaner,
  setAdvClickId,
  setDeviceCat,
  setQueryParamsAsKvs,
  setReferrer,
  setSessionId,
  xhrPOST
} from '../../../../../src/middlewares/script-injectors/scripts/martech/martech';
import {
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
  vitest
} from 'vitest';

function setUpMock(mockSessionStorage) {
  vi.stubGlobal('sessionStorage', mockSessionStorage);
}

describe('setSessionId_whenSessionValueIsAbsent', () => {
  it('should not find session ID in sessionStorage and set it', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);

    // Call the setSessionId function
    setSessionId();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('sessionID');
    expect(sessionStorage.setItem).toHaveBeenCalled();
  });
});

describe('notSetSessionId_whenSessionValueExists', () => {
  it('should find session ID in sessionStorage and not set it', () => {
    // Create a mock for sessionStorage
    const mockSessionStorage = {
      getItem: vitest.fn().mockReturnValue('exists'),
      setItem: vitest.fn()
    };
    setUpMock(mockSessionStorage);

    // Call the setSessionId function
    setSessionId();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('sessionID');
    expectTypeOf(sessionStorage.getItem).returns.toEqualTypeOf('exists');
    expect(sessionStorage.setItem).toBeCalledTimes(0);
  });
});

describe('setReferrer_whenReferrerIsAbsent', () => {
  it('should not find referrer in sessionStorage and set it', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);
    vi.stubGlobal('document', { referrer: 'https://example.com/some-page' });

    // Call the setSessionId function
    setReferrer();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('referrer');
    expect(sessionStorage.setItem).toHaveBeenCalled();
  });
});

describe('notSetReferrer_whenReferrerExists', () => {
  it('should find referrer in sessionStorage and not set it', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn().mockReturnValue('exists'),
      setItem: vitest.fn()
    };
    setUpMock(store);

    // Call the setSessionId function
    setReferrer();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('referrer');
    expectTypeOf(sessionStorage.getItem).returns.toEqualTypeOf('exists');
    expect(sessionStorage.setItem).toBeCalledTimes(0);
  });
});

describe('setQueryParamsAsKvs_whenQueryParamsExist', () => {
  it('should find query params and set in sessionStorage', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);
    vi.stubGlobal('location', { href: 'https://example.com/some-page?param1=value1&param2=value2' });

    // Call the setSessionId function
    setQueryParamsAsKvs();

    // Expectations
    expect(sessionStorage.setItem).toHaveBeenCalledWith('param1', 'value1');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('param2', 'value2');
  });
});

describe('notSetQueryParamsAsKvs_whenQueryParamsAbsent', () => {
  it('should not find query params and nothing set in sessionStorage', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);
    vi.stubGlobal('location', { href: 'https://example.com/some-page' });

    // Call the setSessionId function
    setQueryParamsAsKvs();

    // Expectations
    expect(sessionStorage.setItem).toBeCalledTimes(0);
  });
});

describe('setAdvClickId_whenClickIdExists', () => {
  it('should find first click ID and set in sessionStorage', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);

    const clickID = ['clickID1', 'clickID2', 'clickID3'];

    // Mock getItem to return values for sessionStorage keys
    sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'clickID1') return 'value1';
      if (key === 'clickID2') return 'value2';
      if (key === 'clickID3') return 'value3';
      return null;
    });

    // Call the function you want to test
    setAdvClickId(clickID);

    // Assertions
    expect(sessionStorage.setItem).toHaveBeenCalledWith('clickID_TYPE', 'clickID1');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('clickID_VALUE', 'value1');
    // Ensure that no further click ID elements are added to session storage after the first match
    expect(sessionStorage.setItem).toHaveBeenCalledTimes(2); // Two calls: TYPE and VALUE
  });
});

describe('arrayCleaner_removesUndefined', () => {
  it('arrayCleaner cleans the data model correctly', () => {
    const dataModel = {
      variable1: 'value1',
      variable2: undefined,
      variable3: 'value3',
      variable4: 'undefined'
    };

    // Call the function you want to test
    const cleanedDataModel = arrayCleaner(dataModel);

    // Assertions
    // Check that undefined and 'undefined' values are removed
    expect(cleanedDataModel).toEqual({
      variable1: 'value1',
      variable3: 'value3'
    });

    // Make sure the original dataModel remains unchanged
    expect(dataModel).toEqual({
      variable1: 'value1',
      variable2: undefined,
      variable3: 'value3',
      variable4: 'undefined'
    });
  });
});

describe('setDeviceCat_forAllDevices', () => {
  // Define the regular expressions for tablet and mobile devices
  const tabletRegex = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i;
  const mobileRegex = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/;

  it('setDeviceCat sets sessionStorage correctly for Desktop', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' });

    // Call the function you want to test
    setDeviceCat(tabletRegex, mobileRegex);

    // Assertions
    expect(sessionStorage.setItem).toHaveBeenCalledWith('deviceCategory', 'Desktop');
  });

  it('setDeviceCat sets sessionStorage correctly for Tablet', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' });

    // Call the function you want to test
    setDeviceCat(tabletRegex, mobileRegex);

    // Assertions
    expect(sessionStorage.setItem).toHaveBeenCalledWith('deviceCategory', 'Tablet');
  });

  it('setDeviceCat sets sessionStorage correctly for Mobile', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148' });

    // Call the function you want to test
    setDeviceCat(tabletRegex, mobileRegex);

    // Assertions
    expect(sessionStorage.setItem).toHaveBeenCalledWith('deviceCategory', 'Mobile');
  });
});

describe('xhrPOST', () => {
  it('should return success', () => {
    // Create a mock for XMLHttpRequest
    const mockXHR = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
      readyState: 4,
      status: 200,
      responseText: JSON.stringify({ message: 'Success' })
    };

    vi.stubGlobal('XMLHttpRequest', vi.fn(() => mockXHR));

    // Define the URL and payload
    const url = 'https://example.com/api';
    const payload = { data: 'testData' };

    // Call the function you want to test
    xhrPOST(url, payload);

    // Assertions
    // Check that XMLHttpRequest was created and configured correctly
    expect(XMLHttpRequest).toHaveBeenCalledTimes(1);
    expect(XMLHttpRequest.mock.results[0].value.status).toEqual(200);
  });
});