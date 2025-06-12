export class StoryModel {
  constructor() {
    this.baseUrl = "https://story-api.dicoding.dev/v1"
    this.stories = []
    this.token = localStorage.getItem('authToken')
    this.user = JSON.parse(localStorage.getItem('user') || 'null')
  }

  // Authentication methods
  async register(userData) {
    try {
      this.showLoading(true)
      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("Error registering user:", error)
      throw error
    } finally {
      this.showLoading(false)
    }
  }

  async login(credentials) {
    try {
      this.showLoading(true)
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      // Store authentication data
      this.token = data.loginResult.token
      this.user = {
        userId: data.loginResult.userId,
        name: data.loginResult.name,
      }
      
      localStorage.setItem('authToken', this.token)
      localStorage.setItem('user', JSON.stringify(this.user))

      return data
    } catch (error) {
      console.error("Error logging in:", error)
      throw error
    } finally {
      this.showLoading(false)
    }
  }

  logout() {
    this.token = null
    this.user = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  isAuthenticated() {
    return !!this.token
  }

  getUser() {
    return this.user
  }

  async getAllStories(page = 1, size = 10, location = 1) {
    try {
      this.showLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        location: location.toString()
      })

      const headers = {
        "Content-Type": "application/json",
      }

      // Only add auth header if token exists
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.baseUrl}/stories?${params}`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this.stories = data.listStory || []
      return this.stories
    } catch (error) {
      console.error("Error fetching stories:", error)
      throw error
    } finally {
      this.showLoading(false)
    }
  }

  async getStoryDetail(id) {
    try {
      this.showLoading(true)
      const headers = {
        "Content-Type": "application/json",
      }
      
      // Only add auth header if token exists
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.baseUrl}/stories/${id}`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.story
    } catch (error) {
      console.error("Error fetching story detail:", error)
      throw error
    } finally {
      this.showLoading(false)
    }
  }

  async addStory(storyData) {
    try {
      this.showLoading(true)

      const formData = new FormData()
      formData.append("description", storyData.description)
      
      if (storyData.lat) {
        formData.append("lat", storyData.lat)
      }
      if (storyData.lon) {
        formData.append("lon", storyData.lon)
      }
      if (storyData.photo) {
        formData.append("photo", storyData.photo)
      }

      // Use authenticated endpoint if logged in, otherwise use guest endpoint
      const endpoint = this.token ? "/stories" : "/stories/guest"
      const headers = {}
      
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error adding story:", error)
      throw error
    } finally {
      this.showLoading(false)
    }
  }

  // Push notification methods
  async subscribeToNotifications(subscription) {
    try {
      if (!this.token) {
        throw new Error("Authentication required for notifications")
      }

      const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error subscribing to notifications:", error)
      throw error
    }
  }

  async unsubscribeFromNotifications(endpoint) {
    try {
      if (!this.token) {
        throw new Error("Authentication required for notifications")
      }

      const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        },
        body: JSON.stringify({ endpoint })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error)
      throw error
    }
  }

  showLoading(show) {
    const spinner = document.getElementById("loading-spinner")
    if (spinner) {
      if (show) {
        spinner.classList.add("show")
        spinner.setAttribute("aria-hidden", "false")
      } else {
        spinner.classList.remove("show")
        spinner.setAttribute("aria-hidden", "true")
      }
    }
  }
}