import { useState, useEffect } from 'react';
import { AgentConnectionStatus } from '../types/remoteControl';

export function useRemoteAgent() {
  const [agentStatus, setAgentStatus] = useState<AgentConnectionStatus>({
    connected: false,
  });

  useEffect(() => {
    const checkAgentConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch('http://localhost:9876/health', {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setAgentStatus({
            connected: true,
            agentVersion: data.version,
            lastHeartbeat: Date.now(),
          });
        }
      } catch (err) {
        setAgentStatus({
          connected: false,
        });
      }
    };

    // Check on mount
    checkAgentConnection();

    // Check every 5 seconds
    const interval = setInterval(checkAgentConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return agentStatus;
}
