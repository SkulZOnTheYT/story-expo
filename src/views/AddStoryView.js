import L from "leaflet"

export class AddStoryView {
  constructor() {
    this.currentStream = null
    this.capturedPhoto = null
    this.selectedCoordinates = null
    this.map = null
    this.onSubmit = null
    this.isActive = false
  }

  render() {
    this.isActive = true
    const container = document.getElementById("app-container")
    container.innerHTML = `
        <div class="page-transition fade-in">
            <div class="form-container">
                <h2 class="form-title">
                    <i class="fas fa-plus-circle" aria-hidden="true"></i>
                    Tambah Cerita Baru
                </h2>
                
                <form id="add-story-form" novalidate>
                    <div class="form-group">
                        <label for="story-description" class="form-label">
                            <i class="fas fa-pen-fancy" aria-hidden="true"></i>
                            Deskripsi Cerita <span aria-label="wajib diisi">*</span>
                        </label>
                        <textarea 
                            id="story-description" 
                            name="description" 
                            class="form-textarea" 
                            placeholder="Ceritakan pengalaman menarik Anda..."
                            required
                            aria-describedby="description-help"
                        ></textarea>
                        <small id="description-help" class="form-help">
                            <i class="fas fa-info-circle" aria-hidden="true"></i>
                            Minimal 10 karakter untuk deskripsi cerita
                        </small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-camera" aria-hidden="true"></i>
                            Foto Cerita <span aria-label="wajib diisi">*</span>
                        </label>
                        <div class="camera-section">
                            <video 
                                id="camera-preview" 
                                class="camera-preview" 
                                autoplay 
                                muted
                                style="display: none;"
                                aria-label="Preview kamera"
                            ></video>
                            <canvas 
                                id="photo-canvas" 
                                class="camera-preview" 
                                style="display: none;"
                                aria-label="Foto yang diambil"
                            ></canvas>
                            <div id="camera-placeholder" class="camera-placeholder">
                                <i class="fas fa-camera" aria-hidden="true"></i>
                                <p>Ambil foto untuk cerita Anda</p>
                            </div>
                            <div class="camera-buttons">
                                <button 
                                    type="button" 
                                    id="start-camera-btn" 
                                    class="btn btn-primary"
                                    aria-label="Mulai kamera"
                                >
                                    <i class="fas fa-video" aria-hidden="true"></i>
                                    Mulai Kamera
                                </button>
                                <button 
                                    type="button" 
                                    id="capture-photo-btn" 
                                    class="btn btn-success" 
                                    style="display: none;"
                                    aria-label="Ambil foto"
                                >
                                    <i class="fas fa-camera-retro" aria-hidden="true"></i>
                                    Ambil Foto
                                </button>
                                <button 
                                    type="button" 
                                    id="retake-photo-btn" 
                                    class="btn btn-secondary" 
                                    style="display: none;"
                                    aria-label="Ambil ulang foto"
                                >
                                    <i class="fas fa-redo" aria-hidden="true"></i>
                                    Ambil Ulang
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                            Lokasi Cerita <span aria-label="wajib diisi">*</span>
                        </label>
                        <div class="map-selection">
                            <div class="map-info">
                                <p>
                                    <i class="fas fa-info-circle" aria-hidden="true"></i>
                                    <strong>Petunjuk:</strong> Klik pada peta untuk memilih lokasi cerita Anda
                                </p>
                                <div id="coordinates-display" class="coordinates-display" style="display: none;">
                                    <strong>
                                        <i class="fas fa-crosshairs" aria-hidden="true"></i>
                                        Koordinat terpilih:
                                    </strong><br>
                                    <span id="selected-coordinates"></span>
                                </div>
                            </div>
                            <div id="location-map" class="map-container" aria-label="Peta untuk memilih lokasi"></div>
                        </div>
                    </div>

                    <div id="form-messages" aria-live="polite"></div>

                    <div class="form-group">
                        <button 
                            type="submit" 
                            class="btn btn-primary" 
                            style="width: 100%;"
                            aria-label="Kirim cerita baru"
                        >
                            <i class="fas fa-paper-plane" aria-hidden="true"></i>
                            Kirim Cerita
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `

    this.initializeCamera()
    this.initializeEnhancedMap()
    this.initializeForm()
  }

  initializeCamera() {
    const startBtn = document.getElementById("start-camera-btn")
    const captureBtn = document.getElementById("capture-photo-btn")
    const retakeBtn = document.getElementById("retake-photo-btn")
    const video = document.getElementById("camera-preview")
    const canvas = document.getElementById("photo-canvas")
    const placeholder = document.getElementById("camera-placeholder")

    startBtn.addEventListener("click", async () => {
      try {
        // Check if view is still active before starting camera
        if (!this.isActive) return

        this.currentStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })

        // Double check if view is still active after async operation
        if (!this.isActive) {
          this.stopCamera()
          return
        }

        video.srcObject = this.currentStream
        video.style.display = "block"
        placeholder.style.display = "none"
        canvas.style.display = "none"

        startBtn.style.display = "none"
        captureBtn.style.display = "inline-block"
        retakeBtn.style.display = "none"
      } catch (error) {
        console.error("Error accessing camera:", error)
        this.showFormMessage("Tidak dapat mengakses kamera. Pastikan Anda memberikan izin kamera.", "error")
      }
    })

    captureBtn.addEventListener("click", () => {
      if (!this.isActive) return

      const context = canvas.getContext("2d")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      canvas.toBlob(
        (blob) => {
          this.capturedPhoto = new File([blob], "story-photo.jpg", { type: "image/jpeg" })
        },
        "image/jpeg",
        0.8,
      )

      this.stopCamera()

      video.style.display = "none"
      canvas.style.display = "block"
      captureBtn.style.display = "none"
      retakeBtn.style.display = "inline-block"
    })

    retakeBtn.addEventListener("click", () => {
      if (!this.isActive) return

      this.capturedPhoto = null
      canvas.style.display = "none"
      placeholder.style.display = "block"
      startBtn.style.display = "inline-block"
      retakeBtn.style.display = "none"
    })
  }

  initializeEnhancedMap() {
    try {
      const mapElement = document.getElementById("location-map")
      if (!mapElement) return
      
      // Pastikan container memiliki ukuran yang tepat
      mapElement.style.height = '400px'
      mapElement.style.width = '100%'
      
      this.map = L.map("location-map").setView([-6.2088, 106.8456], 10)

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
      osmLayer.addTo(this.map)

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
        .addTo(this.map)

      // Force map to resize after initialization
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize()
        }
      }, 100)

      let marker = null

      this.map.on("click", (e) => {
        if (!this.isActive) return

        const { lat, lng } = e.latlng

        if (marker) {
          this.map.removeLayer(marker)
        }

        // Custom marker icon
        const customIcon = L.divIcon({
          html: `<div style="background: linear-gradient(135deg, #6366f1, #ec4899); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 3px solid white; animation: bounce 0.6s ease;">
                         <i class="fas fa-map-marker-alt" style="color: white; font-size: 18px;"></i>
                       </div>`,
          className: "custom-marker",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })

        marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map)

        const popupContent = `
                <div style="text-align: center; font-family: var(--font-primary);">
                    <div style="margin-bottom: 0.75rem;">
                        <i class="fas fa-map-marker-alt" style="color: #6366f1; font-size: 1.5rem;"></i>
                    </div>
                    <strong style="color: #1f2937;">Lokasi Terpilih</strong><br>
                    <small style="color: #6b7280; font-family: monospace;">
                        ${lat.toFixed(6)}, ${lng.toFixed(6)}
                    </small>
                </div>
            `

        marker
          .bindPopup(popupContent, {
            className: "custom-popup",
          })
          .openPopup()

        this.selectedCoordinates = { lat, lon: lng }

        const coordDisplay = document.getElementById("coordinates-display")
        const coordText = document.getElementById("selected-coordinates")
        if (coordDisplay && coordText) {
          coordDisplay.style.display = "block"
          coordText.innerHTML = `
                    <i class="fas fa-globe" aria-hidden="true"></i>
                    Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}
                `
        }
      })

      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!this.isActive) return

            const { latitude, longitude } = position.coords
            this.map.setView([latitude, longitude], 13)

            // Add current location indicator
            const currentLocationIcon = L.divIcon({
              html: `<div style="background: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); animation: pulse 2s infinite;">
                                 <div style="background: #10b981; width: 8px; height: 8px; border-radius: 50%; margin: 3px;"></div>
                               </div>`,
              className: "current-location-marker",
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })

            L.marker([latitude, longitude], { icon: currentLocationIcon })
              .addTo(this.map)
              .bindPopup(`
                            <div style="text-align: center;">
                                <i class="fas fa-location-arrow" style="color: #10b981;"></i><br>
                                <strong>Lokasi Anda Saat Ini</strong>
                            </div>
                        `)
          },
          (error) => {
            console.log("Geolocation error:", error)
          },
        )
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      const mapElement = document.getElementById("location-map")
      if (mapElement) {
        mapElement.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 0.75rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #f59e0b; margin-bottom: 1rem;"></i>
                    <p>Peta tidak dapat dimuat</p>
                </div>
            `
      }
    }
  }

  initializeForm() {
    const form = document.getElementById("add-story-form")
    if (!form) return

    form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSubmit()
    })
  }

  async handleSubmit() {
    if (!this.isActive) return

    const description = document.getElementById("story-description").value.trim()

    // Validation
    if (!description || description.length < 10) {
      this.showFormMessage("Deskripsi cerita harus minimal 10 karakter.", "error")
      return
    }

    if (!this.capturedPhoto) {
      this.showFormMessage("Silakan ambil foto untuk cerita Anda.", "error")
      return
    }

    if (!this.selectedCoordinates) {
      this.showFormMessage("Silakan pilih lokasi pada peta.", "error")
      return
    }

    const storyData = {
      description,
      photo: this.capturedPhoto,
      lat: this.selectedCoordinates.lat,
      lon: this.selectedCoordinates.lon,
    }

    if (this.onSubmit) {
      await this.onSubmit(storyData)
    }
  }

  // Properly stop camera stream
  stopCamera() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        track.stop()
      })
      this.currentStream = null
    }
  }

  // View handles DOM manipulation and Web API calls
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

  showFormMessage(message, type = "info") {
    const messagesContainer = document.getElementById("form-messages")
    if (!messagesContainer) return

    const messageClass = type === "error" ? "error-message" : "success-message"
    const icon = type === "error" ? "fas fa-exclamation-circle" : "fas fa-check-circle"

    messagesContainer.innerHTML = `
        <div class="${messageClass}" role="alert">
            <i class="${icon}" aria-hidden="true"></i>
            ${message}
        </div>
    `

    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        if (messagesContainer) {
          messagesContainer.innerHTML = ""
        }
      }, 5000)
    }
  }

  showError(message) {
    this.showFormMessage(message, "error")
  }

  showSuccess(message) {
    this.showFormMessage(message, "success")

    // Reset form
    const form = document.getElementById("add-story-form")
    if (form) {
      form.reset()
    }

    this.capturedPhoto = null
    this.selectedCoordinates = null

    // Reset camera
    this.stopCamera()
    const video = document.getElementById("camera-preview")
    const canvas = document.getElementById("photo-canvas")
    const placeholder = document.getElementById("camera-placeholder")
    const startBtn = document.getElementById("start-camera-btn")
    const captureBtn = document.getElementById("capture-photo-btn")
    const retakeBtn = document.getElementById("retake-photo-btn")

    if (video) video.style.display = "none"
    if (canvas) canvas.style.display = "none"
    if (placeholder) placeholder.style.display = "block"
    if (startBtn) startBtn.style.display = "inline-block"
    if (captureBtn) captureBtn.style.display = "none"
    if (retakeBtn) retakeBtn.style.display = "none"

    // Reset coordinates display
    const coordDisplay = document.getElementById("coordinates-display")
    if (coordDisplay) {
      coordDisplay.style.display = "none"
    }
  }

  // Set handler from Presenter
  setSubmitHandler(handler) {
    this.onSubmit = handler
  }

  // View handles navigation
  navigateAfterDelay(path, delay) {
    setTimeout(() => {
      window.location.hash = path
    }, delay)
  }

  // Cleanup when view is destroyed - CRITICAL for camera stream management
  destroy() {
    this.isActive = false
    this.stopCamera()
    if (this.map) {
      this.map.remove()
      this.map = null
    }
    this.capturedPhoto = null
    this.selectedCoordinates = null
    this.onSubmit = null
  }
}
