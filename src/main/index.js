const { app, BrowserWindow, ipcMain, clipboard } = require("electron")
const path = require("path")
const fs = require("fs")

// Database file path
const DB_PATH = path.join(app.getPath("userData"), "fragments.json")

// Initialize database if it doesn't exist
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ fragments: [], tags: [] }))
  }
}

// Create the main window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the index.html file
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"))
  }
}

// App ready event
app.whenReady().then(() => {
  initDatabase()
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

// IPC handlers for database operations
ipcMain.handle("get-fragments", async () => {
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  return data.fragments
})

ipcMain.handle("get-tags", async () => {
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  return data.tags
})

ipcMain.handle("save-fragment", async (event, fragment) => {
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))

  if (fragment.id) {
    // Update existing fragment
    const index = data.fragments.findIndex((f) => f.id === fragment.id)
    if (index !== -1) {
      data.fragments[index] = fragment
    }
  } else {
    // Add new fragment
    fragment.id = Date.now().toString()
    data.fragments.push(fragment)
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(data))
  return fragment
})

ipcMain.handle("delete-fragment", async (event, id) => {
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  data.fragments = data.fragments.filter((f) => f.id !== id)
  fs.writeFileSync(DB_PATH, JSON.stringify(data))
  return true
})

ipcMain.handle("save-tag", async (event, tag) => {
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))

  if (tag.id) {
    // Update existing tag
    const index = data.tags.findIndex((t) => t.id === tag.id)
    if (index !== -1) {
      data.tags[index] = tag
    }
  } else {
    // Add new tag
    tag.id = Date.now().toString()
    data.tags.push(tag)
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(data))
  return tag
})

ipcMain.handle("delete-tag", async (event, id) => {
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  data.tags = data.tags.filter((t) => t.id !== id)
  fs.writeFileSync(DB_PATH, JSON.stringify(data))
  return true
})

ipcMain.handle("copy-to-clipboard", async (event, text) => {
  clipboard.writeText(text)
  return true
})
