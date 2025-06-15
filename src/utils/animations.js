export class AnimationUtils {
  static async createCustomPageTransition(oldContent, newContent, direction = "forward") {
    // Get the app container
    const container = document.getElementById("app-container")
    if (!container) return

    // Create a wrapper for the old content
    const oldWrapper = document.createElement("div")
    oldWrapper.style.position = "absolute"
    oldWrapper.style.top = "0"
    oldWrapper.style.left = "0"
    oldWrapper.style.width = "100%"
    oldWrapper.style.height = "100%"
    oldWrapper.style.zIndex = "1"
    oldWrapper.appendChild(oldContent)

    // Create a wrapper for the new content
    const newWrapper = document.createElement("div")
    newWrapper.style.position = "absolute"
    newWrapper.style.top = "0"
    newWrapper.style.left = "0"
    newWrapper.style.width = "100%"
    newWrapper.style.height = "100%"
    newWrapper.style.zIndex = "2"
    newWrapper.style.opacity = "0"
    newWrapper.appendChild(newContent)

    // Add both wrappers to the container
    container.style.position = "relative"
    container.style.overflow = "hidden"
    container.appendChild(oldWrapper)
    container.appendChild(newWrapper)

    // Define animation properties based on direction
    let oldAnimation, newAnimation

    if (direction === "forward") {
      oldAnimation = [
        { opacity: 1, transform: "translateX(0)" },
        { opacity: 0, transform: "translateX(-30px)" },
      ]

      newAnimation = [
        { opacity: 0, transform: "translateX(30px)" },
        { opacity: 1, transform: "translateX(0)" },
      ]
    } else {
      oldAnimation = [
        { opacity: 1, transform: "translateX(0)" },
        { opacity: 0, transform: "translateX(30px)" },
      ]

      newAnimation = [
        { opacity: 0, transform: "translateX(-30px)" },
        { opacity: 1, transform: "translateX(0)" },
      ]
    }

    // Animate old content out
    const oldAnimationOptions = {
      duration: 300,
      easing: "ease-out",
      fill: "forwards",
    }

    // Animate new content in
    const newAnimationOptions = {
      duration: 300,
      easing: "ease-out",
      fill: "forwards",
      delay: 150,
    }

    // Run animations
    const oldAnimationPromise = oldWrapper.animate(oldAnimation, oldAnimationOptions).finished
    const newAnimationPromise = newWrapper.animate(newAnimation, newAnimationOptions).finished

    // Wait for animations to complete
    await Promise.all([oldAnimationPromise, newAnimationPromise])

    // Clean up
    container.innerHTML = ""
    container.style.position = ""
    container.style.overflow = ""

    return true
  }

  static fadeIn(element, duration = 300) {
    if (!element) return

    element.style.opacity = "0"
    element.style.display = "block"

    const animation = element.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration,
      easing: "ease-in-out",
      fill: "forwards",
    })

    return animation.finished
  }

  static fadeOut(element, duration = 300) {
    if (!element) return

    const animation = element.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration,
      easing: "ease-in-out",
      fill: "forwards",
    })

    animation.finished.then(() => {
      element.style.display = "none"
    })

    return animation.finished
  }

  static slideIn(element, direction = "right", duration = 300) {
    if (!element) return

    let initialTransform

    switch (direction) {
      case "left":
        initialTransform = "translateX(-100%)"
        break
      case "right":
        initialTransform = "translateX(100%)"
        break
      case "top":
        initialTransform = "translateY(-100%)"
        break
      case "bottom":
        initialTransform = "translateY(100%)"
        break
      default:
        initialTransform = "translateX(100%)"
    }

    element.style.transform = initialTransform
    element.style.display = "block"

    const animation = element.animate(
      [
        { transform: initialTransform, opacity: 0 },
        { transform: "translate(0)", opacity: 1 },
      ],
      {
        duration,
        easing: "ease-out",
        fill: "forwards",
      },
    )

    return animation.finished
  }

  static slideOut(element, direction = "right", duration = 300) {
    if (!element) return

    let finalTransform

    switch (direction) {
      case "left":
        finalTransform = "translateX(-100%)"
        break
      case "right":
        finalTransform = "translateX(100%)"
        break
      case "top":
        finalTransform = "translateY(-100%)"
        break
      case "bottom":
        finalTransform = "translateY(100%)"
        break
      default:
        finalTransform = "translateX(100%)"
    }

    const animation = element.animate(
      [
        { transform: "translate(0)", opacity: 1 },
        { transform: finalTransform, opacity: 0 },
      ],
      {
        duration,
        easing: "ease-in",
        fill: "forwards",
      },
    )

    animation.finished.then(() => {
      element.style.display = "none"
    })

    return animation.finished
  }
}
