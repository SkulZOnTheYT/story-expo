import L from "leaflet"

export class StoriesView {
  constructor() {
    this.onPageChange = null
    this.onStoryClick = null
  }

  render(viewData) {
    const { stories, pagination } = viewData
    const container = document.getElementById("app-container")

    if (!stories || stories.length === 0) {
      container.innerHTML = `
            <div class="page-transition fade-in">
                <div class="stories-header">
                    <h2 class="stories-title">
                        <i class="fas fa-book-open" aria-hidden="true"></i>
                        Cerita Terbaru
                    </h2>
                    <p class="stories-subtitle">
                        <i class="fas fa-info-circle" aria-hidden="true"></i>
                        Belum ada cerita yang tersedia
                    </p>
                </div>
            </div>
        `
      return
    }

    const storiesHtml = stories
      .map(
        (story, index) => `
            <article class="story-card" role="article" style="animation-delay: ${index * 0.1}s">
                <img 
                    src="${story.photoUrl || "/placeholder.svg?height=220&width=380"}" 
                    alt="${story.description ? `Foto untuk cerita: ${story.description.substring(0, 50)}...` : "Foto cerita"}"
                    class="story-image"
                    loading="lazy"
                />
                <div class="story-content">
                    <h3 class="story-title">${story.name || "Cerita Tanpa Judul"}</h3>
                    <p class="story-description">${story.description || "Tidak ada deskripsi tersedia"}</p>
                    <div class="story-meta">
                        <span class="story-author" aria-label="Penulis cerita">
                            <i class="fas fa-user" aria-hidden="true"></i>
                            ${story.name || "Anonim"}
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
                        : ""
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
                ${pagination.currentPage <= 1 ? "disabled" : ""}
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
                    Jelajahi cerita-cerita menarik dari seluruh dunia
                </p>
            </header>
            <section class="stories-grid" role="main" aria-label="Daftar cerita">
                ${storiesHtml}
            </section>
            ${paginationHtml}
        </div>
    `

    // Initialize pagination handlers
    this.initializePagination(pagination)

    // Initialize maps with enhanced layers
    setTimeout(() => {
      stories.forEach((story) => {
        if (story.lat && story.lon) {
          this.initializeEnhancedMap(story)
        }
      })
    }, 100)
  }

  initializePagination(pagination) {
    if (!pagination) return

    const prevBtn = document.getElementById("prev-page-btn")
    const nextBtn = document.getElementById("next-page-btn")

    if (prevBtn && !prevBtn.disabled) {
      prevBtn.addEventListener("click", () => {
        if (this.onPageChange) {
          this.onPageChange(pagination.currentPage - 1)
        }
      })
    }

    if (nextBtn && !nextBtn.disabled) {
      nextBtn.addEventListener("click", () => {
        if (this.onPageChange) {
          this.onPageChange(pagination.currentPage + 1)
        }
      })
    }
  }

  initializeEnhancedMap(story) {
    const mapElement = document.getElementById(`map-${story.id}`)
    if (!mapElement) return

    try {
      const map = L.map(`map-${story.id}`, {
        center: [story.lat, story.lon],
        zoom: 13,
        scrollWheelZoom: false,
      })

      // Define multiple tile layers
      const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        name: "OpenStreetMap",
      })

      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community",
          name: "Satellite",
        },
      )

      const topoLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenTopoMap contributors",
        name: "Topographic",
      })

      // Add default layer
      osmLayer.addTo(map)

      // Create layer control
      const baseLayers = {
        "<i class='fas fa-map'></i> Street Map": osmLayer,
        "<i class='fas fa-satellite'></i> Satellite": satelliteLayer,
        "<i class='fas fa-mountain'></i> Topographic": topoLayer,
      }

      L.control
        .layers(baseLayers, null, {
          position: "topright",
          collapsed: true,
        })
        .addTo(map)

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
    const container = document.getElementById("app-container")
    container.innerHTML = `
            <div class="page-transition">
                <div class="stories-header">
                    <h2 class="stories-title">Cerita Terbaru</h2>
                    <div class="error-message" role="alert">
                        <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                        ${message}
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
}
