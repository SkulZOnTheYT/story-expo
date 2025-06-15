import { Router } from "./router/Router.js"
import { StoryPresenter } from "./presenters/StoryPresenter.js"
import { StoryModel } from "./models/StoryModel.js"
import { HomeView } from "./views/HomeView.js"
import { StoriesView } from "./views/StoriesView.js"
import { AddStoryView } from "./views/AddStoryView.js"
import { AuthView } from "./views/AuthView.js"
import { StoryDetailView } from "./views/StoryDetailView.js"

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

    // Initialize presenter
    const storyPresenter = new StoryPresenter(this.storyModel, storiesView, addStoryView, authView, storyDetailView)

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

    // Initialize router
    this.router.init()

    // Setup navigation
    this.setupNavigation(storyPresenter)

    // Setup View Transition API
    this.setupViewTransitions()

    // Update navigation based on auth state
    this.updateNavigation(storyPresenter.getAuthState())

    // Initialize notifications if authenticated
    if (this.storyModel.isAuthenticated()) {
      this.initializeNotifications(storyPresenter)
    }
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
  }

  // View handles navigation updates
  updateNavigation(authState) {
    const navbar = document.querySelector(".navbar")
    if (!navbar) return

    const navMenu = navbar.querySelector(".nav-menu")
    const existingProfile = navMenu.querySelector("li:has(.user-profile)")

    if (authState.isAuthenticated && authState.user) {
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
      if (existingProfile) {
        existingProfile.remove()
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

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js")

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: notificationConfig.vapidKey,
      })

      // Send subscription to server via presenter
      const result = await storyPresenter.subscribeToNotifications(subscription)

      if (result.success) {
        this.showNotificationBanner(result.message)
      }
    } catch (error) {
      console.error("Error setting up notifications:", error)
    }
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
