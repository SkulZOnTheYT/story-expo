export class Router {
  constructor() {
    this.routes = {}
    this.currentRoute = null
  }

  addRoute(path, handler) {
    this.routes[path] = handler
  }

  navigate(path) {
    // Handle parameterized routes
    const matchedRoute = this.findMatchingRoute(path)
    if (matchedRoute) {
      this.currentRoute = path
      window.location.hash = path
      matchedRoute.handler(matchedRoute.params)
    } else {
      console.error(`Route ${path} not found`)
      this.navigate("/")
    }
  }

  findMatchingRoute(path) {
    // First try exact match
    if (this.routes[path]) {
      return { handler: this.routes[path], params: {} }
    }

    // Then try parameterized routes
    for (const routePath in this.routes) {
      const params = this.matchRoute(routePath, path)
      if (params) {
        return { handler: this.routes[routePath], params }
      }
    }
    return null
  }

  matchRoute(routePath, actualPath) {
    const routeParts = routePath.split('/')
    const actualParts = actualPath.split('/')

    if (routeParts.length !== actualParts.length) {
      return null
    }

    const params = {}
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].substring(1)
        params[paramName] = actualParts[i]
      } else if (routeParts[i] !== actualParts[i]) {
        return null
      }
    }
    return params
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