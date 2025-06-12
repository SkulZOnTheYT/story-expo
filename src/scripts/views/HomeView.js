export class HomeView {
  render() {
    const container = document.getElementById("app-container")
    container.innerHTML = `
            <div class="page-transition scale-in">
                <section class="hero-section" role="banner">
                    <div class="hero-content">
                        <h2 class="hero-title">
                            <i class="fas fa-globe-americas" aria-hidden="true"></i>
                            Selamat Datang di Story Explorer
                        </h2>
                        <p class="hero-subtitle">
                            Jelajahi cerita-cerita menarik dari seluruh dunia dan bagikan pengalaman Anda sendiri dengan komunitas global
                        </p>
                        <a href="#/stories" class="cta-button" role="button" aria-label="Mulai menjelajahi cerita">
                            <i class="fas fa-rocket" aria-hidden="true"></i>
                            Mulai Menjelajah
                        </a>
                    </div>
                </section>
                
                <section class="features-section">
                    <h3 class="features-title">Fitur Unggulan</h3>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i class="fas fa-book-open" aria-hidden="true"></i>
                            </div>
                            <h4 class="feature-title">Baca Cerita Menarik</h4>
                            <p class="feature-description">
                                Temukan ribuan cerita inspiratif dari berbagai belahan dunia dengan foto dan lokasi yang autentik
                            </p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i class="fas fa-map-marked-alt" aria-hidden="true"></i>
                            </div>
                            <h4 class="feature-title">Peta Interaktif</h4>
                            <p class="feature-description">
                                Jelajahi cerita melalui peta digital yang interaktif dengan berbagai layer dan marker yang informatif
                            </p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">
                                <i class="fas fa-camera" aria-hidden="true"></i>
                            </div>
                            <h4 class="feature-title">Bagikan Pengalaman</h4>
                            <p class="feature-description">
                                Ceritakan pengalaman Anda dengan mudah menggunakan kamera dan pilih lokasi langsung dari peta
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        `
  }
}