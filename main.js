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
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the index.html file
  mainWindow.loadFile("index.html")
}

// App ready event
app.whenReady().then(() => {
  console.log("App is ready, initializing database...")
  initDatabase()
  console.log("Database initialized, creating window...")
  createWindow()
  console.log("Window created")

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
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
    return data.fragments
  } catch (error) {
    console.error("Error getting fragments:", error)
    return []
  }
})

ipcMain.handle("get-tags", async () => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
    return data.tags
  } catch (error) {
    console.error("Error getting tags:", error)
    return []
  }
})

ipcMain.handle("save-fragment", async (event, fragment) => {
  try {
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
  } catch (error) {
    console.error("Error saving fragment:", error)
    return null
  }
})

ipcMain.handle("delete-fragment", async (event, id) => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
    data.fragments = data.fragments.filter((f) => f.id !== id)
    fs.writeFileSync(DB_PATH, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Error deleting fragment:", error)
    return false
  }
})

ipcMain.handle("save-tag", async (event, tag) => {
  try {
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
  } catch (error) {
    console.error("Error saving tag:", error)
    return null
  }
})

ipcMain.handle("delete-tag", async (event, id) => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
    data.tags = data.tags.filter((t) => t.id !== id)
    fs.writeFileSync(DB_PATH, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Error deleting tag:", error)
    return false
  }
})

ipcMain.handle("copy-to-clipboard", async (event, text) => {
  try {
    clipboard.writeText(text)
    return true
  } catch (error) {
    console.error("Error copying to clipboard:", error)
    return false
  }
})

