const { app, nativeImage, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');

const path = '/home/username/stablediffusion/StabilityMatrix/Packages/sdnext';
const serverUrl = 'http://localhost:7860';
const onWindows = os.platform() === 'win32';

class ServerManager {
    constructor() {
        this.terminalProcess = null;
    }

    startServer() {
        const command = onWindows ? 'cmd' : 'xterm';
        const args = onWindows ? ['/c', `${path}/webui.bat`, '--theme', 'modern'] : ['-e', `${path}/webui.sh`, '--theme', 'modern'];
        this.terminalProcess = spawn(command, args);

        this.terminalProcess.on('exit', () => {
            this.terminalProcess = null;
            app.quit();
        });
    }

    startClient() {
        const appIcon = nativeImage.createFromPath(path + (onWindows ? '/html/favicon.ico': '/html/favicon.png'));
        const win = new BrowserWindow({
            darkTheme: true,
            backgroundColor: "black",
    
            icon: appIcon,
            title: "SD.Next",
            autoHideMenuBar: true,
        });
        win.maximize();
        win.loadURL(serverUrl);

        win.on('closed', () => {
            if (this.terminalProcess) {
                this.terminalProcess.kill()
                this.terminalProcess = null;
            }
        });
    }

    async waitForServerStart () {
        return new Promise(resolve => {
            const interval = setInterval(() => {   
                http.get(serverUrl + '/sdapi/v1/start', (res) => {
                    if(res.statusCode === 200) {
                        clearInterval(interval);
                        resolve();
                    }
                }).on('error', () => {});
            }, 5000); 
        });
    }
}

async function mainRoutine () {
    server = new ServerManager();

    console.log('Starting server');
    server.startServer();

    await server.waitForServerStart();

    console.log('Starting client');
    server.startClient();
}

app.whenReady().then(mainRoutine);
