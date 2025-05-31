// components/IpAddressDisplay.tsx - Client component for IP address display
'use client';

import { useState, useEffect } from 'react';

export default function IpAddressDisplay() {
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
        setError(null);
      } catch (err) {
        console.error('Error fetching IP address:', err);
        setError('Failed to get IP address');
        setIp('unknown');
      } finally {
        setLoading(false);
      }
    };

    fetchIp();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading IP address...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <span className="font-semibold">Your IP Address:</span> {ip}
    </div>
  );
}