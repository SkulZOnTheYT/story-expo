import L from "leaflet"

export class StoryDetailView {
  render(story) {
    const container = document.getElementById("app-container")

    if (!story) {
      container.innerHTML = `
        <div class="page-transition">
          <div class="error-message" role="alert">
            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
            <strong>Error:</strong> Story tidak ditemukan.
          </div>
        </div>
      `
      return
    }

    container.innerHTML = `
      <div class="page-transition fade-in">
        <div class="story-detail-container">
          <div class="story-detail-header">
            <button class="btn btn-secondary" onclick="history.back()" aria-label="Kembali">
              <i class="fas fa-arrow-left" aria-hidden="true"></i>
              Kembali
            </button>
            <div class="story-detail-actions">
              <button class="btn btn-primary" id="share-story-btn" aria-label="Bagikan cerita">
                <i class="fas fa-share-alt" aria-hidden="true"></i>
                Bagikan
              </button>
            </div>
          </div>

          <article class="story-detail-card">
            <div class="story-detail-image-container">
              <img 
                src="${story.photoUrl || "/placeholder.svg?height=400&width=900"}" 
                alt="Foto cerita: ${story.description ? story.description.substring(0, 100) : "Tidak ada deskripsi"}"
                class="story-detail-image"
              />
            </div>

            <div class="story-detail-content">
              <div class="story-detail-meta">
                <div class="story-author-info">
                  <div class="author-avatar">
                    <i class="fas fa-user" aria-hidden="true"></i>
                  </div>
                  <div class="author-details">
                    <h1 class="author-name">${story.name || "Penulis Anonim"}</h1>
                    <div class="story-date">
                      <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                      ${this.formatDate(story.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div class="story-description">
                <p>${story.description || "Tidak ada deskripsi tersedia untuk cerita ini."}</p>
              </div>

              ${
                story.lat && story.lon
                  ? `
                <div class="story-location">
                  <h3 class="location-title">
                    <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                    Lokasi Cerita
                  </h3>
                  <div class="coordinates-info">
                    <div class="coordinates">
                      <i class="fas fa-crosshairs" aria-hidden="true"></i>
                      ${story.lat.toFixed(6)}, ${story.lon.toFixed(6)}
                    </div>
                  </div>
                  <div id="story-detail-map" class="story-detail-map" aria-label="Peta lokasi cerita"></div>
                </div>
              `
                  : ""
              }
            </div>
          </article>
        </div>
      </div>
    `

    // Initialize map if coordinates are available
    if (story.lat && story.lon) {
      setTimeout(() => {
        this.initializeDetailMap(story)
      }, 100)
    }

    // Initialize share functionality
    this.initializeShare(story)
  }

  initializeDetailMap(story) {
    if (typeof L === "undefined") {
      console.error("Leaflet library not loaded")
      return
    }

    const mapElement = document.getElementById("story-detail-map")
    if (!mapElement) return

    try {
      const map = L.map("story-detail-map", {
        center: [story.lat, story.lon],
        zoom: 15,
        scrollWheelZoom: true,
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

      const darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap contributors, © CARTO",
        name: "Dark Mode",
      })

      // Add default layer
      osmLayer.addTo(map)

      // Create layer control
      const baseLayers = {
        "<i class='fas fa-map'></i> Street Map": osmLayer,
        "<i class='fas fa-satellite'></i> Satellite": satelliteLayer,
        "<i class='fas fa-mountain'></i> Topographic": topoLayer,
        "<i class='fas fa-moon'></i> Dark Mode": darkLayer,
      }

      L.control
        .layers(baseLayers, null, {
          position: "topright",
          collapsed: false,
        })
        .addTo(map)

      // Custom marker icon
      const customIcon = L.divIcon({
        html: `<div style="background: linear-gradient(135deg, #6366f1, #ec4899); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 3px solid white;">
                 <i class="fas fa-map-marker-alt" style="color: white; font-size: 18px;"></i>
               </div>`,
        className: "custom-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      const marker = L.marker([story.lat, story.lon], { icon: customIcon }).addTo(map)

      const popupContent = `
        <div style="max-width: 300px; font-family: var(--font-primary);">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <i class="fas fa-map-marker-alt" style="color: #6366f1; font-size: 1.25rem;"></i>
            <strong style="color: #1f2937; font-size: 1.1rem;">${story.name || "Cerita"}</strong>
          </div>
          ${story.description ? `<p style="margin: 0 0 1rem 0; color: #6b7280; line-height: 1.5;">${story.description.substring(0, 150)}${story.description.length > 150 ? "..." : ""}</p>` : ""}
          <div style="padding-top: 0.75rem; border-top: 1px solid #e5e7eb; font-size: 0.875rem; color: #9ca3af; font-family: monospace;">
            <i class="fas fa-location-dot"></i>
            ${story.lat.toFixed(6)}, ${story.lon.toFixed(6)}
          </div>
        </div>
      `

      marker
        .bindPopup(popupContent, {
          maxWidth: 350,
          className: "custom-popup",
        })
        .openPopup()
    } catch (error) {
      console.error("Error initializing detail map:", error)
      mapElement.innerHTML = `
        <div style="padding: 3rem; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 0.75rem;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
          <p style="font-size: 1.1rem;">Peta tidak dapat dimuat</p>
        </div>
      `
    }
  }

  initializeShare(story) {
    const shareBtn = document.getElementById("share-story-btn")
    if (!shareBtn) return

    shareBtn.addEventListener("click", async () => {
      const shareData = {
        title: `Cerita dari ${story.name || "Story Explorer"}`,
        text: story.description || "Lihat cerita menarik ini di Story Explorer",
        url: window.location.href,
      }

      try {
        if (navigator.share) {
          await navigator.share(shareData)
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(window.location.href)
          this.showShareSuccess("Link cerita berhasil disalin ke clipboard!")
        }
      } catch (error) {
        console.error("Error sharing:", error)
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href)
          this.showShareSuccess("Link cerita berhasil disalin ke clipboard!")
        } catch (clipboardError) {
          console.error("Clipboard error:", clipboardError)
        }
      }
    })
  }

  showShareSuccess(message) {
    const existingMessage = document.querySelector(".share-success-message")
    if (existingMessage) {
      existingMessage.remove()
    }

    const messageEl = document.createElement("div")
    messageEl.className = "success-message share-success-message"
    messageEl.innerHTML = `
      <i class="fas fa-check-circle" aria-hidden="true"></i>
      ${message}
    `

    const container = document.querySelector(".story-detail-container")
    container.insertBefore(messageEl, container.firstChild)

    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove()
      }
    }, 3000)
  }

  formatDate(dateString) {
    if (!dateString) return "Tanggal tidak diketahui"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Tanggal tidak valid"
    }
  }

  showError(message) {
    const container = document.getElementById("app-container")
    container.innerHTML = `
      <div class="page-transition">
        <div class="story-detail-container">
          <div class="error-message" role="alert">
            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
            <strong>Error:</strong> ${message}
          </div>
        </div>
      </div>
    `
  }
}
