import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('agentAPI', {
  getStatus: () => ipcRenderer.invoke('get-agent-status'),
  stopControl: () => ipcRenderer.invoke('stop-control'),
  onRemoteControlRequest: (callback: (event: any) => void) => {
    ipcRenderer.on('remote-control-request', (event, data) => callback(data));
  },
  onConnectionStatusChange: (callback: (status: any) => void) => {
    ipcRenderer.on('agent-connection-status', (event, data) => callback(data));
  },
  registerWithRelay: (data: any) => ipcRenderer.invoke('register-with-relay', data),
});
