// Device Fingerprint Service - Advanced device identification
export interface DeviceFingerprint {
  browserFingerprint: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  canvas: string;
  webgl: string;
  fonts: string[];
  plugins: string[];
  timestamp: Date;
}

export interface NetworkInfo {
  ipAddress?: string;
  connectionType?: string;
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
}

export class DeviceFingerprintService {
  private static instance: DeviceFingerprintService;

  static getInstance(): DeviceFingerprintService {
    if (!DeviceFingerprintService.instance) {
      DeviceFingerprintService.instance = new DeviceFingerprintService();
    }
    return DeviceFingerprintService.instance;
  }

  // Generate comprehensive device fingerprint
  async generateFingerprint(): Promise<DeviceFingerprint> {
    const hasWindow = typeof window !== 'undefined';
    const hasNavigator = typeof navigator !== 'undefined';
    const hasScreen = typeof screen !== 'undefined';

    const fingerprint: DeviceFingerprint = {
      browserFingerprint: '',
      userAgent: hasNavigator ? navigator.userAgent : 'unknown',
      screenResolution: hasScreen ? `${screen.width}x${screen.height}x${(screen as any).colorDepth ?? '0'}` : '0x0x0',
      timezone: hasWindow ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
      language: hasNavigator ? navigator.language : 'en',
      platform: hasNavigator ? navigator.platform : 'unknown',
      cookieEnabled: hasNavigator ? navigator.cookieEnabled : false,
      doNotTrack: hasNavigator ? (navigator as any).doNotTrack ?? null : null,
      canvas: await this.getCanvasFingerprint(),
      webgl: await this.getWebGLFingerprint(),
      fonts: await this.getAvailableFonts(),
      plugins: this.getPlugins(),
      timestamp: new Date()
    };

    // Generate hash of all components
    fingerprint.browserFingerprint = await this.hashFingerprint(fingerprint);

    return fingerprint;
  }

  // Get MAC address (limited by browser security)
  async getMACAddress(): Promise<string | null> {
    try {
      // Modern browsers don't expose MAC addresses for privacy
      // This is a placeholder for potential future APIs or native app integration
      
      // For web browsers, we'll use a combination of network timing and other factors
      // to create a pseudo-MAC identifier
      const networkTiming = await this.getNetworkTiming();
      const hardwareInfo = this.getHardwareInfo();
      
      // Create a pseudo-MAC from available data
      const pseudoMAC = await this.generatePseudoMAC(networkTiming, hardwareInfo);
      return pseudoMAC;
    } catch (error) {
      console.warn('MAC address not available:', error);
      return null;
    }
  }

  // Get network information
  async getNetworkInfo(): Promise<NetworkInfo> {
    const networkInfo: NetworkInfo = {};

    try {
      // Get IP address from external service (fallback)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      networkInfo.ipAddress = ipData.ip;
    } catch (error) {
      console.warn('Could not fetch IP address:', error);
    }

    // Get connection information if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      networkInfo.connectionType = connection.type;
      networkInfo.downlink = connection.downlink;
      networkInfo.effectiveType = connection.effectiveType;
      networkInfo.rtt = connection.rtt;
    }

    return networkInfo;
  }

  // Generate canvas fingerprint
  private async getCanvasFingerprint(): Promise<string> {
    try {
      if (typeof document === 'undefined') return 'canvas-not-supported';
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return 'canvas-not-supported';

      // Draw unique pattern
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device Check 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Security Fingerprint', 4, 45);

      // Get image data
      const imageData = canvas.toDataURL();
      return await this.simpleHash(imageData);
    } catch {
      return 'canvas-error';
    }
  }

  // Generate WebGL fingerprint
  private async getWebGLFingerprint(): Promise<string> {
    try {
      if (typeof document === 'undefined') return 'webgl-not-supported';
      const canvas: HTMLCanvasElement = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') as WebGLRenderingContext | null) 
        || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
      
      if (!gl) return 'webgl-not-supported';

      const debugInfo: any = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL as number) : 'unknown';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL as number) : 'unknown';

      return await this.simpleHash(`${vendor}|${renderer}`);
    } catch {
      return 'webgl-error';
    }
  }

  // Get available fonts (limited detection)
  private async getAvailableFonts(): Promise<string[]> {
    if (typeof document === 'undefined' || !document.body) {
      return [];
    }

    const testFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact', 'Calibri', 'Cambria'
    ];

    const availableFonts: string[] = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const baseFonts = ['monospace', 'sans-serif', 'serif'];

    // Create test element
    const span = document.createElement('span');
    span.style.fontSize = testSize;
    span.style.position = 'absolute';
    span.style.left = '-9999px';
    span.innerHTML = testString;
    document.body.appendChild(span);

    // Get baseline measurements
    const baselines: { [key: string]: { width: number; height: number } } = {};
    for (const baseFont of baseFonts) {
      span.style.fontFamily = baseFont;
      baselines[baseFont] = {
        width: span.offsetWidth,
        height: span.offsetHeight
      };
    }

    // Test each font
    for (const font of testFonts) {
      let detected = false;
      for (const baseFont of baseFonts) {
        span.style.fontFamily = `${font}, ${baseFont}`;
        const dimensions = {
          width: span.offsetWidth,
          height: span.offsetHeight
        };
        
        if (dimensions.width !== baselines[baseFont].width || 
            dimensions.height !== baselines[baseFont].height) {
          detected = true;
          break;
        }
      }
      
      if (detected) {
        availableFonts.push(font);
      }
    }

    document.body.removeChild(span);
    return availableFonts;
  }

  // Get browser plugins
  private getPlugins(): string[] {
    const plugins: string[] = [];
    if (typeof navigator === 'undefined' || !navigator.plugins) return plugins;

    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push(plugin.name);
    }

    return plugins.sort();
  }

  // Get network timing for pseudo-MAC generation
  private async getNetworkTiming(): Promise<number[]> {
    const timings: number[] = [];
    
    try {
      // Measure network timing to various endpoints
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://www.cloudflare.com/favicon.ico'
      ];

      for (const endpoint of endpoints) {
        const start = performance.now();
        try {
          await fetch(endpoint, { mode: 'no-cors', cache: 'no-cache' });
        } catch {
          // Ignore errors, we just want timing
        }
        const end = performance.now();
        timings.push(end - start);
      }
    } catch {
      // Fallback timing
      timings.push(Math.random() * 100);
    }

    return timings;
  }

  // Get hardware information
  private getHardwareInfo(): any {
    const hasNavigator = typeof navigator !== 'undefined';
    return {
      cores: hasNavigator ? navigator.hardwareConcurrency || 1 : 1,
      memory: hasNavigator ? (navigator as any).deviceMemory || 0 : 0,
      maxTouchPoints: hasNavigator ? navigator.maxTouchPoints || 0 : 0,
      vendor: hasNavigator ? navigator.vendor : 'unknown',
      product: hasNavigator ? (navigator as any).product || '' : '',
      buildID: hasNavigator ? (navigator as any).buildID || '' : ''
    };
  }

  // Generate pseudo-MAC address
  private async generatePseudoMAC(networkTiming: number[], hardwareInfo: any): Promise<string> {
    const hasScreen = typeof screen !== 'undefined';
    const data = JSON.stringify({
      timing: networkTiming,
      hardware: hardwareInfo,
      screen: hasScreen ? `${screen.width}x${screen.height}` : '0x0',
      timezone: new Date().getTimezoneOffset()
    });

    const hash = await this.simpleHash(data);
    
    // Format as MAC-like address
    const macLike = hash.substring(0, 12).match(/.{2}/g)?.join(':') || '00:00:00:00:00:00';
    return macLike.toUpperCase();
  }

  // Hash fingerprint components
  private async hashFingerprint(fingerprint: Partial<DeviceFingerprint>): Promise<string> {
    const data = JSON.stringify({
      userAgent: fingerprint.userAgent,
      screen: fingerprint.screenResolution,
      timezone: fingerprint.timezone,
      language: fingerprint.language,
      platform: fingerprint.platform,
      canvas: fingerprint.canvas,
      webgl: fingerprint.webgl,
      fonts: fingerprint.fonts?.join(','),
      plugins: fingerprint.plugins?.join(',')
    });

    return await this.simpleHash(data);
  }

  // Simple hash function (for browsers without crypto.subtle)
  private async simpleHash(str: string): Promise<string> {
    try {
      // Try to use Web Crypto API if available
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch {
      // Fallback to simple hash
    }

    // Fallback hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Get comprehensive device information for security
  async getSecurityMetadata(): Promise<any> {
    const fingerprint = await this.generateFingerprint();
    const networkInfo = await this.getNetworkInfo();
    const macAddress = await this.getMACAddress();

    return {
      fingerprint,
      networkInfo,
      macAddress,
      timestamp: new Date(),
      sessionId: this.generateSessionId(),
      riskFactors: this.assessRiskFactors(fingerprint)
    };
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Assess risk factors based on fingerprint
  private assessRiskFactors(fingerprint: DeviceFingerprint): string[] {
    const risks: string[] = [];

    // Check for common spoofing indicators
    if (fingerprint.userAgent.includes('HeadlessChrome')) {
      risks.push('headless_browser');
    }

    if (fingerprint.plugins.length === 0) {
      risks.push('no_plugins');
    }

    if (fingerprint.fonts.length < 5) {
      risks.push('limited_fonts');
    }

    if (fingerprint.canvas === 'canvas-error' || fingerprint.webgl === 'webgl-error') {
      risks.push('rendering_disabled');
    }

    return risks;
  }
}

// Export singleton instance
export const deviceFingerprintService = DeviceFingerprintService.getInstance();