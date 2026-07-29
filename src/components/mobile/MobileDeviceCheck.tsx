// Mobile Device Check Component - Enhanced mobile device checking interface
import React, { useState, useEffect } from 'react';
import { QRScanner } from './QRScanner';
import { NFCReader } from './NFCReader';
import { mobileIntegrationService, MobileCapabilities } from '../../services/MobileIntegrationService';

interface MobileDeviceCheckProps {
  onDeviceIdentified: (identifier: string, method: string) => void;
  onLocationUpdate: (location: any) => void;
}

export const MobileDeviceCheck: React.FC<MobileDeviceCheckProps> = ({
  onDeviceIdentified,
  onLocationUpdate
}) => {
  const [capabilities, setCapabilities] = useState<MobileCapabilities | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNFCReader, setShowNFCReader] = useState(false);
  const [sensorData, setSensorData] = useState<any>(null);
  const [locationTracking, setLocationTracking] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    initializeMobileFeatures();
  }, []);

  const initializeMobileFeatures = async () => {
    try {
      // Detect device capabilities
      const caps = await mobileIntegrationService.detectCapabilities();
      setCapabilities(caps);

      // Get sensor data
      const sensors = await mobileIntegrationService.getDeviceSensorData();
      setSensorData(sensors);

      // Request permissions
      const perms = await mobileIntegrationService.requestPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Mobile initialization error:', error);
    }
  };

  const handleQRScan = (data: string) => {
    onDeviceIdentified(data, 'qr_scan');

    // Vibrate on successful scan
    mobileIntegrationService.vibrate(200);

    // Show notification
    mobileIntegrationService.showNotification('Device Scanned', {
      body: `Successfully scanned: ${data}`,
      icon: '/favicon.ico',
    });
  };

  const handleNFCRead = (data: any) => {
    const identifier = data.serialNumber || JSON.stringify(data);
    onDeviceIdentified(identifier, 'nfc_read');

    // Vibrate on successful read
    mobileIntegrationService.vibrate([100, 50, 100]);
  };

  const startLocationTracking = () => {
    if (!capabilities?.hasGPS) {
      alert('GPS not available on this device');
      return;
    }

    setLocationTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
          method: 'gps_mobile',
        };

        onLocationUpdate(location);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Stop tracking after 30 seconds
    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      setLocationTracking(false);
    }, 30000);
  };

  if (!capabilities) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Detecting device capabilities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Capabilities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📱 Mobile Device Features</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className={`flex items-center ${capabilities.hasCamera ? 'text-green-600' : 'text-gray-400'}`}>
            📷 Camera: {capabilities.hasCamera ? 'Available' : 'Not Available'}
          </div>
          <div className={`flex items-center ${capabilities.hasGPS ? 'text-green-600' : 'text-gray-400'}`}>
            🌍 GPS: {capabilities.hasGPS ? 'Available' : 'Not Available'}
          </div>
          <div className={`flex items-center ${capabilities.hasNFC ? 'text-green-600' : 'text-gray-400'}`}>
            📡 NFC: {capabilities.hasNFC ? 'Available' : 'Not Available'}
          </div>
          <div className={`flex items-center ${capabilities.hasVibration ? 'text-green-600' : 'text-gray-400'}`}>
            📳 Vibration: {capabilities.hasVibration ? 'Available' : 'Not Available'}
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">
            <div>Platform: {capabilities.platform}</div>
            <div>Browser: {capabilities.browserName}</div>
            <div>OS: {capabilities.osVersion}</div>
            <div>Type: {capabilities.isMobile ? 'Mobile' : capabilities.isTablet ? 'Tablet' : 'Desktop'}</div>
          </div>
        </div>
      </div>

      {/* Device Identification Methods */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🔍 Device Identification</h3>

        <div className="space-y-3">
          {capabilities.hasCamera && (
            <button
              onClick={() => setShowQRScanner(true)}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📷 Scan QR Code
            </button>
          )}

          {capabilities.hasNFC && (
            <button
              onClick={() => setShowNFCReader(true)}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              📡 Read NFC Tag
            </button>
          )}

          <button
            onClick={() => {
              const input = prompt('Enter device identifier (IMEI, Serial, etc.):');
              if (input?.trim()) {
                onDeviceIdentified(input.trim(), 'manual_entry');
              }
            }}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            ⌨️ Manual Entry
          </button>
        </div>
      </div>

      {/* Location Tracking */}
      {capabilities.hasGPS && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🌍 Location Tracking</h3>

          <div className="space-y-3">
            <button
              onClick={startLocationTracking}
              disabled={locationTracking}
              className={`w-full px-4 py-3 rounded-lg font-medium ${
                locationTracking
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {locationTracking ? '📍 Tracking Location...' : '📍 Start Location Tracking'}
            </button>

            {locationTracking && (
              <div className="text-sm text-gray-600 text-center">
                High-accuracy GPS tracking active for 30 seconds
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sensor Data */}
      {sensorData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Device Sensors</h3>

          <div className="space-y-2 text-sm">
            {sensorData.battery && (
              <div className="flex justify-between">
                <span>Battery Level:</span>
                <span className={sensorData.battery.level < 0.2 ? 'text-red-600' : 'text-green-600'}>
                  {Math.round(sensorData.battery.level * 100)}%
                  {sensorData.battery.charging && ' (Charging)'}
                </span>
              </div>
            )}

            {sensorData.network && (
              <div className="flex justify-between">
                <span>Connection:</span>
                <span>{sensorData.network.effectiveType || 'Unknown'}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Online Status:</span>
              <span className={mobileIntegrationService.isOnline() ? 'text-green-600' : 'text-red-600'}>
                {mobileIntegrationService.isOnline() ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Status */}
      {permissions && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🔐 Permissions</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Camera:</span>
              <span className={permissions.camera ? 'text-green-600' : 'text-red-600'}>
                {permissions.camera ? 'Granted' : 'Denied'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className={permissions.location ? 'text-green-600' : 'text-red-600'}>
                {permissions.location ? 'Granted' : 'Denied'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Notifications:</span>
              <span className={permissions.notifications ? 'text-green-600' : 'text-red-600'}>
                {permissions.notifications ? 'Granted' : 'Denied'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onError={(error) => alert(`QR Scan Error: ${error}`)}
        onClose={() => setShowQRScanner(false)}
      />

      {/* NFC Reader Modal */}
      <NFCReader
        isOpen={showNFCReader}
        onRead={handleNFCRead}
        onError={(error) => alert(`NFC Read Error: ${error}`)}
        onClose={() => setShowNFCReader(false)}
      />
    </div>
  );
};