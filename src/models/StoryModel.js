import { IndexedDBHelper } from "../utils/IndexedDBHelper.js"

export class StoryModel {
  constructor() {
    this.baseUrl = "https://story-api.dicoding.dev/v1"
    this.stories = []
    this.token = this.getStoredToken()
    this.user = this.getStoredUser()
    this.dbHelper = new IndexedDBHelper()
    this.isOnline = navigator.onLine

    // Initialize IndexedDB
    this.dbHelper.init().catch(console.error)

    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true
      this.syncOfflineData()
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
    })
  }

  // Storage methods - Model handles all storage operations
  getStoredToken() {
    return localStorage.getItem("authToken")
  }

  getStoredUser() {
    const userData = localStorage.getItem("user")
    return userData ? JSON.parse(userData) : null
  }

  storeAuthData(token, user) {
    localStorage.setItem("authToken", token)
    localStorage.setItem("user", JSON.stringify(user))
    this.token = token
    this.user = user
  }

  clearAuthData() {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    this.token = null
    this.user = null
  }

  // Authentication methods
  async register(userData) {
    try {
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
    }
  }

  async login(credentials) {
    try {
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
      const userData = {
        userId: data.loginResult.userId,
        name: data.loginResult.name,
      }

      this.storeAuthData(data.loginResult.token, userData)

      return data
    } catch (error) {
      console.error("Error logging in:", error)
      throw error
    }
  }

  logout() {
    this.clearAuthData()
  }

  isAuthenticated() {
    return !!this.token
  }

  getUser() {
    return this.user
  }

  async getAllStories(page = 1, size = 10, location = 1) {
    try {
      console.log("Fetching stories - Auth status:", this.isAuthenticated(), "Token:", !!this.token)

      // Try network first
      if (this.isOnline) {
        const params = new URLSearchParams({
          page: page.toString(),
          size: size.toString(),
          location: location.toString(),
        })

        const headers = {
          "Content-Type": "application/json",
        }

        // Add authorization header if authenticated
        if (this.token) {
          headers.Authorization = `Bearer ${this.token}`
          console.log("Adding Authorization header")
        }

        console.log("Making request to:", `${this.baseUrl}/stories?${params}`)
        console.log("Request headers:", headers)

        const response = await fetch(`${this.baseUrl}/stories?${params}`, {
          method: "GET",
          headers,
        })

        console.log("Response status:", response.status)
        console.log("Response ok:", response.ok)

        if (response.ok) {
          const data = await response.json()
          console.log("Response data:", data)

          this.stories = data.listStory || []

          // Cache stories in IndexedDB
          if (this.stories.length > 0) {
            await this.dbHelper.saveStories(this.stories)
          }

          return {
            stories: this.stories,
            currentPage: page,
            hasMore: this.stories.length === size,
            totalStories: this.stories.length,
            source: "network",
          }
        } else {
          // Log error details
          const errorText = await response.text()
          console.error("API Error:", response.status, errorText)

          // If unauthorized, try without auth
          if (response.status === 401 && this.token) {
            console.log("Unauthorized with token, trying without auth...")
            return this.getAllStoriesWithoutAuth(page, size, location)
          }

          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
      }

      // Fallback to cached data
      console.log("Loading stories from cache...")
      const cachedStories = await this.dbHelper.getStories()

      return {
        stories: cachedStories,
        currentPage: 1,
        hasMore: false,
        totalStories: cachedStories.length,
        source: "cache",
      }
    } catch (error) {
      console.error("Error fetching stories:", error)

      // Try to get cached stories as fallback
      try {
        const cachedStories = await this.dbHelper.getStories()
        if (cachedStories.length > 0) {
          return {
            stories: cachedStories,
            currentPage: 1,
            hasMore: false,
            totalStories: cachedStories.length,
            source: "cache",
          }
        }
      } catch (cacheError) {
        console.error("Error loading cached stories:", cacheError)
      }

      throw error
    }
  }

  // Fallback method to try without authentication
  async getAllStoriesWithoutAuth(page = 1, size = 10, location = 1) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        location: location.toString(),
      })

      const headers = {
        "Content-Type": "application/json",
      }

      console.log("Trying request without auth...")
      const response = await fetch(`${this.baseUrl}/stories?${params}`, {
        method: "GET",
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        this.stories = data.listStory || []

        // Cache stories in IndexedDB
        if (this.stories.length > 0) {
          await this.dbHelper.saveStories(this.stories)
        }

        return {
          stories: this.stories,
          currentPage: page,
          hasMore: this.stories.length === size,
          totalStories: this.stories.length,
          source: "network",
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching stories without auth:", error)
      throw error
    }
  }

  async getStoryDetail(id) {
    try {
      console.log(`Fetching story detail for ID: ${id}`)

      // Try network first
      if (this.isOnline) {
        const headers = {
          "Content-Type": "application/json",
        }

        if (this.token) {
          headers.Authorization = `Bearer ${this.token}`
        }

        const url = `${this.baseUrl}/stories/${id}`
        const response = await fetch(url, {
          method: "GET",
          headers,
        })

        if (response.ok) {
          const data = await response.json()
          let story = null

          if (data.error === false && data.story) {
            story = data.story
          } else if (data.story) {
            story = data.story
          } else if (data.error === false && data.data) {
            story = data.data
          } else if (data.data) {
            story = data.data
          } else {
            story = data
          }

          return story
        } else if (response.status === 401 && this.token) {
          // Try without auth if unauthorized
          return this.getStoryDetailWithoutAuth(id)
        }
      }

      // Fallback to cached data
      console.log("Loading story detail from cache...")
      const cachedStory = await this.dbHelper.getStoryById(id)

      if (cachedStory) {
        return cachedStory
      }

      throw new Error("Story not found in cache")
    } catch (error) {
      console.error("Error fetching story detail:", error)
      throw error
    }
  }

  async getStoryDetailWithoutAuth(id) {
    try {
      const headers = {
        "Content-Type": "application/json",
      }

      const url = `${this.baseUrl}/stories/${id}`
      const response = await fetch(url, {
        method: "GET",
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        let story = null

        if (data.error === false && data.story) {
          story = data.story
        } else if (data.story) {
          story = data.story
        } else if (data.error === false && data.data) {
          story = data.data
        } else if (data.data) {
          story = data.data
        } else {
          story = data
        }

        return story
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching story detail without auth:", error)
      throw error
    }
  }

  async addStory(storyData) {
    try {
      if (this.isOnline) {
        // Try to add story online
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

        if (response.ok) {
          const result = await response.json()
          return result
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } else {
        // Save story offline
        console.log("Saving story offline...")
        const offlineStory = {
          id: Date.now().toString(),
          description: storyData.description,
          lat: storyData.lat,
          lon: storyData.lon,
          photo: storyData.photo ? await this.fileToBase64(storyData.photo) : null,
          createdAt: new Date().toISOString(),
          synced: false,
        }

        await this.dbHelper.saveUserStory(offlineStory)

        // Register background sync
        if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready
          await registration.sync.register("sync-stories")
        }

        return {
          error: false,
          message: "Story saved offline and will be synced when online",
        }
      }
    } catch (error) {
      console.error("Error adding story:", error)

      if (!this.isOnline) {
        // Save offline as fallback
        try {
          const offlineStory = {
            id: Date.now().toString(),
            description: storyData.description,
            lat: storyData.lat,
            lon: storyData.lon,
            photo: storyData.photo ? await this.fileToBase64(storyData.photo) : null,
            createdAt: new Date().toISOString(),
            synced: false,
          }

          await this.dbHelper.saveUserStory(offlineStory)

          return {
            error: false,
            message: "Story saved offline and will be synced when online",
          }
        } catch (offlineError) {
          console.error("Error saving story offline:", offlineError)
        }
      }

      throw error
    }
  }

  // Favorites methods
  async addToFavorites(story) {
    try {
      await this.dbHelper.addToFavorites(story)
      return { success: true, message: "Story added to favorites" }
    } catch (error) {
      console.error("Error adding to favorites:", error)
      throw error
    }
  }

  async removeFromFavorites(storyId) {
    try {
      await this.dbHelper.removeFromFavorites(storyId)
      return { success: true, message: "Story removed from favorites" }
    } catch (error) {
      console.error("Error removing from favorites:", error)
      throw error
    }
  }

  async getFavorites() {
    try {
      return await this.dbHelper.getFavorites()
    } catch (error) {
      console.error("Error getting favorites:", error)
      return []
    }
  }

  async isFavorite(storyId) {
    try {
      return await this.dbHelper.isFavorite(storyId)
    } catch (error) {
      console.error("Error checking favorite status:", error)
      return false
    }
  }

  // Utility methods
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  async base64ToFile(base64, filename) {
    const response = await fetch(base64)
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
  }

  // Sync offline data when back online
  async syncOfflineData() {
    try {
      console.log("Syncing offline data...")

      const unsyncedStories = await this.dbHelper.getUnsyncedUserStories()

      for (const story of unsyncedStories) {
        try {
          const formData = new FormData()
          formData.append("description", story.description)

          if (story.lat) formData.append("lat", story.lat)
          if (story.lon) formData.append("lon", story.lon)
          if (story.photo) {
            const file = await this.base64ToFile(story.photo, "story-photo.jpg")
            formData.append("photo", file)
          }

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

          if (response.ok) {
            await this.dbHelper.markUserStorySynced(story.id)
            console.log(`Story ${story.id} synced successfully`)
          }
        } catch (error) {
          console.error(`Error syncing story ${story.id}:`, error)
        }
      }
    } catch (error) {
      console.error("Error syncing offline data:", error)
    }
  }

  // Push notification methods
  async subscribeToNotifications(subscription) {
    try {
      if (!this.token) {
        throw new Error("Authentication required for notifications")
      }

      // Validate subscription object
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        throw new Error("Invalid subscription object")
      }

      if (!subscription.keys.p256dh || !subscription.keys.auth) {
        throw new Error("Missing subscription keys")
      }

      const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        }),
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
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ endpoint }),
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
}