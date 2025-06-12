export class StoryPresenter {
  constructor(model, storiesView, addStoryView, authView, storyDetailView) {
    this.model = model
    this.storiesView = storiesView
    this.addStoryView = addStoryView
    this.authView = authView
    this.storyDetailView = storyDetailView
    this.currentPage = 1
    this.pageSize = 10
  }

  async showAuth(mode = 'login') {
    this.authView.render(mode)
    this.authView.onLogin = this.handleLogin.bind(this)
    this.authView.onRegister = this.handleRegister.bind(this)
  }

  async handleLogin(credentials) {
    try {
      const result = await this.model.login(credentials)
      this.authView.showSuccess('Login berhasil! Mengalihkan...', 'login')
    
      // Update navigation immediately
      this.updateNavigation()
    
      setTimeout(() => {
        // Redirect to add-story if that was the intended destination
        const intendedRoute = sessionStorage.getItem('intendedRoute') || '/stories'
        sessionStorage.removeItem('intendedRoute')
        window.location.hash = intendedRoute
      }, 1500)
  } catch (error) {
      this.authView.showError(error.message || 'Login gagal. Silakan coba lagi.', 'login')
    }
  }

  async handleRegister(userData) {
    try {
      await this.model.register(userData)
      this.authView.showSuccess('Registrasi berhasil! Silakan login.', 'register')
      
      setTimeout(() => {
        this.authView.render('login')
      }, 2000)
    } catch (error) {
      this.authView.showError(error.message || 'Registrasi gagal. Silakan coba lagi.', 'register')
    }
  }

  handleLogout() {
    this.model.logout()
    this.updateNavigation()
    this.showNotificationBanner('Anda telah logout. Terima kasih!')
    window.location.hash = '/'
  }

  async showStories(page = 1) {
    try {
      this.currentPage = page
      const stories = await this.model.getAllStories(page, this.pageSize, 1)
      this.storiesView.render(stories, {
        currentPage: this.currentPage,
        hasMore: stories.length === this.pageSize,
        onPageChange: this.showStories.bind(this),
        onStoryClick: this.showStoryDetail.bind(this)
      })
    } catch (error) {
      this.storiesView.showError("Failed to load stories. Please try again later.")
    }
  }

  async showStoryDetail(storyId) {
    try {
      const story = await this.model.getStoryDetail(storyId)
      this.storyDetailView.render(story)
    } catch (error) {
      this.storyDetailView.showError("Failed to load story details. Please try again later.")
    }
  }

  showAddStoryForm() {
    this.addStoryView.render()
    this.addStoryView.onSubmit = this.handleAddStory.bind(this)
  }

  async handleAddStory(storyData) {
    try {
      await this.model.addStory(storyData)
      this.addStoryView.showSuccess("Story added successfully!")

      // Navigate to stories page after successful submission
      setTimeout(() => {
        window.location.hash = "/stories"
      }, 2000)
    } catch (error) {
      this.addStoryView.showError(error.message || "Failed to add story. Please try again.")
    }
  }

  updateNavigation() {
    const navbar = document.querySelector('.navbar')
    if (!navbar) return

    const isAuthenticated = this.model.isAuthenticated()
    const user = this.model.getUser()

    // Update navigation menu
    const navMenu = navbar.querySelector('.nav-menu')
    
    // Remove existing auth-related items
    const existingAuthItems = navMenu.querySelectorAll('.auth-nav-item')
    existingAuthItems.forEach(item => item.remove())

    if (isAuthenticated && user) {
      // Show user profile and logout
      const userProfileHtml = `
      <li role="none" class="auth-nav-item">
        <div class="user-profile">
          <div class="user-avatar">
            <i class="fas fa-user" aria-hidden="true"></i>
          </div>
          <span>${user.name}</span>
          <button class="logout-btn" id="logout-btn" aria-label="Logout">
            <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
          </button>
        </div>
      </li>
    `
    navMenu.insertAdjacentHTML('beforeend', userProfileHtml)
    
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.handleLogout()
    })
  } else {
    // Show login button
    const loginHtml = `
      <li role="none" class="auth-nav-item">
        <a href="#/login" class="nav-link" role="menuitem" aria-label="Login">
          <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
          <span>Login</span>
        </a>
      </li>
    `
    navMenu.insertAdjacentHTML('beforeend', loginHtml)
  }
}

  async initializeNotifications() {
    if (!this.model.isAuthenticated()) return

    try {
      // Check if browser supports notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push messaging is not supported')
        return
      }

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'
      })

      // Send subscription to server
      await this.model.subscribeToNotifications(subscription)
      
      this.showNotificationBanner('Notifikasi push telah diaktifkan!')
    } catch (error) {
      console.error('Error setting up notifications:', error)
    }
  }

  showNotificationBanner(message) {
    const existingBanner = document.querySelector('.notification-banner')
    if (existingBanner) {
      existingBanner.remove()
    }

    const banner = document.createElement('div')
    banner.className = 'notification-banner'
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

    banner.querySelector('.notification-close').addEventListener('click', () => {
      banner.remove()
    })

    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove()
      }
    }, 5000)
  }
}