export class Router {
  constructor() {
    this.routes = {}
    this.currentRoute = null
  }

  addRoute(path, handler) {
    this.routes[path] = handler
  }

  navigate(path) {
    if (this.routes[path]) {
      this.currentRoute = path
      window.location.hash = path
      this.routes[path]()
    } else {
      console.error(`Route ${path} not found`)
      this.navigate("/")
    }
  }

  init() {
    // Handle initial load
    const initialPath = window.location.hash.substring(1) || "/"
    this.navigate(initialPath)

    // Handle hash changes
    window.addEventListener("hashchange", () => {
      const path = window.location.hash.substring(1) || "/"
      if (this.routes[path]) {
        this.currentRoute = path
        this.routes[path]()
      }
    })
  }

  getCurrentRoute() {
    return this.currentRoute
  }
}
