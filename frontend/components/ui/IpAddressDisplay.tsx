// components/IpAddressDisplay.tsx
'use client';

import { useState, useEffect } from 'react';

interface IpAddressDisplayProps {
  onIpChange?: (ip: string) => void; // Callback to pass IP address to parent
}

export default function IpAddressDisplay({ onIpChange }: IpAddressDisplayProps) {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://ipinfo.io/json');
        
        if (!response.ok) {
          throw new Error('Failed to fetch IP address');
        }
        
        const data = await response.json();
        setIp(data.ip);
        onIpChange?.(data.ip); // Call the callback with the IP address
        setError(null);
      } catch (err) {
        console.error('Error fetching IP address:', err);
        setError('Failed to get IP address');
        setIp('unknown');
        onIpChange?.('unknown'); // Call the callback with 'unknown' on error
      } finally {
        setLoading(false);
      }
    };

    fetchIp();
  }, [onIpChange]); // Add onIpChange to dependency array

  if (loading) {
    return <div className="text-gray-500">Loading IP address...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 bg-background-secondary  bg-neutral-800 rounded-lg">
      {ip}
    </div>
  );
}