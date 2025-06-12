export class AnimationUtils {
  static async createCustomPageTransition(oldContent, newContent, direction = "forward") {
    const animations = []

    // Fade out old content
    animations.push(
      oldContent.animate(
        [
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: direction === "forward" ? "translateX(-100%)" : "translateX(100%)" },
        ],
        { duration: 300, easing: "ease-out" },
      ).finished,
    )

    // Fade in new content
    animations.push(
      newContent.animate(
        [
          { opacity: 0, transform: direction === "forward" ? "translateX(100%)" : "translateX(-100%)" },
          { opacity: 1, transform: "translateX(0)" },
        ],
        { duration: 300, easing: "ease-in" },
      ).finished,
    )

    await Promise.all(animations)

    const container = document.getElementById("app-container")
    container.innerHTML = ""
    container.appendChild(newContent)
  }
}
