export class StoryPresenter {
  constructor(model, storiesView, addStoryView, authView, storyDetailView, favoritesView) {
    this.model = model
    this.storiesView = storiesView
    this.addStoryView = addStoryView
    this.authView = authView
    this.storyDetailView = storyDetailView
    this.favoritesView = favoritesView
    this.currentPage = 1
    this.pageSize = 10
  }

  async showStories(page = 1) {
    try {
      console.log("StoryPresenter: Starting showStories, page:", page)
      this.storiesView.showLoading(true)
      this.currentPage = page

      // Check authentication status
      const isAuth = this.model.isAuthenticated()
      console.log("StoryPresenter: Authentication status:", isAuth)

      const result = await this.model.getAllStories(page, this.pageSize, 1)
      console.log("StoryPresenter: Received stories result:", result)

      if (!result || !result.stories) {
        throw new Error("Invalid response from server")
      }

      const viewData = {
        stories: result.stories,
        pagination: {
          currentPage: this.currentPage,
          hasMore: result.hasMore,
          hasPrevious: this.currentPage > 1,
        },
      }

      console.log("StoryPresenter: Rendering view with data:", viewData)
      this.storiesView.render(viewData)
      this.storiesView.setPageChangeHandler(this.showStories.bind(this))
      this.storiesView.setStoryClickHandler((storyId) => {
        console.log("StoryPresenter: Story clicked:", storyId)
        window.location.hash = `#/stories/${storyId}`
      })

      this.storiesView.setFavoriteHandler(this.handleToggleFavorite.bind(this))

      // Show success message if data came from cache
      if (result.source === "cache") {
        this.showCacheNotification()
      }
    } catch (error) {
      console.error("StoryPresenter: Error in showStories:", error)

      // Show more specific error messages
      let errorMessage = "Gagal memuat cerita. Silakan coba lagi."

      if (error.message.includes("401")) {
        errorMessage = "Sesi login telah berakhir. Silakan login kembali untuk melihat semua cerita."
      } else if (error.message.includes("403")) {
        errorMessage = "Akses ditolak. Periksa izin akun Anda."
      } else if (error.message.includes("404")) {
        errorMessage = "Halaman cerita tidak ditemukan."
      } else if (error.message.includes("500")) {
        errorMessage = "Server sedang bermasalah. Coba lagi dalam beberapa menit."
      } else if (!navigator.onLine) {
        errorMessage = "Tidak ada koneksi internet. Menampilkan cerita tersimpan jika tersedia."
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Gagal terhubung ke server. Periksa koneksi internet Anda."
      }

      this.storiesView.showError(errorMessage)
    } finally {
      this.storiesView.showLoading(false)
    }
  }

  showCacheNotification() {
    // Show notification that data is from cache
    const notification = document.createElement("div")
    notification.className = "cache-notification"
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-width: 300px;
    `
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <i class="fas fa-info-circle"></i>
        <span>Menampilkan data tersimpan (offline)</span>
      </div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 5000)
  }

  async showStoryDetail(storyId) {
    try {
      console.log(`StoryPresenter: Showing story detail for ID: ${storyId}`)

      if (!storyId) {
        throw new Error("Story ID is required")
      }

      this.storyDetailView.showLoading(true)
      const story = await this.model.getStoryDetail(storyId)

      console.log(`StoryPresenter: Received story data:`, story)

      if (!story) {
        throw new Error("Story not found")
      }

      // Check if story is favorited
      const isFavorite = await this.model.isFavorite(storyId)
      story.isFavorite = isFavorite

      this.storyDetailView.render(story)
    } catch (error) {
      console.error("StoryPresenter: Error showing story detail:", error)
      this.storyDetailView.showError(`Failed to load story details: ${error.message}`)
    } finally {
      this.storyDetailView.showLoading(false)
    }
  }

  async showFavorites() {
    try {
      this.favoritesView.showLoading(true)
      const favorites = await this.model.getFavorites()

      this.favoritesView.render(favorites)
      this.favoritesView.setStoryClickHandler((storyId) => {
        window.location.hash = `#/stories/${storyId}`
      })
      this.favoritesView.setRemoveFavoriteHandler(this.handleRemoveFavorite.bind(this))
    } catch (error) {
      this.favoritesView.showError("Failed to load favorites. Please try again later.")
    } finally {
      this.favoritesView.showLoading(false)
    }
  }

  async handleToggleFavorite(storyId, story) {
    try {
      const isFavorite = await this.model.isFavorite(storyId)

      if (isFavorite) {
        await this.model.removeFromFavorites(storyId)
        return { isFavorite: false, message: "Removed from favorites" }
      } else {
        await this.model.addToFavorites(story)
        return { isFavorite: true, message: "Added to favorites" }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      throw error
    }
  }

  async handleRemoveFavorite(storyId) {
    try {
      await this.model.removeFromFavorites(storyId)
      // Refresh favorites view
      this.showFavorites()
    } catch (error) {
      console.error("Error removing favorite:", error)
      this.favoritesView.showError("Failed to remove from favorites")
    }
  }

  showAddStoryForm() {
    this.addStoryView.render()
    this.addStoryView.setSubmitHandler(this.handleAddStory.bind(this))
  }

  async handleAddStory(storyData) {
    try {
      this.addStoryView.showLoading(true)
      await this.model.addStory(storyData)
      this.addStoryView.showSuccess("Story added successfully!")

      // Use callback to View for navigation
      this.addStoryView.navigateAfterDelay("#/stories", 2000)
    } catch (error) {
      this.addStoryView.showError(error.message || "Failed to add story. Please try again.")
    } finally {
      this.addStoryView.showLoading(false)
    }
  }

  async showAuth(mode = "login") {
    this.authView.render(mode)
    this.authView.setLoginHandler(this.handleLogin.bind(this))
    this.authView.setRegisterHandler(this.handleRegister.bind(this))
  }

  async handleLogin(credentials) {
    try {
      await this.model.login(credentials)
      this.authView.showSuccess("Login berhasil! Mengalihkan...", "login")

      // Update navigation immediately
      const authState = this.getAuthState()
      window.dispatchEvent(new CustomEvent("authStateChanged", { detail: authState }))

      // Navigate to stories page
      this.authView.navigateAfterDelay("#/stories", 1500)
    } catch (error) {
      this.authView.showError(error.message || "Login gagal. Silakan coba lagi.", "login")
    }
  }

  async handleRegister(userData) {
    try {
      await this.model.register(userData)
      this.authView.showSuccess("Registrasi berhasil! Silakan login.", "register")
      this.authView.switchToLoginAfterDelay(2000)
    } catch (error) {
      this.authView.showError(error.message || "Registrasi gagal. Silakan coba lagi.", "register")
    }
  }

  handleLogout() {
    this.model.logout()
    return {
      isAuthenticated: false,
      user: null,
    }
  }

  getAuthState() {
    return {
      isAuthenticated: this.model.isAuthenticated(),
      user: this.model.getUser(),
    }
  }

  async initializeNotifications() {
    if (!this.model.isAuthenticated()) return

    try {
      return {
        hasSupport: "serviceWorker" in navigator && "PushManager" in window,
        vapidKey: "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk",
      }
    } catch (error) {
      console.error("Error checking notification support:", error)
      return { hasSupport: false }
    }
  }

  async subscribeToNotifications(subscription) {
    try {
      await this.model.subscribeToNotifications(subscription)
      return { success: true, message: "Notifikasi push telah diaktifkan!" }
    } catch (error) {
      console.error("Error subscribing to notifications:", error)
      return { success: false, message: "Gagal mengaktifkan notifikasi" }
    }
  }
}