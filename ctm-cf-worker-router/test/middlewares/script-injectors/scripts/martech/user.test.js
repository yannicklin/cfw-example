import { describe, expect, it, vi, vitest } from 'vitest';
import {
  generateGuid,
  setAnonId,
  setCookieVal,
  setUserId
} from '../../../../../src/middlewares/script-injectors/scripts/martech/user';

function setUpMock(mockSessionStorage) {
  vi.stubGlobal('sessionStorage', mockSessionStorage);
}

describe('generateGuid', () => {
  it('should create GUID values correctly', () => {

    // Call the generateGuid function to generate a GUID
    const guid = generateGuid();

    // Write assertions to validate the format of the generated GUID
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(guid).toMatch(guidRegex);
  });
});

describe('setCookieVal', () => {
  it('should create cookie correctly', () => {
    // Mock document.cookie
    vi.stubGlobal('document', { cookie: '' });
    vi.stubGlobal('window', { location: { hostname: 'random.com' } });
    // Call the setCookieVal function with a key and value
    setCookieVal('testKey', 'testValue');

    const cookies = document.cookie.split('; ');
    let cookieFound = false;

    for (const cookie of cookies) {
      if (cookie === 'testKey=testValue') {
        cookieFound = true;
        break;
      }
    }
    // Assert that the cookie was found
    expect(cookieFound).toBe(true);
  });
});

describe('setUserId_whenInCookieAndNotSession', () => {
  it('should create userId in session storage', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);
    // Mock document.cookie
    vi.stubGlobal('document', { cookie: 'user_id=123456' });

    setUserId();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('user_id');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('user_id', '123456');
  });
});

describe('setAnonId_doNothingWhenExistsInSession', () => {
  it('should do nothing', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn().mockReturnValue('01098b64-a1c5-4f2c-a555-5422966dc7e0'),
      setItem: vitest.fn()
    };
    setUpMock(store);
    // Mock document.cookie
    vi.stubGlobal('document', { cookie: '' });

    setAnonId();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('user_anonymous_id');
    expect(sessionStorage.setItem).toBeCalledTimes(0);
  });
});

describe('setAnonId_setInSessionWhenCookieExists', () => {
  it('should set value in session storage', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);
    // Mock document.cookie
    vi.stubGlobal('document', { cookie: 'user_anonymous_id=dc12eaa9-0836-45e7-b9cc-090f276c3f31.1695956055921' });

    setAnonId();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('user_anonymous_id');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('user_anonymous_id', 'dc12eaa9-0836-45e7-b9cc-090f276c3f31');
  });
});

describe('setAnonId_usingServerValue_whenNoCookie', () => {
  it('should set value in cookie and session storage', () => {
    // Create a mock for sessionStorage
    const store = {
      getItem: vitest.fn(),
      setItem: vitest.fn()
    };
    setUpMock(store);
    // Mock document.cookie
    vi.stubGlobal('document', { cookie: '' });

    setAnonId();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('user_anonymous_id');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('user_anonymous_id', '$SERVER_ANON_ID');
    expect(document.cookie.includes('user_anonymous_id')).toBeFalsy();
  });
});