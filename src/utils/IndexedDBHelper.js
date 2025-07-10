export class IndexedDBHelper {
  constructor() {
    this.dbName = "StoryExplorerDB"
    this.version = 1
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error("Error opening IndexedDB:", request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log("IndexedDB opened successfully")
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create stories store
        if (!db.objectStoreNames.contains("stories")) {
          const storiesStore = db.createObjectStore("stories", { keyPath: "id" })
          storiesStore.createIndex("createdAt", "createdAt", { unique: false })
          storiesStore.createIndex("name", "name", { unique: false })
        }

        // Create favorites store
        if (!db.objectStoreNames.contains("favorites")) {
          const favoritesStore = db.createObjectStore("favorites", { keyPath: "id" })
          favoritesStore.createIndex("addedAt", "addedAt", { unique: false })
        }

        // Create user stories store (for offline created stories)
        if (!db.objectStoreNames.contains("userStories")) {
          const userStoriesStore = db.createObjectStore("userStories", { keyPath: "id" })
          userStoriesStore.createIndex("createdAt", "createdAt", { unique: false })
          userStoriesStore.createIndex("synced", "synced", { unique: false })
        }

        console.log("IndexedDB stores created")
      }
    })
  }

  // Stories operations
  async saveStories(stories) {
    if (!this.db) await this.init()

    const transaction = this.db.transaction(["stories"], "readwrite")
    const store = transaction.objectStore("stories")

    const promises = stories.map((story) => {
      return new Promise((resolve, reject) => {
        const request = store.put({
          ...story,
          cachedAt: new Date().toISOString(),
        })
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    })

    return Promise.all(promises)
  }

  async getStories() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readonly")
      const store = transaction.objectStore("stories")
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getStoryById(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["stories"], "readonly")
      const store = transaction.objectStore("stories")
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Favorites operations
  async addToFavorites(story) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["favorites"], "readwrite")
      const store = transaction.objectStore("favorites")
      const request = store.put({
        ...story,
        addedAt: new Date().toISOString(),
      })

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromFavorites(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["favorites"], "readwrite")
      const store = transaction.objectStore("favorites")
      const request = store.delete(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getFavorites() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["favorites"], "readonly")
      const store = transaction.objectStore("favorites")
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => reject(request.error)
    })
  }

  async isFavorite(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["favorites"], "readonly")
      const store = transaction.objectStore("favorites")
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(!!request.result)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // User stories operations (for offline functionality)
  async saveUserStory(story) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["userStories"], "readwrite")
      const store = transaction.objectStore("userStories")
      const request = store.put({
        ...story,
        id: story.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        synced: false,
      })

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getUserStories() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["userStories"], "readonly")
      const store = transaction.objectStore("userStories")
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedUserStories() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["userStories"], "readonly")
      const store = transaction.objectStore("userStories")
      const index = store.index("synced")
      const request = index.getAll(false)

      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => reject(request.error)
    })
  }

  async markUserStorySynced(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["userStories"], "readwrite")
      const store = transaction.objectStore("userStories")
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const story = getRequest.result
        if (story) {
          story.synced = true
          const putRequest = store.put(story)
          putRequest.onsuccess = () => resolve(putRequest.result)
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve(null)
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteUserStory(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["userStories"], "readwrite")
      const store = transaction.objectStore("userStories")
      const request = store.delete(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Clear all data
  async clearAllData() {
    if (!this.db) await this.init()

    const storeNames = ["stories", "favorites", "userStories"]
    const promises = storeNames.map((storeName) => {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })

    return Promise.all(promises)
  }
}
