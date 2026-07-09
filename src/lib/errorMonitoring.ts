// Lightweight runtime error monitoring to aid debugging blank pages
// Attaches global listeners for errors and unhandled promise rejections,
// logs them to console and stores the latest in localStorage for inspection.

type SerializedError = {
  message: string;
  stack?: string;
  source?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: string;
};

function serializeError(err: any): SerializedError {
  const e = err instanceof Error ? err : new Error(String(err));
  return {
    message: e.message,
    stack: e.stack,
    timestamp: new Date().toISOString(),
  };
}

function saveLastError(payload: SerializedError) {
  try {
    localStorage.setItem('last_runtime_error', JSON.stringify(payload));
  } catch { /* localStorage may be full or disabled */ }
}

export function initErrorMonitoring() {
  // Avoid double-initialization
  if ((window as any).__errorMonitoringInitialized) return;
  (window as any).__errorMonitoringInitialized = true;

  window.addEventListener('error', (event) => {
    const payload: SerializedError = {
      message: event.message || 'Unknown window error',
      filename: (event as any).filename,
      lineno: (event as any).lineno,
      colno: (event as any).colno,
      source: 'window.onerror',
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
    };
    // Console log for immediate visibility during dev
    console.error('[Runtime Error]', payload);
    saveLastError(payload);
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const payload: SerializedError = {
      ...serializeError(event.reason),
      source: 'unhandledrejection',
      timestamp: new Date().toISOString(),
    };
    console.error('[Unhandled Rejection]', payload);
    saveLastError(payload);
  });
}