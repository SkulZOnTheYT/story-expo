export class Router {
  constructor() {
    this.routes = {}
    this.currentRoute = null
    this.notFoundHandler = null
  }

  addRoute(path, handler) {
    this.routes[path] = handler
  }

  setNotFoundHandler(handler) {
    this.notFoundHandler = handler
  }

  navigate(path) {
    // Handle parameterized routes
    const matchedRoute = this.matchRoute(path)
    if (matchedRoute) {
      this.currentRoute = path
      window.location.hash = path
      matchedRoute.handler(matchedRoute.params)
    } else {
      console.error(`Route ${path} not found`)
      if (this.notFoundHandler) {
        this.notFoundHandler()
      } else {
        // Fallback to home if no 404 handler
        this.navigate("/")
      }
    }
  }

  matchRoute(path) {
    // First try exact match
    if (this.routes[path]) {
      return { handler: this.routes[path], params: {} }
    }

    // Then try parameterized routes
    for (const routePath in this.routes) {
      const params = this.extractParams(routePath, path)
      if (params !== null) {
        return { handler: this.routes[routePath], params }
      }
    }

    return null
  }

  extractParams(routePath, actualPath) {
    const routeParts = routePath.split("/")
    const actualParts = actualPath.split("/")

    if (routeParts.length !== actualParts.length) {
      return null
    }

    const params = {}
    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i]
      const actualPart = actualParts[i]

      if (routePart.startsWith(":")) {
        // This is a parameter
        const paramName = routePart.substring(1)
        params[paramName] = actualPart
      } else if (routePart !== actualPart) {
        // Parts don't match and it's not a parameter
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
      const matchedRoute = this.matchRoute(path)
      if (matchedRoute) {
        this.currentRoute = path
        matchedRoute.handler(matchedRoute.params)
      } else if (this.notFoundHandler) {
        this.notFoundHandler()
      }
    })
  }

  getCurrentRoute() {
    return this.currentRoute
  }
}