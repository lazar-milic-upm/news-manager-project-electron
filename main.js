const { app, BrowserWindow, Notification, ipcMain,Tray, Menu, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const env = process.env.NODE_ENV || 'development';
const Store = require('electron-store');
const store = new Store();
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');

setupTitlebar();

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    mainWindow = new BrowserWindow({
        wwidth: 1200,
        height: 800,
        frame: false,
        webPreferences: {
          contextIsolation: true,
          preload: preloadPath,
          sandbox: false
        },
    });

    if(env.toLowerCase() === 'development') {
        mainWindow.loadURL('http://localhost:4200')
    } else {
        mainWindow.loadFile('dist/browser/index.html')
    }

    ipcMain.on('minimize-window', () => {
      mainWindow.minimize();
    });

    ipcMain.on('maximize-window', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });

    mainWindow.on('closed', () => {
      console.log('[Main Process] MainWindow closed');
      mainWindow = null;
    });

    let tray = new Tray(path.join(__dirname, 'src/assets', 'logo.png'),);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show App', click: () => mainWindow.show() },
      { label: 'Quit', click: () => app.quit() },
    ]);

    tray.setToolTip('News Manager Project');
    tray.setContextMenu(contextMenu);

    mainWindow.webContents.on('context-menu', () => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Reload', role: 'reload' },
        { label: 'Developer Tools', role: 'toggleDevTools' },
      ]);
      contextMenu.popup();
    });

    attachTitlebarToWindow(mainWindow);

    //mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) 
          createWindow()
  })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

process.on('uncaughtException', (error) => {
  console.error('[Main Process] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main Process] Unhandled Rejection:', reason);
});

ipcMain.handle('electron-store-get', async (_, key) => {
  try {
    const value = store.get(key);
    console.log(`[store-get] Key "${key}" retrieved successfully`);
    if(value != null || value != undefined)
      return value;
    else
      return null;
  } catch (error) {
    console.error(`[store-get] Error retrieving key "${key}":`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('electron-store-set', async (_, key, value) => {
  console.log(`[main] electron-store-set called for key: ${key}, value:`, value);
  store.set(key, value);
  return true;
});

ipcMain.handle('electron-store-delete', async (_, key) => {
  if (typeof key !== 'string') {
    return { success: false, error: 'Invalid key type. Key must be a string.' };
  }

  try {
    store.delete(key);
    console.log(`[store-delete] Key "${key}" deleted successfully`);
    return { success: true };
  } catch (error) {
    console.error(`[store-delete] Error deleting key "${key}":`, error);
    return { success: false, error: error.message };
  }
});


ipcMain.handle('electron-store-clear', async () => {
  try {
    store.clear();
    console.log('[store-clear] Store cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('[store-clear] Error clearing store:', error);
    return { success: false, error: error.message };
  }
});


ipcMain.handle('import-article', async (event, body) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'No file selected' };
  }

  const filePath = result.filePaths[0];
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const article = JSON.parse(fileContent);
    return { article };
  } catch (error) {
    return { success: false, error: `Failed to read file: ${error.message}` };
  }
});

ipcMain.handle('export-article', async (event, articleData) => {
  const defaultFileName = (articleData.Title ? articleData.Title : 'article') + '.json';

  const result = await dialog.showSaveDialog({
    title: 'Save Article',
    defaultPath: defaultFileName,
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });

  if (result.canceled) {
    return { success: false, error: 'Save operation canceled by user' };
  }

  const filePath = result.filePath;
  try {
    fs.writeFileSync(filePath, JSON.stringify(articleData, null, 2), 'utf8');
    lastExportedFilePath = filePath; 
    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to write file: ${error.message}` };
  }
});

