/**
 * Electron main process for the Hermes Console desktop app.
 *
 * Dev:  connects to the Next.js dev server on 127.0.0.1:3000.
 * Prod: spawns the bundled Next.js standalone server on a free port.
 */

const { app, BrowserWindow, shell, nativeImage, Menu } = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");
const net = require("node:net");

const isDev = !app.isPackaged;

let mainWindow = null;
let nextServer = null;
let serverUrl = null;

/** Find a free TCP port on localhost. */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

/** Wait until the URL responds with any HTTP status. */
function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timed out waiting for ${url}`));
          } else {
            setTimeout(tick, 200);
          }
        });
    };
    tick();
  });
}

/** Start the Next.js standalone server bundled with the app. */
async function startNextServer() {
  const port = await getFreePort();
  const serverJs = path.join(
    process.resourcesPath,
    "app.asar.unpacked",
    ".next",
    "standalone",
    "server.js",
  );
  // When running unpacked (electron . after next build) use repo-relative path.
  const localServer = path.join(
    __dirname,
    "..",
    ".next",
    "standalone",
    "server.js",
  );

  const fs = require("node:fs");
  const entry = fs.existsSync(serverJs) ? serverJs : localServer;

  nextServer = spawn(process.execPath, [entry], {
    cwd: path.dirname(entry),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      // Forces Electron's node-integrated runtime to act like plain node
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: "inherit",
  });

  nextServer.on("error", (err) => {
    console.error("Next server failed to start:", err);
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForHttp(url);
  return url;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: "Hermes Console",
    backgroundColor: "#07070b",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 14 },
    vibrancy: "under-window",
    visualEffectState: "active",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  win.once("ready-to-show", () => win.show());

  // Open external links in the default browser instead of in-window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadURL(serverUrl);
  mainWindow = win;
}

function buildMenu() {
  const template = [
    { role: "appMenu" },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on("ready", async () => {
  if (process.platform === "darwin") {
    const iconPath = path.join(__dirname, "icon.png");
    try {
      const img = nativeImage.createFromPath(iconPath);
      if (!img.isEmpty()) app.dock.setIcon(img);
    } catch {
      // icon optional
    }
  }

  buildMenu();

  try {
    serverUrl = isDev
      ? "http://127.0.0.1:3000"
      : await startNextServer();
    createWindow();
  } catch (err) {
    console.error("Failed to start:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && serverUrl) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

app.on("before-quit", () => {
  if (nextServer && !nextServer.killed) {
    nextServer.kill();
  }
});
