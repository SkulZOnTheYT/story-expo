export class FavoritesView {
  constructor() {
    this.onStoryClick = null
    this.onRemoveFavorite = null
  }

  render(favorites) {
    const container = document.getElementById("app-container")

    if (!favorites || favorites.length === 0) {
      container.innerHTML = `
        <div class="page-transition fade-in">
          <div class="stories-header">
            <h2 class="stories-title">
              <i class="fas fa-heart" aria-hidden="true"></i>
              Cerita Favorit
            </h2>
            <p class="stories-subtitle">
              <i class="fas fa-info-circle" aria-hidden="true"></i>
              Belum ada cerita favorit. Tambahkan cerita ke favorit dari halaman Stories.
            </p>
            <div style="text-align: center; margin-top: 2rem;">
              <a href="#/stories" class="btn btn-primary">
                <i class="fas fa-book-open" aria-hidden="true"></i>
                Jelajahi Cerita
              </a>
            </div>
          </div>
        </div>
      `
      return
    }

    const favoritesHtml = favorites
      .map(
        (story, index) => `
        <article class="story-card favorite-card" role="article" style="animation-delay: ${index * 0.1}s">
          <img 
            src="${story.photoUrl || "/placeholder.svg?height=220&width=380"}" 
            alt="${story.description ? `Foto untuk cerita: ${story.description.substring(0, 50)}...` : "Foto cerita"}"
            class="story-image"
            loading="lazy"
          />
          <div class="story-content">
            <div class="favorite-header">
              <h3 class="story-title">${story.name || "Cerita Tanpa Judul"}</h3>
              <button 
                class="favorite-btn active" 
                data-story-id="${story.id}"
                aria-label="Hapus dari favorit"
                title="Hapus dari favorit"
              >
                <i class="fas fa-heart" aria-hidden="true"></i>
              </button>
            </div>
            <p class="story-description">${story.description || "Tidak ada deskripsi tersedia"}</p>
            <div class="story-meta">
              <span class="story-author" aria-label="Penulis cerita">
                <i class="fas fa-user" aria-hidden="true"></i>
                ${story.name || "Anonim"}
              </span>
              <span class="story-date" aria-label="Ditambahkan ke favorit">
                <i class="fas fa-heart" aria-hidden="true"></i>
                ${this.formatDate(story.addedAt)}
              </span>
            </div>
          </div>
        </article>
      `,
      )
      .join("")

    container.innerHTML = `
      <div class="page-transition slide-in">
        <header class="stories-header">
          <h2 class="stories-title">
            <i class="fas fa-heart" aria-hidden="true"></i>
            Cerita Favorit
          </h2>
          <p class="stories-subtitle">
            <i class="fas fa-bookmark" aria-hidden="true"></i>
            ${favorites.length} cerita tersimpan dalam favorit Anda
          </p>
        </header>
        <section class="stories-grid" role="main" aria-label="Daftar cerita favorit">
          ${favoritesHtml}
        </section>
      </div>
    `

    this.initializeFavoriteHandlers(favorites)
  }

  initializeFavoriteHandlers(favorites) {
    // Add click handlers to story cards
    favorites.forEach((story, index) => {
      const storyCard = document.querySelector(`article.favorite-card:nth-child(${index + 1})`)
      if (storyCard) {
        storyCard.style.cursor = "pointer"

        // Story click handler
        storyCard.addEventListener("click", (e) => {
          // Prevent click if clicking on favorite button
          if (e.target.closest(".favorite-btn")) {
            return
          }

          if (this.onStoryClick) {
            this.onStoryClick(story.id)
          }
        })

        // Favorite button handler
        const favoriteBtn = storyCard.querySelector(".favorite-btn")
        if (favoriteBtn) {
          favoriteBtn.addEventListener("click", (e) => {
            e.stopPropagation()
            if (this.onRemoveFavorite) {
              this.onRemoveFavorite(story.id)
            }
          })
        }

        // Hover effects
        storyCard.addEventListener("mouseenter", () => {
          storyCard.style.transform = "translateY(-8px)"
        })

        storyCard.addEventListener("mouseleave", () => {
          storyCard.style.transform = "translateY(0)"
        })
      }
    })
  }

  formatDate(dateString) {
    if (!dateString) return "Tanggal tidak diketahui"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return "Tanggal tidak valid"
    }
  }

  showError(message) {
    const container = document.getElementById("app-container")
    container.innerHTML = `
      <div class="page-transition">
        <div class="stories-header">
          <h2 class="stories-title">
            <i class="fas fa-heart" aria-hidden="true"></i>
            Cerita Favorit
          </h2>
          <div class="error-message" role="alert">
            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
            ${message}
          </div>
        </div>
      </div>
    `
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

  setStoryClickHandler(handler) {
    this.onStoryClick = handler
  }

  setRemoveFavoriteHandler(handler) {
    this.onRemoveFavorite = handler
  }
}
