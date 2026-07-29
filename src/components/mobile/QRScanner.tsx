// QR Scanner Component - Mobile QR code scanning interface
import React, { useState, useEffect, useRef } from 'react';
import { mobileIntegrationService, QRScanResult } from '../../services/MobileIntegrationService';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  isOpen
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = scannerRef.current;
    if (isOpen) {
      checkCameraAndStartScan();
    }
    
    return () => {
      // Cleanup scanner
      if (current) {
        current.innerHTML = '';
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const checkCameraAndStartScan = async () => {
    try {
      const capabilities = await mobileIntegrationService.detectCapabilities();
      
      if (!capabilities.hasCamera) {
        setError('Camera not available on this device');
        setHasCamera(false);
        return;
      }

      setHasCamera(true);
      startScanning();
      
    } catch {
      setError('Failed to access camera');
      setHasCamera(false);
    }
  };

  const startScanning = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setError(null);

    try {
      // Add QR reader div to DOM
      if (scannerRef.current) {
        scannerRef.current.innerHTML = '<div id="qr-reader" style="width: 100%;"></div>';
      }

      const result: QRScanResult = await mobileIntegrationService.scanQRCode();
      
      if (result.success && result.data) {
        onScan(result.data);
        onClose();
      } else {
        setError(result.error || 'Failed to scan QR code');
      }
      
    } catch {
      setError('Scanning failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualInput = () => {
    const input = prompt('Enter device identifier manually:');
    if (input && input.trim()) {
      onScan(input.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {hasCamera ? (
          <div>
            <div 
              ref={scannerRef}
              className="mb-4 border rounded-lg overflow-hidden"
              style={{ minHeight: '250px' }}
            />
            
            <div className="flex flex-col space-y-2">
              <button
                onClick={startScanning}
                disabled={isScanning}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isScanning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isScanning ? 'Scanning...' : 'Start Scan'}
              </button>
              
              <button
                onClick={handleManualInput}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Enter Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              📷 Camera not available
            </div>
            <button
              onClick={handleManualInput}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Enter Device ID Manually
            </button>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>Point your camera at a QR code containing device information.</p>
          <p className="mt-1">Supported formats: IMEI, Serial Number, Device ID</p>
        </div>
      </div>
    </div>
  );
};