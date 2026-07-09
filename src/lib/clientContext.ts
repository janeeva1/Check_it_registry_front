export async function getPublicIP(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return json?.ip || null;
  } catch {
    return null;
  }
}

export type GeoLocation = { latitude: number; longitude: number; accuracy?: number };

export async function getLocation(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        reject(new Error(err.message || 'Failed to get location'));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getPseudoMac(): Promise<string> {
  const ua = navigator.userAgent || '';
  const platform = (navigator as any).platform || '';
  const language = navigator.language || '';
  const languages = (navigator.languages || []).join(',');
  const width = window.screen?.width || 0;
  const height = window.screen?.height || 0;
  const colorDepth = window.screen?.colorDepth || 0;
  const pixelRatio = (window.devicePixelRatio || 1).toString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const touchSupport = ('ontouchstart' in window).toString();
  const hwConcurrency = (navigator as any).hardwareConcurrency || 0;
  const deviceMemory = (navigator as any).deviceMemory || 0;

  let webglInfo = '';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (gl) {
      const ext = (gl as any).getExtension('WEBGL_debug_renderer_info');
      const vendor = ext ? (gl as any).getParameter(ext.UNMASKED_VENDOR_WEBGL) : '';
      const renderer = ext ? (gl as any).getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
      webglInfo = `${vendor}|${renderer}`;
    }
  } catch { /* WebGL context may not be available */ }

  const raw = [
    ua,
    platform,
    language,
    languages,
    width,
    height,
    colorDepth,
    pixelRatio,
    timezone,
    touchSupport,
    hwConcurrency,
    deviceMemory,
    webglInfo,
  ].join('|');

  try {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(raw));
    const hex = toHex(digest).slice(0, 12);
    return hex.match(/.{1,2}/g)?.join(':') || hex; // format like MAC
  } catch {
    const fallback = raw.length.toString(16).padStart(12, '0');
    return fallback.match(/.{1,2}/g)?.join(':') || fallback;
  }
}

export async function buildCheckHeaders() {
  const [ip, location, pseudoMac] = await Promise.all([
    getPublicIP(),
    getLocation(),
    getPseudoMac(),
  ]);

  const headers: Record<string, string> = {
    'x-mac-address': pseudoMac,
    'x-location-lat': String(location.latitude),
    'x-location-lon': String(location.longitude),
    'x-location-accuracy': location.accuracy != null ? String(location.accuracy) : '0',
  };

  if (ip) {
    headers['X-Forwarded-For'] = ip;
  }

  return headers;
}