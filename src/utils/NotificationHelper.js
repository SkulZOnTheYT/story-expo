export class NotificationHelper {
  constructor() {
    this.vapidPublicKey = "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"
    this.registration = null
  }

  async init() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push messaging is not supported")
      return false
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register("/sw.js")
      console.log("Service Worker registered successfully")
      return true
    } catch (error) {
      console.error("Service Worker registration failed:", error)
      return false
    }
  }

  async requestPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  async subscribe() {
    if (!this.registration) {
      const initialized = await this.init()
      if (!initialized) return null
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      })

      console.log("Push subscription successful:", subscription)
      return subscription
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error)
      return null
    }
  }

  async unsubscribe() {
    if (!this.registration) return false

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        console.log("Push subscription cancelled")
        return true
      }
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error)
    }
    return false
  }

  async getSubscription() {
    if (!this.registration) {
      await this.init()
    }

    if (!this.registration) return null

    try {
      return await this.registration.pushManager.getSubscription()
    } catch (error) {
      console.error("Failed to get push subscription:", error)
      return null
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

  showLocalNotification(title, options = {}) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, options)
    }
  }
}
