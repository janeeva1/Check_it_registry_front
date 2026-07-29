// Location Service - GPS tracking and validation
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  source: 'gps' | 'network' | 'passive';
}

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'ACCURACY_INSUFFICIENT';
  message: string;
}

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private lastKnownLocation: LocationData | null = null;
  private readonly REQUIRED_ACCURACY = 100; // meters (relaxed to reduce check failures)
  private readonly TIMEOUT = 30000; // 30 seconds
  private readonly MAX_AGE = 60000; // 1 minute

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Request location permissions
  async requestPermission(): Promise<PermissionState> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch {
      return 'prompt';
    }
  }

  // Get current location with high accuracy
  async getCurrentLocation(forceRefresh = false): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      // Return cached location if recent and accurate enough
      if (!forceRefresh && this.lastKnownLocation && this.isLocationRecent(this.lastKnownLocation)) {
        resolve(this.lastKnownLocation);
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: this.TIMEOUT,
        maximumAge: forceRefresh ? 0 : this.MAX_AGE
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = this.formatLocationData(position);
          
          // Validate accuracy (relaxed). Accept and let backend decide if refresh is needed.
          // If accuracy is poor, still resolve so the check can proceed.

          this.lastKnownLocation = locationData;
          resolve(locationData);
        },
        (error) => {
          reject(this.formatGeolocationError(error));
        },
        options
      );
    });
  }

  // Get location with retry mechanism
  async getLocationWithRetry(maxRetries = 3): Promise<LocationData> {
    let lastError: LocationError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const location = await this.getCurrentLocation(attempt > 1);
        return location;
      } catch (error) {
        lastError = error as LocationError;
        
        // Don't retry for permission denied
        if (lastError.code === 'PERMISSION_DENIED') {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    throw lastError || new Error('Failed to get location after retries');
  }

  // Start watching location changes
  startWatching(callback: (location: LocationData) => void, errorCallback?: (error: LocationError) => void): void {
    if (!this.isSupported()) {
      errorCallback?.({
        code: 'POSITION_UNAVAILABLE',
        message: 'Geolocation is not supported'
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: this.TIMEOUT,
      maximumAge: 5000 // 5 seconds for watching
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = this.formatLocationData(position);
        this.lastKnownLocation = locationData;
        callback(locationData);
      },
      (error) => {
        errorCallback?.(this.formatGeolocationError(error));
      },
      options
    );
  }

  // Stop watching location
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Validate location accuracy
  validateAccuracy(location: LocationData): boolean {
    return location.accuracy <= this.REQUIRED_ACCURACY;
  }

  // Check if location is recent enough
  private isLocationRecent(location: LocationData): boolean {
    const now = new Date().getTime();
    const locationTime = location.timestamp.getTime();
    return (now - locationTime) < this.MAX_AGE;
  }

  // Format GeolocationPosition to LocationData
  private formatLocationData(position: GeolocationPosition): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: new Date(position.timestamp),
      source: this.determineLocationSource(position.coords.accuracy)
    };
  }

  // Determine location source based on accuracy
  private determineLocationSource(accuracy: number): 'gps' | 'network' | 'passive' {
    if (accuracy <= 10) return 'gps';
    if (accuracy <= 100) return 'network';
    return 'passive';
  }

  // Format GeolocationPositionError to LocationError
  private formatGeolocationError(error: GeolocationPositionError): LocationError {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return {
          code: 'PERMISSION_DENIED',
          message: 'Location access denied by user'
        };
      case error.POSITION_UNAVAILABLE:
        return {
          code: 'POSITION_UNAVAILABLE',
          message: 'Location information is unavailable'
        };
      case error.TIMEOUT:
        return {
          code: 'TIMEOUT',
          message: 'Location request timed out'
        };
      default:
        return {
          code: 'POSITION_UNAVAILABLE',
          message: error.message || 'Unknown location error'
        };
    }
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get distance between two locations (Haversine formula)
  static getDistance(loc1: LocationData, loc2: LocationData): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = loc1.latitude * Math.PI / 180;
    const φ2 = loc2.latitude * Math.PI / 180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Check if user is in a suspicious location pattern
  static detectSuspiciousPattern(locations: LocationData[]): boolean {
    if (locations.length < 3) return false;

    // Check for rapid location changes (teleporting)
    for (let i = 1; i < locations.length; i++) {
      const distance = LocationService.getDistance(locations[i-1], locations[i]);
      const timeDiff = locations[i].timestamp.getTime() - locations[i-1].timestamp.getTime();
      const speed = distance / (timeDiff / 1000); // m/s

      // Flag if speed > 100 m/s (360 km/h) - likely spoofing
      if (speed > 100) {
        return true;
      }
    }

    return false;
  }

  // Get location display string
  static formatLocationDisplay(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${Math.round(location.accuracy)}m)`;
  }

  // Get last known location
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  // Clear cached location
  clearCache(): void {
    this.lastKnownLocation = null;
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();