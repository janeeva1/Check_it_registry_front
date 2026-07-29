// NFC Reader Component - Mobile NFC reading interface
import React, { useState, useEffect } from 'react';
import { mobileIntegrationService, NFCReadResult } from '../../services/MobileIntegrationService';

interface NFCReaderProps {
  onRead: (data: any) => void;
  onError: (error: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const NFCReader: React.FC<NFCReaderProps> = ({
  onRead,
  onClose,
  isOpen
}) => {
  const [isReading, setIsReading] = useState(false);
  const [hasNFC, setHasNFC] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readData, setReadData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      checkNFCSupport();
    }
  }, [isOpen]);

  const checkNFCSupport = async () => {
    try {
      const capabilities = await mobileIntegrationService.detectCapabilities();
      
      if (!capabilities.hasNFC) {
        setError('NFC not supported on this device');
        setHasNFC(false);
        return;
      }

      setHasNFC(true);
      
    } catch {
      setError('Failed to check NFC support');
      setHasNFC(false);
    }
  };

  const startReading = async () => {
    if (isReading) return;
    
    setIsReading(true);
    setError(null);
    setReadData(null);

    try {
      const result: NFCReadResult = await mobileIntegrationService.readNFC();
      
      if (result.success && result.data) {
        setReadData(result.data);
        onRead(result.data);
      } else {
        setError(result.error || 'Failed to read NFC tag');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NFC reading failed');
    } finally {
      setIsReading(false);
    }
  };

  const formatNFCData = (data: any) => {
    if (!data) return null;

    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <h4 className="font-medium mb-2">NFC Data:</h4>
        
        {data.serialNumber && (
          <div className="mb-2">
            <span className="font-medium">Serial Number:</span> {data.serialNumber}
          </div>
        )}

        {data.records && data.records.length > 0 && (
          <div>
            <span className="font-medium">Records:</span>
            <ul className="mt-1 space-y-1">
              {data.records.map((record: any, index: number) => (
                <li key={index} className="text-sm">
                  <span className="font-medium">{record.recordType}:</span>
                  {record.mediaType && (
                    <span className="text-gray-600"> ({record.mediaType})</span>
                  )}
                  {record.data && (
                    <div className="ml-2 text-gray-700">
                      {typeof record.data === 'string'
                        ? record.data
                        : JSON.stringify(record.data)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Read NFC Tag</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {hasNFC ? (
          <div>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📱</div>

              {isReading ? (
                <div>
                  <div className="text-lg font-medium text-blue-600 mb-2">
                    Hold device near NFC tag...
                  </div>
                  <div className="animate-pulse text-sm text-gray-600">Reading NFC data</div>
                </div>
              ) : (
                <div>
                  <div className="text-lg font-medium mb-4">Ready to read NFC tag</div>
                  <button
                    onClick={startReading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Start Reading
                  </button>
                </div>
              )}
            </div>

            {readData && (
              <div className="mt-4">
                {formatNFCData(readData)}

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => onRead(readData)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Use This Data
                  </button>
                  <button
                    onClick={startReading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Read Again
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">📱 NFC not supported</div>
            <p className="text-sm text-gray-600 mb-4">This device doesn't support NFC reading.</p>
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Close
            </button>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>Hold your device close to an NFC tag to read device information.</p>
          <p className="mt-1">Make sure NFC is enabled in your device settings.</p>
        </div>
      </div>
    </div>
  );
};