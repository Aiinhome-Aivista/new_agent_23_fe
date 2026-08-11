import { useState, useEffect } from 'react';

export function useAgentStream(sessionId: string | null) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    setIsStreaming(true);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const eventSource = new EventSource(`${baseUrl}/sessions/${sessionId}/stream`);

    eventSource.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      setIsStreaming(false);
    };

    return () => {
      eventSource.close();
      setIsStreaming(false);
    };
  }, [sessionId]);

  return { logs, isStreaming };
}
