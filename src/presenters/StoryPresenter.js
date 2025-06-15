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

  async showAuth(mode = "login") {
    // Presenter only coordinates between Model and View
    // No DOM manipulation here
    this.authView.render(mode)
    this.authView.setLoginHandler(this.handleLogin.bind(this))
    this.authView.setRegisterHandler(this.handleRegister.bind(this))
  }

  async handleLogin(credentials) {
    try {
      await this.model.login(credentials)
      this.authView.showSuccess("Login berhasil! Mengalihkan...", "login")

      // Use callback to View for navigation
      this.authView.navigateAfterDelay("#/stories", 1500)
    } catch (error) {
      this.authView.showError(error.message || "Login gagal. Silakan coba lagi.", "login")
    }
  }

  async handleRegister(userData) {
    try {
      await this.model.register(userData)
      this.authView.showSuccess("Registrasi berhasil! Silakan login.", "register")

      // Use callback to View for mode switching
      this.authView.switchToLoginAfterDelay(2000)
    } catch (error) {
      this.authView.showError(error.message || "Registrasi gagal. Silakan coba lagi.", "register")
    }
  }

  handleLogout() {
    this.model.logout()
    // Return auth state to View for navigation update
    return {
      isAuthenticated: false,
      user: null,
    }
  }

  async showStories(page = 1) {
    try {
      this.storiesView.showLoading(true)
      this.currentPage = page
      const stories = await this.model.getAllStories(page, this.pageSize, 1)

      const viewData = {
        stories,
        pagination: {
          currentPage: this.currentPage,
          hasMore: stories.length === this.pageSize,
        },
      }

      this.storiesView.render(viewData)
      this.storiesView.setPageChangeHandler(this.showStories.bind(this))
      this.storiesView.setStoryClickHandler(this.showStoryDetail.bind(this))
    } catch (error) {
      this.storiesView.showError("Failed to load stories. Please try again later.")
    } finally {
      this.storiesView.showLoading(false)
    }
  }

  async showStoryDetail(storyId) {
    try {
      this.storyDetailView.showLoading(true)
      const story = await this.model.getStoryDetail(storyId)
      this.storyDetailView.render(story)
    } catch (error) {
      this.storyDetailView.showError("Failed to load story details. Please try again later.")
    } finally {
      this.storyDetailView.showLoading(false)
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

  getAuthState() {
    return {
      isAuthenticated: this.model.isAuthenticated(),
      user: this.model.getUser(),
    }
  }

  async initializeNotifications() {
    if (!this.model.isAuthenticated()) return

    try {
      // Check browser support - this should be in View, but we'll return the result
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
