// src/components/test/DeduplicationTest.tsx
'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function DeduplicationTest() {
  const [requests, setRequests] = useState<Array<{id: number, time: string, status: string}>>([]);
  const [requestCount, setRequestCount] = useState(0);
  const queryClient = useQueryClient();

  const simulateRequests = async () => {
    const requestId = requestCount + 1;
    setRequestCount(requestId);
    
    const startTime = new Date().toISOString();
    setRequests(prev => [...prev, {
      id: requestId,
      time: startTime,
      status: 'pending'
    }]);

    try {
      // Simulate multiple identical queries
      const queryKey = ['test-dedup', { clientId: 'test123', timestamp: Date.now() }];
      const queryFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1s delay
        return { data: `Response for request ${requestId}`, timestamp: Date.now() };
      };

      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn,
        staleTime: 5000,
      });

      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: `success: ${result.data}` } : req
      ));
    } catch (error: unknown) {
      // TypeScript-safe error handling
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = 'Unknown error occurred';
      }
      
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: `error: ${errorMessage}` } : req
      ));
    }
  };

  const simulateSimultaneousRequests = () => {
    // Trigger 5 requests at once
    for (let i = 0; i < 5; i++) {
      setTimeout(() => simulateRequests(), i * 50); // Slightly staggered
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Request Deduplication Test</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={simulateRequests}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Single Request
        </button>
        
        <button
          onClick={simulateSimultaneousRequests}
          className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          5 Simultaneous Requests
        </button>
        
        <button
          onClick={() => setRequests([])}
          className="ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Log
        </button>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Request Log:</h4>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {requests.length === 0 ? (
            <p className="text-gray-500">No requests yet</p>
          ) : (
            requests.map(req => (
              <div key={req.id} className="p-2 border rounded bg-white">
                <div className="flex justify-between">
                  <span className="font-mono">Req #{req.id}</span>
                  <span className="text-sm text-gray-500">{req.time.split('T')[1].slice(0, -5)}</span>
                </div>
                <div className={`text-sm ${
                  req.status.startsWith('success') ? 'text-green-600' :
                  req.status.startsWith('error') ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {req.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Expected behavior:</strong></p>
        <ul className="list-disc pl-5 mt-1">
          <li>Simultaneous requests should be deduplicated</li>
          <li>Only 1 actual network call for 5 simultaneous requests</li>
          <li>All requests should receive the same cached response</li>
          <li>Check browser DevTools Network tab for actual requests</li>
        </ul>
      </div>
    </div>
  );
}