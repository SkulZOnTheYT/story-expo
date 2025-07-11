import { Router } from "./router/Router.js"
import { StoryPresenter } from "./presenters/StoryPresenter.js"
import { StoryModel } from "./models/StoryModel.js"
import { HomeView } from "./views/HomeView.js"
import { StoriesView } from "./views/StoriesView.js"
import { AddStoryView } from "./views/AddStoryView.js"
import { AuthView } from "./views/AuthView.js"
import { StoryDetailView } from "./views/StoryDetailView.js"
import { FavoritesView } from "./views/FavoritesView.js"
import { NotFoundView } from "./views/NotFoundView.js"

class App {
  constructor() {
    this.router = new Router()
    this.storyModel = new StoryModel()
    this.currentView = null
    this.initializeApp()
  }

  initializeApp() {
    // Initialize views
    const homeView = new HomeView()
    const storiesView = new StoriesView()
    const addStoryView = new AddStoryView()
    const authView = new AuthView()
    const storyDetailView = new StoryDetailView()
    const favoritesView = new FavoritesView()
    const notFoundView = new NotFoundView()

    // Initialize presenter
    const storyPresenter = new StoryPresenter(
      this.storyModel,
      storiesView,
      addStoryView,
      authView,
      storyDetailView,
      favoritesView,
    )

    // Setup routes with proper view cleanup
    this.router.addRoute("/", () => {
      this.cleanupCurrentView()
      this.currentView = homeView
      homeView.render()
    })

    this.router.addRoute("/stories", () => {
      this.cleanupCurrentView()
      this.currentView = storiesView
      storyPresenter.showStories()
    })

    this.router.addRoute("/stories/:id", (params) => {
      this.cleanupCurrentView()
      this.currentView = storyDetailView
      storyPresenter.showStoryDetail(params.id)
    })

    this.router.addRoute("/add-story", () => {
      this.cleanupCurrentView()
      this.currentView = addStoryView
      storyPresenter.showAddStoryForm()
    })

    this.router.addRoute("/favorites", () => {
      this.cleanupCurrentView()
      this.currentView = favoritesView
      storyPresenter.showFavorites()
    })

    this.router.addRoute("/auth", () => {
      this.cleanupCurrentView()
      this.currentView = authView
      storyPresenter.showAuth("login")
    })

    this.router.addRoute("/auth/register", () => {
      this.cleanupCurrentView()
      this.currentView = authView
      storyPresenter.showAuth("register")
    })

    // 404 Not Found route - should be last
    this.router.setNotFoundHandler(() => {
      this.cleanupCurrentView()
      this.currentView = notFoundView
      notFoundView.render()
    })

    // Initialize router
    this.router.init()

    // Setup navigation
    this.setupNavigation(storyPresenter)

    // Setup View Transitions
    this.setupViewTransitions()

    // Update navigation based on auth state
    this.updateNavigation(storyPresenter.getAuthState())

    // Initialize notifications if authenticated
    if (this.storyModel.isAuthenticated()) {
      this.initializeNotifications(storyPresenter)
    }

    // Initialize Workbox service worker
    this.initializeServiceWorker()

    // Setup PWA install prompt
    this.setupInstallPrompt()

    // Setup connection status indicator
    this.setupConnectionStatus()
  }

  async initializeServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        // Register Workbox generated service worker
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("Workbox Service Worker registered successfully")

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              this.showUpdateAvailable(newWorker)
            }
          })
        })

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "SYNC_OFFLINE_STORIES") {
            this.handleBackgroundSync()
          }
          if (event.data && event.data.type === "WORKBOX_UPDATED") {
            console.log("Workbox cache updated")
          }
        })
      } catch (error) {
        console.log("Service Worker registration failed - continuing without service worker:", error.message)
      }
    }
  }

  setupInstallPrompt() {
    let deferredPrompt
    const installBanner = document.getElementById("install-banner")
    const installBtn = document.getElementById("install-btn")
    const installDismiss = document.getElementById("install-dismiss")

    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      deferredPrompt = e
      // Show install banner
      if (installBanner) {
        installBanner.style.display = "block"
      }
    })

    // Handle install button click
    if (installBtn) {
      installBtn.addEventListener("click", async () => {
        if (deferredPrompt) {
          // Show the install prompt
          deferredPrompt.prompt()
          // Wait for the user to respond to the prompt
          const { outcome } = await deferredPrompt.userChoice
          console.log(`User response to the install prompt: ${outcome}`)
          // Clear the deferredPrompt variable
          deferredPrompt = null
          // Hide install banner
          if (installBanner) {
            installBanner.style.display = "none"
          }
        }
      })
    }

    // Handle dismiss button click
    if (installDismiss) {
      installDismiss.addEventListener("click", () => {
        if (installBanner) {
          installBanner.style.display = "none"
        }
        // Remember user dismissed (optional)
        localStorage.setItem("installPromptDismissed", "true")
      })
    }

    // Check if user previously dismissed
    if (localStorage.getItem("installPromptDismissed") && installBanner) {
      installBanner.style.display = "none"
    }

    // Hide banner if app is already installed
    window.addEventListener("appinstalled", () => {
      if (installBanner) {
        installBanner.style.display = "none"
      }
      console.log("PWA was installed")
    })
  }

  setupConnectionStatus() {
    const connectionStatus = document.getElementById("connection-status")
    if (!connectionStatus) return

    const updateConnectionStatus = () => {
      const icon = connectionStatus.querySelector("i")
      const text = connectionStatus.querySelector("span")

      if (navigator.onLine) {
        icon.className = "fas fa-wifi"
        text.textContent = "Online"
        connectionStatus.style.color = "#10b981"
      } else {
        icon.className = "fas fa-wifi-slash"
        text.textContent = "Offline"
        connectionStatus.style.color = "#ef4444"
      }
    }

    // Initial status
    updateConnectionStatus()

    // Listen for online/offline events
    window.addEventListener("online", updateConnectionStatus)
    window.addEventListener("offline", updateConnectionStatus)
  }

  handleBackgroundSync() {
    // Show notification that offline stories have been synced
    this.showNotificationBanner("Cerita offline telah berhasil disinkronkan!")
  }

  showUpdateAvailable(newWorker) {
    const updateBanner = document.createElement("div")
    updateBanner.className = "update-banner"
    updateBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      color: white;
      padding: 1rem 2rem;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `

    updateBanner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <i class="fas fa-sync-alt" aria-hidden="true"></i>
        <div>
          <strong>Pembaruan Tersedia</strong>
          <p style="margin: 0; font-size: 0.875rem; opacity: 0.9;">Versi baru aplikasi telah tersedia</p>
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button id="update-btn" class="btn btn-primary" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);">
          <i class="fas fa-download" aria-hidden="true"></i>
          Perbarui
        </button>
        <button id="update-dismiss" class="btn btn-secondary" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">
          <i class="fas fa-times" aria-hidden="true"></i>
          Nanti
        </button>
      </div>
    `

    document.body.appendChild(updateBanner)

    updateBanner.querySelector("#update-btn").addEventListener("click", () => {
      newWorker.postMessage({ type: "SKIP_WAITING" })
      window.location.reload()
    })

    updateBanner.querySelector("#update-dismiss").addEventListener("click", () => {
      updateBanner.remove()
    })
  }

  // Critical: Cleanup current view to stop camera streams
  cleanupCurrentView() {
    if (this.currentView && typeof this.currentView.destroy === "function") {
      this.currentView.destroy()
    }
  }

  setupNavigation(storyPresenter) {
    document.addEventListener("click", (e) => {
      if (e.target.matches('a[href^="#"]')) {
        e.preventDefault()
        const href = e.target.getAttribute("href")
        this.router.navigate(href.substring(1))

        // Update active nav link
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.remove("active")
        })
        e.target.classList.add("active")
      }

      // Handle logout button
      if (e.target.matches("#logout-btn") || e.target.closest("#logout-btn")) {
        e.preventDefault()
        const authState = storyPresenter.handleLogout()
        this.updateNavigation(authState)
        window.location.hash = "/"
      }
    })

    // Update navigation when auth state changes
    window.addEventListener("storage", (e) => {
      if (e.key === "authToken") {
        this.updateNavigation(storyPresenter.getAuthState())
      }
    })

    // Listen for custom auth state change events
    window.addEventListener("authStateChanged", (e) => {
      this.updateNavigation(e.detail)
    })
  }

  // View handles navigation updates
  updateNavigation(authState) {
    const navbar = document.querySelector(".navbar")
    if (!navbar) return

    const navMenu = navbar.querySelector(".nav-menu")
    const existingProfile = navMenu.querySelector("li:has(.user-profile)")
    const existingAuthLink = navMenu.querySelector('a[href="#/auth"]')?.parentElement

    if (authState.isAuthenticated && authState.user) {
      // User is logged in - show profile, hide auth link
      if (existingAuthLink) {
        existingAuthLink.style.display = "none"
      }

      if (!existingProfile) {
        const userProfile = document.createElement("li")
        userProfile.setAttribute("role", "none")
        userProfile.innerHTML = `
          <div class="user-profile">
            <div class="user-avatar">
              <i class="fas fa-user" aria-hidden="true"></i>
            </div>
            <span>${authState.user.name}</span>
            <button class="logout-btn" id="logout-btn" aria-label="Logout">
              <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
            </button>
          </div>
        `
        navMenu.appendChild(userProfile)
      }
    } else {
      // User is not logged in - hide profile, show auth link
      if (existingProfile) {
        existingProfile.remove()
      }

      if (existingAuthLink) {
        existingAuthLink.style.display = "block"
      } else {
        // Create auth link if it doesn't exist
        const authLink = document.createElement("li")
        authLink.setAttribute("role", "none")
        authLink.innerHTML = `
          <a href="#/auth" class="nav-link" role="menuitem" aria-label="Login page">
            <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
            <span>Login</span>
          </a>
        `
        navMenu.appendChild(authLink)
      }
    }
  }

  async initializeNotifications(storyPresenter) {
    const notificationConfig = await storyPresenter.initializeNotifications()

    if (!notificationConfig.hasSupport) {
      console.log("Push messaging is not supported")
      return
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        console.log("Notification permission denied")
        return
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(notificationConfig.vapidKey),
      })

      // Validate subscription before sending to server
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        console.log("Invalid subscription object - skipping notification setup")
        return
      }

      if (!subscription.keys.p256dh || !subscription.keys.auth) {
        console.log("Missing subscription keys - skipping notification setup")
        return
      }

      // Send subscription to server via presenter
      const result = await storyPresenter.subscribeToNotifications(subscription)

      if (result.success) {
        this.showNotificationBanner(result.message)
      }
    } catch (error) {
      console.log("Notification setup skipped:", error.message)
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  showNotificationBanner(message) {
    const existingBanner = document.querySelector(".notification-banner")
    if (existingBanner) {
      existingBanner.remove()
    }

    const banner = document.createElement("div")
    banner.className = "notification-banner"
    banner.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-bell" aria-hidden="true"></i>
        <span>${message}</span>
        <button class="notification-close" aria-label="Close notification">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    `

    document.body.insertBefore(banner, document.body.firstChild)

    banner.querySelector(".notification-close").addEventListener("click", () => {
      banner.remove()
    })

    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove()
      }
    }, 5000)
  }

  setupViewTransitions() {
    if ("startViewTransition" in document) {
      const originalNavigate = this.router.navigate.bind(this.router)
      this.router.navigate = (path) => {
        document.startViewTransition(() => {
          originalNavigate(path)
        })
      }
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new App()
})

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  // This ensures camera streams are stopped when page is closed
  const app = window.app
  if (app && app.currentView && typeof app.currentView.destroy === "function") {
    app.currentView.destroy()
  }
})