// renderer.js - Handles the UI and interactions
console.log("Renderer script starting...")

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM content loaded")

  // Hide fallback content
  const fallbackContent = document.querySelector(".fallback-content")
  if (fallbackContent) {
    fallbackContent.style.display = "none"
  }

  // Check if API is available
  if (!window.api) {
    console.error("API not available. Preload script may not be working correctly.")
    if (fallbackContent) {
      fallbackContent.style.display = "block"
      fallbackContent.innerHTML =
        "<h1>Error: API not available</h1><p>The application could not initialize properly. Please restart the application.</p>"
    }
    return
  }

  // App state
  const state = {
    fragments: [],
    tags: [],
    currentPage: "fragments",
    darkMode: localStorage.getItem("darkMode") === "true",
  }

  // Import highlight.js for syntax highlighting
  const hljs = window.hljs
  if (!hljs) {
    console.warn("highlight.js not loaded")
  }

  // Initialize the app
  init()

  // Initialize the application
  async function init() {
    try {
      console.log("Initializing application...")

      // Apply dark mode if enabled
      if (state.darkMode) {
        document.body.classList.add("dark-mode")
      }

      // Add dark mode toggle
      createDarkModeToggle()

      // Load fragments and tags
      console.log("Loading fragments and tags...")
      await loadFragments()
      await loadTags()

      // Show fragments page by default
      console.log("Navigating to fragments page...")
      navigateTo("fragments")

      // Set up event listeners for navigation
      document.addEventListener("click", handleNavigation)

      console.log("Application initialized successfully")
    } catch (error) {
      console.error("Error initializing application:", error)
      if (fallbackContent) {
        fallbackContent.style.display = "block"
        fallbackContent.innerHTML = "<h1>Error Initializing Application</h1><p>" + error.message + "</p>"
      }
    }
  }

  // Create dark mode toggle button
  function createDarkModeToggle() {
    const toggle = document.createElement("div")
    toggle.className = "dark-mode-toggle"
    toggle.innerHTML = state.darkMode ? "☀️" : "🌙"
    toggle.addEventListener("click", toggleDarkMode)
    document.body.appendChild(toggle)
  }

  // Toggle dark mode
  function toggleDarkMode() {
    state.darkMode = !state.darkMode
    document.body.classList.toggle("dark-mode")
    document.querySelector(".dark-mode-toggle").innerHTML = state.darkMode ? "☀️" : "🌙"
    localStorage.setItem("darkMode", state.darkMode)
  }

  // Load fragments from the database
  async function loadFragments() {
    try {
      state.fragments = await window.api.getFragments()
      console.log("Fragments loaded:", state.fragments.length)
    } catch (error) {
      console.error("Error loading fragments:", error)
      state.fragments = []
    }
  }

  // Load tags from the database
  async function loadTags() {
    try {
      state.tags = await window.api.getTags()
      console.log("Tags loaded:", state.tags.length)
    } catch (error) {
      console.error("Error loading tags:", error)
      state.tags = []
    }
  }

  // Handle navigation clicks
  function handleNavigation(event) {
    const target = event.target

    // Logo click - go to fragments page
    if (target.classList.contains("logo")) {
      navigateTo("fragments")
    }

    // Navigation buttons
    if (target.id === "fragments-nav") {
      navigateTo("fragments")
    } else if (target.id === "tags-nav") {
      navigateTo("tags")
    }

    // Action buttons
    if (target.id === "new-fragment-btn") {
      navigateTo("fragment-form")
    } else if (target.id === "info-btn") {
      navigateTo("info")
    } else if (target.id === "new-tag-btn") {
      openTagModal()
    }

    // Fragment card click
    if (target.closest(".fragment-card") && !target.closest(".icon-btn")) {
      const fragmentId = target.closest(".fragment-card").dataset.id
      navigateTo("fragment-form", { id: fragmentId })
    }

    // View fragment code
    if (target.classList.contains("view-code-btn") || target.closest(".view-code-btn")) {
      const fragmentId = target.closest(".fragment-card").dataset.id
      const fragment = state.fragments.find((f) => f.id === fragmentId)
      openCodeModal(fragment)
      event.stopPropagation()
    }

    // Tag item click
    if (target.classList.contains("tag-item")) {
      const tagId = target.dataset.id
      const tag = state.tags.find((t) => t.id === tagId)
      openTagModal(tag)
    }

    // Close modal
    if (target.classList.contains("close-modal")) {
      closeModals()
    }

    // Copy code button
    if (target.id === "copy-code-btn") {
      const code = document.getElementById("code-modal-content").textContent
      window.api.copyToClipboard(code)
      showNotification("Code copied to clipboard!")
    }
  }

  // Navigate to a specific page
  function navigateTo(page, params = {}) {
    console.log("Navigating to page:", page)
    state.currentPage = page

    // Clear the app container
    const appContainer = document.getElementById("app")
    appContainer.innerHTML = ""

    // Load the appropriate template
    let template

    switch (page) {
      case "fragments":
        template = document.getElementById("fragments-template")
        appContainer.appendChild(document.importNode(template.content, true))
        renderFragments()
        break

      case "tags":
        template = document.getElementById("tags-template")
        appContainer.appendChild(document.importNode(template.content, true))
        renderTags()
        break

      case "fragment-form":
        template = document.getElementById("fragment-form-template")
        appContainer.appendChild(document.importNode(template.content, true))
        setupFragmentForm(params.id)
        break

      case "info":
        template = document.getElementById("info-template")
        appContainer.appendChild(document.importNode(template.content, true))
        break
    }
  }

  // Render fragments on the fragments page
  function renderFragments() {
    const container = document.getElementById("fragments-container")
    container.innerHTML = ""

    if (state.fragments.length === 0) {
      container.innerHTML = '<div class="empty-state">No fragments yet. Click "New" to create one.</div>'
      return
    }

    state.fragments.forEach((fragment) => {
      const card = document.createElement("div")
      card.className = "fragment-card"
      card.dataset.id = fragment.id

      // Get tag objects for this fragment
      const fragmentTags = fragment.tags
        ? fragment.tags.map((tagId) => {
            return state.tags.find((t) => t.id === tagId) || { id: tagId, name: tagId }
          })
        : []

      card.innerHTML = `
        <h3>${fragment.title}</h3>
        <div class="fragment-tags">
          ${fragmentTags.map((tag) => `<span class="tag">${tag.name}</span>`).join("")}
        </div>
        <div class="fragment-actions">
          <button class="icon-btn view-code-btn">👁️</button>
        </div>
      `

      container.appendChild(card)
    })
  }

  // Render tags on the tags page
  function renderTags() {
    const container = document.getElementById("tags-container")
    container.innerHTML = ""

    if (state.tags.length === 0) {
      container.innerHTML = '<div class="empty-state">No tags yet. Click "New" to create one.</div>'
      return
    }

    state.tags.forEach((tag) => {
      const tagElement = document.createElement("div")
      tagElement.className = "tag-item"
      tagElement.dataset.id = tag.id
      tagElement.textContent = tag.name

      container.appendChild(tagElement)
    })
  }

  // Set up the fragment form
  function setupFragmentForm(fragmentId) {
    const form = document.getElementById("fragment-form")
    const deleteBtn = document.getElementById("delete-fragment-btn")

    // If editing an existing fragment
    if (fragmentId) {
      const fragment = state.fragments.find((f) => f.id === fragmentId)

      if (fragment) {
        document.getElementById("fragment-id").value = fragment.id
        document.getElementById("fragment-title").value = fragment.title
        document.getElementById("fragment-code").value = fragment.code

        // Get tag names for this fragment
        const tagNames = fragment.tags
          ? fragment.tags.map((tagId) => {
              const tag = state.tags.find((t) => t.id === tagId)
              return tag ? tag.name : tagId
            })
          : []

        document.getElementById("fragment-tags").value = tagNames.join(", ")
      }
    } else {
      // New fragment
      deleteBtn.style.display = "none"
    }

    // Form submit handler
    form.addEventListener("submit", async (event) => {
      event.preventDefault()

      const id = document.getElementById("fragment-id").value
      const title = document.getElementById("fragment-title").value
      const code = document.getElementById("fragment-code").value
      const tagInput = document.getElementById("fragment-tags").value

      // Process tags
      const tagNames = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)
      const tags = []

      // Create or find tags
      for (const name of tagNames) {
        let tag = state.tags.find((t) => t.name.toLowerCase() === name.toLowerCase())

        if (!tag) {
          tag = { name }
          tag = await window.api.saveTag(tag)
          state.tags.push(tag)
        }

        tags.push(tag.id)
      }

      // Create or update fragment
      const fragment = {
        id: id || undefined,
        title,
        code,
        tags,
      }

      await window.api.saveFragment(fragment)
      await loadFragments()
      navigateTo("fragments")
    })

    // Delete button handler
    deleteBtn.addEventListener("click", async () => {
      const id = document.getElementById("fragment-id").value

      if (confirm("Are you sure you want to delete this fragment?")) {
        await window.api.deleteFragment(id)
        await loadFragments()
        navigateTo("fragments")
      }
    })
  }

  // Open the tag modal
  function openTagModal(tag = null) {
    // Create modal if it doesn't exist
    if (!document.getElementById("tag-modal")) {
      const template = document.getElementById("tag-modal-template")
      document.body.appendChild(document.importNode(template.content, true))

      // Set up form submit handler
      document.getElementById("tag-form").addEventListener("submit", async (event) => {
        event.preventDefault()

        const id = document.getElementById("tag-id").value
        const name = document.getElementById("tag-name").value

        const tag = {
          id: id || undefined,
          name,
        }

        await window.api.saveTag(tag)
        await loadTags()
        closeModals()

        if (state.currentPage === "tags") {
          renderTags()
        }
      })

      // Set up delete button handler
      document.getElementById("delete-tag-btn").addEventListener("click", async () => {
        const id = document.getElementById("tag-id").value

        if (confirm("Are you sure you want to delete this tag?")) {
          await window.api.deleteTag(id)
          await loadTags()
          closeModals()

          if (state.currentPage === "tags") {
            renderTags()
          }
        }
      })
    }

    // Show modal
    const modal = document.getElementById("tag-modal")
    modal.style.display = "block"

    // Fill form if editing
    if (tag) {
      document.getElementById("tag-id").value = tag.id
      document.getElementById("tag-name").value = tag.name
      document.getElementById("delete-tag-btn").style.display = "block"
    } else {
      document.getElementById("tag-id").value = ""
      document.getElementById("tag-name").value = ""
      document.getElementById("delete-tag-btn").style.display = "none"
    }
  }

  // Open the code modal
  function openCodeModal(fragment) {
    // Create modal if it doesn't exist
    if (!document.getElementById("code-modal")) {
      const template = document.getElementById("code-modal-template")
      document.body.appendChild(document.importNode(template.content, true))
    }

    // Show modal
    const modal = document.getElementById("code-modal")
    modal.style.display = "block"

    // Fill content
    document.getElementById("code-modal-title").textContent = fragment.title
    const codeElement = document.getElementById("code-modal-content")
    codeElement.textContent = fragment.code

    // Apply syntax highlighting
    if (hljs) {
      hljs.highlightElement(codeElement)
    }
  }

  // Close all modals
  function closeModals() {
    const modals = document.querySelectorAll(".modal")
    modals.forEach((modal) => {
      modal.style.display = "none"
    })
  }

  // Show notification
  function showNotification(message) {
    const notification = document.createElement("div")
    notification.className = "notification"
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add("show")
    }, 10)

    setTimeout(() => {
      notification.classList.remove("show")
      setTimeout(() => {
        notification.remove()
      }, 300)
    }, 3000)
  }

  // Add drag and drop support for code files
  document.addEventListener("dragover", (event) => {
    event.preventDefault()
  })

  document.addEventListener("drop", (event) => {
    event.preventDefault()

    if (event.dataTransfer.files.length > 0 && state.currentPage === "fragments") {
      const file = event.dataTransfer.files[0]

      if (
        file.type === "text/plain" ||
        file.name.endsWith(".js") ||
        file.name.endsWith(".html") ||
        file.name.endsWith(".css")
      ) {
        const reader = new FileReader()

        reader.onload = () => {
          navigateTo("fragment-form")

          // Pre-fill the form
          document.getElementById("fragment-title").value = file.name
          document.getElementById("fragment-code").value = reader.result
        }

        reader.readAsText(file)
      }
    }
  })
})


