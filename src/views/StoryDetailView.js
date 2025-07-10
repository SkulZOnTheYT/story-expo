import L from "leaflet"

export class StoryDetailView {
  render(story) {
    const container = document.getElementById("app-container")
    

    if (!story) {
      container.innerHTML = `
        <div class="page-transition fade-in">
          <div class="stories-header">
            <h2 class="stories-title">
              <i class="fas fa-book" aria-hidden="true"></i>
              Detail Cerita
            </h2>
            <div class="error-message" role="alert">
              <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
              Cerita tidak ditemukan
            </div>
          </div>
        </div>
      `
      return
    }

    container.innerHTML = `
      <div class="page-transition scale-in">
        <div class="story-detail-container">
          <div class="story-detail-header">
            <h2 class="stories-title">
              <i class="fas fa-book" aria-hidden="true"></i>
              Detail Cerita
            </h2>
            <div class="story-detail-actions">
              <a href="#/stories" class="btn btn-secondary">
                <i class="fas fa-arrow-left" aria-hidden="true"></i>
                Kembali
              </a>
            </div>
          </div>
          
          <div class="story-detail-card">
            <div class="story-detail-image-container">
              <img 
                src="${story.photoUrl || "/placeholder.svg?height=400&width=800"}" 
                alt="${story.description ? `Foto untuk cerita: ${story.description.substring(0, 50)}...` : "Foto cerita"}"
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
                    <h3 class="author-name">${story.name || "Anonim"}</h3>
                    <div class="story-date">
                      <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                      ${this.formatDate(story.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="story-description">
                <p>${story.description || "Tidak ada deskripsi tersedia"}</p>
              </div>
              
              ${
                story.lat && story.lon
                  ? `
                <div class="story-location">
                  <h4 class="location-title">
                    <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                    Lokasi Cerita
                  </h4>
                  <div class="coordinates-info">
                    <div class="coordinates">
                      <i class="fas fa-location-dot" aria-hidden="true"></i>
                      Latitude: ${story.lat.toFixed(6)}, Longitude: ${story.lon.toFixed(6)}
                    </div>
                  </div>
                  <div id="story-detail-map" class="story-detail-map"></div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `

    // Initialize map if coordinates are available
    if (story.lat && story.lon) {
      setTimeout(() => {
        this.initializeDetailMap(story)
      }, 100)
    }
  }

  initializeDetailMap(story) {
    const mapElement = document.getElementById("story-detail-map")
    if (!mapElement) return

    try {
      const map = L.map("story-detail-map").setView([story.lat, story.lon], 13)

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

      // Create layer control with icons
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
        <div style="text-align: center; font-family: var(--font-primary);">
          <div style="margin-bottom: 0.75rem;">
            <i class="fas fa-map-marker-alt" style="color: #6366f1; font-size: 1.5rem;"></i>
          </div>
          <strong style="color: #1f2937;">${story.name || "Cerita"}</strong><br>
          <small style="color: #6b7280; font-family: monospace;">
            ${story.lat.toFixed(6)}, ${story.lon.toFixed(6)}
          </small>
        </div>
      `

      marker.bindPopup(popupContent).openPopup()
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
        <div class="stories-header">
          <h2 class="stories-title">Detail Cerita</h2>
          <div class="error-message" role="alert">
            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
            ${message}
          </div>
          <div style="text-align: center; margin-top: 2rem;">
            <a href="#/stories" class="btn btn-secondary">
              <i class="fas fa-arrow-left" aria-hidden="true"></i>
              Kembali ke Daftar Cerita
            </a>
          </div>
        </div>
      </div>
    `
  }
}
