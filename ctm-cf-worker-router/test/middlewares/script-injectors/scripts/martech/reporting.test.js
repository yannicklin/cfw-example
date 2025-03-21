import { beforeAll, describe, expect, it, vi, vitest } from 'vitest';
import { setAllReportingChannels } from '../../../../../src/middlewares/script-injectors/scripts/martech/reporting';

beforeAll(() => {
  // Create a mock for sessionStorage
  const store = {
    getItem: vitest.fn(),
    setItem: vitest.fn()
  };
  vi.stubGlobal('sessionStorage', store);
});

describe('setAllReportingChannels_whenSimplesAppExists', () => {
  it('should find UTM vars in sessionStorage and set values correctly', () => {

    // Mock getItem to return values for sessionStorage keys
    sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'utm_source') return 'simplesfuel';
      if (key === 'utm_medium') return 'app';
      if (key === 'reportingChannel') return null;
      if (key === 'reportingChannelV2') return null;
      return '';
    });

    // Call the setAllReportingChannels function
    setAllReportingChannels();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('utm_source');
    expect(sessionStorage.getItem).toHaveBeenCalledWith('utm_medium');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('reportingChannelV2', 'Simples App');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('reportingChannel', 'Simples App');
  });
});

describe('setAllReportingChannels_whenPushNotificationExists', () => {
  it('should find UTM vars in sessionStorage and set values correctly', () => {

    // Mock getItem to return values for sessionStorage keys
    sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'utm_medium') return 'push_notification';
      if (key === 'reportingChannel') return null;
      if (key === 'reportingChannelV2') return null;
      return '';
    });

    // Call the setAllReportingChannels function
    setAllReportingChannels();

    // Expectations
    expect(sessionStorage.getItem).toHaveBeenCalledWith('utm_medium');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('reportingChannelV2', 'Unassigned');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('reportingChannel', 'Push Notifications');
  });
});