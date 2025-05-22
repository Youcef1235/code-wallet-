const { contextBridge, ipcRenderer } = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // Fragment operations
  getFragments: () => ipcRenderer.invoke("get-fragments"),
  saveFragment: (fragment) => ipcRenderer.invoke("save-fragment", fragment),
  deleteFragment: (id) => ipcRenderer.invoke("delete-fragment", id),

  // Tag operations
  getTags: () => ipcRenderer.invoke("get-tags"),
  saveTag: (tag) => ipcRenderer.invoke("save-tag", tag),
  deleteTag: (id) => ipcRenderer.invoke("delete-tag", id),

  // Clipboard operation
  copyToClipboard: (text) => ipcRenderer.invoke("copy-to-clipboard", text),
})
