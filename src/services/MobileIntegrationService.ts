// MobileIntegrationService - Provides mobile/web capabilities used by device check components
// This is a lightweight implementation that detects capabilities and offers
// basic integrations. Advanced QR scanning requires an external library.

export interface MobileCapabilities {
  hasCamera: boolean;
  hasGPS: boolean;
  hasNFC: boolean;
  hasVibration: boolean;
  platform: string;
  browserName: string;
  osVersion: string;
  isMobile: boolean;
  isTablet: boolean;
}

export interface QRScanResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface NFCReadResult {
  success: boolean;
  data?: any;
  error?: string;
}

class MobileIntegrationService {
  async detectCapabilities(): Promise<MobileCapabilities> {
    const navAny = navigator as any;
    const ua = navigator.userAgent || '';
    const platform = navAny.platform || '';
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasGPS = 'geolocation' in navigator;
    const hasNFC = typeof (window as any).NDEFReader !== 'undefined';
    const hasVibration = 'vibrate' in navigator;

    const isMobile = /Mobi|Android/i.test(ua);
    const isTablet = /Tablet|iPad/i.test(ua);

    // Simple browser/OS detection
    const browserName = (() => {
      if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
      if (/Edg\//.test(ua)) return 'Edge';
      if (/Firefox\//.test(ua)) return 'Firefox';
      if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
      return 'Unknown';
    })();

    const osVersion = (() => {
      const androidMatch = ua.match(/Android\s([\d.]+)/i);
      if (androidMatch) return `Android ${androidMatch[1]}`;
      const iosMatch = ua.match(/iPhone OS\s([\d_]+)/i);
      if (iosMatch) return `iOS ${iosMatch[1].replace(/_/g, '.')}`;
      const ipadMatch = ua.match(/iPad.*OS\s([\d_]+)/i);
      if (ipadMatch) return `iPadOS ${ipadMatch[1].replace(/_/g, '.')}`;
      return platform || 'Unknown';
    })();

    return {
      hasCamera,
      hasGPS,
      hasNFC,
      hasVibration,
      platform,
      browserName,
      osVersion,
      isMobile,
      isTablet,
    };
  }

  async getDeviceSensorData(): Promise<any> {
    const data: any = {};

    // Battery status API (not supported in all browsers)
    try {
      const navAny = navigator as any;
      if (navAny.getBattery) {
        const battery = await navAny.getBattery();
        data.battery = {
          level: battery.level,
          charging: battery.charging,
        };
      }
    } catch {
      // ignore
    }

    // Network information API
    try {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        data.network = {
          effectiveType: connection.effectiveType,
          type: connection.type,
          downlink: connection.downlink,
          rtt: connection.rtt,
        };
      }
    } catch {
      // ignore
    }

    return data;
  }

  async requestPermissions(): Promise<{ camera: boolean; location: boolean; notifications: boolean }> {
    const result = { camera: false, location: false, notifications: false };

    try {
      const permsAny = (navigator as any).permissions;
      if (permsAny && permsAny.query) {
        try {
          const cam = await permsAny.query({ name: 'camera' as any });
          result.camera = cam?.state === 'granted';
        } catch {
          // Some browsers don’t support 'camera' permission query
        }
        try {
          const geo = await permsAny.query({ name: 'geolocation' as any });
          result.location = geo?.state === 'granted';
        } catch {
          // ignore
        }
        result.notifications = Notification.permission === 'granted';
      } else {
        // Fallback checks
        result.location = 'geolocation' in navigator;
        result.camera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        result.notifications = Notification.permission === 'granted';
      }

      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        result.notifications = permission === 'granted';
      }
    } catch {
      // ignore
    }

    return result;
  }

  vibrate(pattern: number | number[]) {
    try {
      if ('vibrate' in navigator) {
        (navigator as any).vibrate(pattern);
      }
    } catch {
      // ignore
    }
  }

  showNotification(title: string, options?: NotificationOptions) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
      }
    } catch {
      // ignore
    }
  }

  isStandalone(): boolean {
    try {
      return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    } catch {
      return false;
    }
  }

  getDeviceMemory(): number | null {
    try {
      return (navigator as any).deviceMemory ?? null;
    } catch {
      return null;
    }
  }

  getHardwareConcurrency(): number | null {
    try {
      return navigator.hardwareConcurrency ?? null;
    } catch {
      return null;
    }
  }

  getConnectionType(): string | undefined {
    try {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      return connection?.effectiveType || connection?.type;
    } catch {
      return undefined;
    }
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  async scanQRCode(): Promise<QRScanResult> {
    // Placeholder implementation: integrate a QR library (e.g., html5-qrcode) for real scanning
    try {
      const qrReaderEl = document.getElementById('qr-reader');
      if (!qrReaderEl) {
        return { success: false, error: 'QR reader element not found' };
      }

      // If a QR library is attached to window, you can wire it here
      const Html5Qrcode = (window as any).Html5Qrcode;
      if (Html5Qrcode) {
        try {
          const qrCode = new Html5Qrcode('qr-reader');
          const data = await new Promise<string>((resolve, reject) => {
            qrCode.start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText: string) => {
                qrCode.stop().then(() => resolve(decodedText)).catch(() => resolve(decodedText));
              },
              () => {}
            ).catch(reject);
          });
          return { success: true, data };
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : 'QR scanning failed' };
        }
      }

      return { success: false, error: 'QR scanning not implemented in this build' };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'QR scanning failed' };
    }
  }

  async readNFC(): Promise<NFCReadResult> {
    try {
      const NDEFReader = (window as any).NDEFReader;
      if (!NDEFReader) {
        return { success: false, error: 'Web NFC not supported' };
      }

      const reader = new NDEFReader();
      await reader.scan();

      return new Promise<NFCReadResult>((resolve) => {
        (reader as any).onreading = (event: any) => {
          try {
            const serialNumber = event.serialNumber;
            const records = event.message?.records?.map((record: any) => ({
              recordType: record.recordType,
              mediaType: record.mediaType,
              data: record.data,
            })) || [];
            resolve({ success: true, data: { serialNumber, records } });
          } catch {
            resolve({ success: false, error: 'Failed to parse NFC data' });
          }
        };

        (reader as any).onerror = () => {
          resolve({ success: false, error: 'NFC read error' });
        };
      });
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'NFC reading failed' };
    }
  }
}

export const mobileIntegrationService = new MobileIntegrationService();