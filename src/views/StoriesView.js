export class StoriesView {
  constructor() {
    this.onPageChange = null
    this.onStoryClick = null
  }

  render(viewData) {
    console.log("StoriesView: Rendering with data:", viewData) // Debug log

    const { stories, pagination } = viewData
    const container = document.getElementById("app-container")

    if (!container) {
      console.error("StoriesView: app-container not found!")
      return
    }

    if (!stories || stories.length === 0) {
      console.log("StoriesView: No stories to display")
      container.innerHTML = `
        <div class="page-transition fade-in">
          <div class="stories-header">
            <h2 class="stories-title">
              <i class="fas fa-book-open" aria-hidden="true"></i>
              Cerita Terbaru
            </h2>
            <p class="stories-subtitle">
              <i class="fas fa-info-circle" aria-hidden="true"></i>
              Belum ada cerita yang tersedia. ${navigator.onLine ? "Coba refresh halaman." : "Tidak ada data offline yang tersimpan."}
            </p>
            <div style="text-align: center; margin-top: 2rem;">
              ${navigator.onLine ? 
                `<button onclick="window.location.reload()" class="btn btn-primary">
                  <i class="fas fa-refresh" aria-hidden="true"></i>
                  Refresh Halaman
                </button>` :
                `<div class="offline-message">
                  <i class="fas fa-wifi-slash" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem;"></i>
                  <p>Anda sedang offline. Cerita akan muncul setelah terhubung ke internet.</p>
                </div>`
              }
            </div>
          </div>
        </div>
      `
      return
    }

    console.log(`StoriesView: Rendering ${stories.length} stories`)

    const storiesHtml = stories
      .map(
        (story, index) => `
    <article class="story-card" role="article" style="animation-delay: ${index * 0.1}s" data-story-id="${story.id}">
      <div class="story-image-container">
        <img 
          src="${story.photoUrl || "/placeholder.svg"}" 
          alt="${story.description ? `Foto untuk cerita: ${story.description.substring(0, 50)}...` : "Foto cerita"}"
          class="story-image"
          loading="lazy"
          onerror="this.src='/placeholder.svg'"
        />
        <button class="favorite-btn" data-story-id="${story.id}" aria-label="Toggle favorite">
          <i class="fas fa-heart" aria-hidden="true"></i>
        </button>
      </div>
      <div class="story-content">
        <h3 class="story-title">${story.name || story.title || "Cerita Tanpa Judul"}</h3>
        <p class="story-description">${story.description || "Tidak ada deskripsi tersedia"}</p>
        <div class="story-meta">
          <span class="story-author" aria-label="Penulis cerita">
            <i class="fas fa-user" aria-hidden="true"></i>
            ${story.name || story.author || "Anonim"}
          </span>
          <span class="story-date" aria-label="Tanggal cerita">
            <i class="fas fa-calendar-alt" aria-hidden="true"></i>
            ${this.formatDate(story.createdAt)}
          </span>
        </div>
        ${
          story.lat && story.lon
            ? `
            <div class="map-container" id="map-${story.id}" aria-label="Peta lokasi cerita"></div>
        `
            : `
            <div class="no-location">
              <i class="fas fa-map-marker-alt" style="color: #9ca3af;"></i>
              <span style="color: #9ca3af; font-size: 0.875rem;">Lokasi tidak tersedia</span>
            </div>
        `
        }
      </div>
    </article>
  `,
      )
      .join("")

    const paginationHtml = pagination
      ? `
    <div class="pagination-container">
        <button 
            class="pagination-btn" 
            id="prev-page-btn"
            ${!pagination.hasPrevious ? "disabled" : ""}
            aria-label="Halaman sebelumnya"
        >
            <i class="fas fa-chevron-left" aria-hidden="true"></i>
            Sebelumnya
        </button>
        <span class="pagination-info">Halaman ${pagination.currentPage}</span>
        <button 
            class="pagination-btn" 
            id="next-page-btn"
            ${!pagination.hasMore ? "disabled" : ""}
            aria-label="Halaman selanjutnya"
        >
            Selanjutnya
            <i class="fas fa-chevron-right" aria-hidden="true"></i>
        </button>
    </div>
`
      : ""

    container.innerHTML = `
        <div class="page-transition slide-in">
            <header class="stories-header">
                <h2 class="stories-title">
                    <i class="fas fa-book-open" aria-hidden="true"></i>
                    Cerita Terbaru
                </h2>
                <p class="stories-subtitle">
                    <i class="fas fa-globe" aria-hidden="true"></i>
                    Jelajahi cerita-cerita menarik dari seluruh dunia (${stories.length} cerita)
                </p>
            </header>
            <section class="stories-grid" role="main" aria-label="Daftar cerita">
                ${storiesHtml}
            </section>
            ${paginationHtml}
        </div>
    `

    // Initialize story click handlers
    this.initializeStoryClickHandlers(stories)

    // Initialize pagination handlers
    this.initializePagination(pagination)

    // Initialize favorite status for each story
    this.initializeFavoriteStatus(stories)
    // Initialize maps with enhanced layers
    // Wait for Leaflet to be fully loaded
    setTimeout(() => {
      this.waitForLeaflet().then(() => {
        stories.forEach((story) => {
          if (story.lat && story.lon) {
            this.initializeEnhancedMap(story)
          }
        })
      })
    }, 500)
  }

  async waitForLeaflet() {
    return new Promise((resolve) => {
      if (typeof L !== 'undefined') {
        resolve()
        return
      }
      
      const checkLeaflet = () => {
        if (typeof L !== 'undefined') {
          resolve()
        } else {
          setTimeout(checkLeaflet, 200)
        }
      }
      
      checkLeaflet()
    })
  }

  async initializeFavoriteStatus(stories) {
    // Check favorite status for each story
    for (const story of stories) {
      try {
        const isFavorite = await this.onCheckFavorite ? await this.onCheckFavorite(story.id) : false
        const favoriteBtn = document.querySelector(`[data-story-id="${story.id}"] .favorite-btn`)
        if (favoriteBtn) {
          if (isFavorite) {
            favoriteBtn.classList.add('active')
          } else {
            favoriteBtn.classList.remove('active')
          }
        }
      } catch (error) {
        console.error('Error checking favorite status:', error)
      }
    }
  }

  initializePagination(pagination) {
    if (!pagination) return

    const prevBtn = document.getElementById("prev-page-btn")
    const nextBtn = document.getElementById("next-page-btn")

    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.preventDefault()
        if (!prevBtn.disabled && this.onPageChange) {
          this.onPageChange(pagination.currentPage - 1)
        }
      })
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.preventDefault()
        if (!nextBtn.disabled && this.onPageChange) {
          this.onPageChange(pagination.currentPage + 1)
        }
      })
    }
  }

  initializeStoryClickHandlers(stories) {
    // Add click handlers to story cards
    stories.forEach((story, index) => {
      const storyCard = document.querySelector(`[data-story-id="${story.id}"]`)
      if (storyCard) {
        storyCard.style.cursor = "pointer"
        storyCard.addEventListener("click", (e) => {
          // Prevent click if clicking on map or favorite button
          if (e.target.closest(".map-container") || e.target.closest(".favorite-btn")) {
            return
          }

          if (this.onStoryClick) {
            this.onStoryClick(story.id)
          }
        })

        // Add hover effect
        storyCard.addEventListener("mouseenter", () => {
          storyCard.style.transform = "translateY(-8px)"
        })

        storyCard.addEventListener("mouseleave", () => {
          storyCard.style.transform = "translateY(0)"
        })

        // Add favorite button functionality
        const favoriteBtn = storyCard.querySelector(".favorite-btn")
        if (favoriteBtn) {
          favoriteBtn.addEventListener("click", (e) => {
            e.stopPropagation()
            this.handleFavoriteClick(story.id, story, favoriteBtn)
          })
        }
      }
    })
  }

  async handleFavoriteClick(storyId, story, button) {
    if (!this.onFavoriteToggle) return
    
    try {
      // Toggle favorite status
      const result = await this.onFavoriteToggle(storyId, story)
      
      // Update button appearance
      if (result.isFavorite) {
        button.classList.add('active')
      } else {
        button.classList.remove('active')
      }
      
      // Show feedback
      this.showFavoriteMessage(result.message)
    } catch (error) {
      console.error('Error toggling favorite:', error)
      this.showFavoriteMessage('Gagal mengubah status favorit', 'error')
    }
  }

  showFavoriteMessage(message, type = 'success') {
    // Create temporary message
    const messageEl = document.createElement('div')
    messageEl.className = `favorite-message ${type === 'error' ? 'error' : 'success'}`
    messageEl.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `
    messageEl.textContent = message
    
    document.body.appendChild(messageEl)
    
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove()
      }
    }, 3000)
  }
  initializeEnhancedMap(story) {
    const mapElement = document.getElementById(`map-${story.id}`)
    if (!mapElement) return
    
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded')
      mapElement.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 0.75rem;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #f59e0b; margin-bottom: 1rem;"></i>
          <p>Peta tidak dapat dimuat - Library tidak tersedia</p>
        </div>
      `
      return
    }

    try {
      // Pastikan container memiliki ukuran yang tepat
      mapElement.style.height = '300px'
      mapElement.style.width = '100%'
      
      const map = L.map(`map-${story.id}`, {
        center: [story.lat, story.lon],
        zoom: 13,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true
      })

      // Define multiple tile layers
      const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        name: "OpenStreetMap",
      })

      osmLayer.addTo(map)

      // Force map to resize after a short delay
      setTimeout(() => {
        if (map) {
          map.invalidateSize()
        }
      }, 100)

      // Custom marker icon
      const customIcon = L.divIcon({
        html: `<div style="background: linear-gradient(135deg, #6366f1, #ec4899); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 3px solid white;">
                     <i class="fas fa-map-marker-alt" style="color: white; font-size: 14px;"></i>
                   </div>`,
        className: "custom-marker",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const marker = L.marker([story.lat, story.lon], { icon: customIcon }).addTo(map)

      const popupContent = `
            <div style="max-width: 250px; font-family: var(--font-primary);">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <i class="fas fa-map-marker-alt" style="color: #6366f1;"></i>
                    <strong style="color: #1f2937;">${story.name || "Cerita"}</strong>
                </div>
                ${story.description ? `<p style="margin: 0; color: #6b7280; font-size: 0.875rem; line-height: 1.4;">${story.description.substring(0, 100)}${story.description.length > 100 ? "..." : ""}</p>` : ""}
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #9ca3af;">
                    <i class="fas fa-location-dot"></i>
                    ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
                </div>
            </div>
        `

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: "custom-popup",
      })
      
      // Trigger another resize after marker is added
      setTimeout(() => {
        if (map) {
          map.invalidateSize()
        }
      }, 200)
      
    } catch (error) {
      console.error("Error initializing map:", error)
      mapElement.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 0.75rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #f59e0b; margin-bottom: 1rem;"></i>
                <p>Peta tidak dapat dimuat</p>
            </div>
        `
    }
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
    console.error("StoriesView: Showing error:", message)
    const container = document.getElementById("app-container")
    if (!container) return

    container.innerHTML = `
            <div class="page-transition">
                <div class="stories-header">
                    <h2 class="stories-title">
                        <i class="fas fa-book-open" aria-hidden="true"></i>
                        Cerita Terbaru
                    </h2>
                    <div class="error-message" role="alert">
                        <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                        ${message}
                    </div>
                    <div style="text-align: center; margin-top: 2rem;">
                        <button onclick="window.location.reload()" class="btn btn-primary">
                            <i class="fas fa-refresh" aria-hidden="true"></i>
                            Coba Lagi
                        </button>
                        <a href="#/" class="btn btn-secondary" style="margin-left: 1rem;">
                            <i class="fas fa-home" aria-hidden="true"></i>
                            Kembali ke Home
                        </a>
                    </div>
                </div>
            </div>
        `
  }

  // View handles loading state
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

  // Set handlers from Presenter
  setPageChangeHandler(handler) {
    this.onPageChange = handler
  }

  setStoryClickHandler(handler) {
    this.onStoryClick = handler
  }

  setFavoriteHandler(handler) {
    this.onFavoriteToggle = handler
  }

  setCheckFavoriteHandler(handler) {
    this.onCheckFavorite = handler
  }
}
