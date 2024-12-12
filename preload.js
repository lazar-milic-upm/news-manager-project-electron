const { contextBridge, ipcRenderer } = require('electron'); 
const path = require('path');
const { Titlebar } = require('custom-electron-titlebar'); 

window.addEventListener('DOMContentLoaded', () => {
  new Titlebar({
    backgroundColor: '#0d6efd',
  });
});

// Attempt to import electron-store
try {
    const Store  = require('electron-store');
    const store = new Store();
    console.log('Preload script loaded and electron-store instantiated');
    // Expose electronStore to the renderer process
    contextBridge.exposeInMainWorld('electronStore', {
      set: (key, value) => ipcRenderer.invoke('electron-store-set', key, value),
      get: (key) => ipcRenderer.invoke('electron-store-get', key),
      delete: (key) => ipcRenderer.invoke('electron-store-delete', key),
      clear: () => ipcRenderer.invoke('electron-store-clear')
    });
    } catch (error) {
      console.error('Failed to import or instantiate electron-store:', error);
}

// Expose other Electron APIs for IPC (if needed)
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    invoke: (channel, args) => ipcRenderer.invoke(channel, args),
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
  },
  windowReady: () => {
    ipcRenderer.invoke('window-ready');
  },
});

contextBridge.exposeInMainWorld('show-notification', {
  showNotification: (title, body) => {
    const notification = new Notification(title, {
      body: body,
    });
    notification.onclick = () => {
      ipcRenderer.invoke('focus-app');
    };
  }
});