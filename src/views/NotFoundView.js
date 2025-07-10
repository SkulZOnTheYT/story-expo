export class NotFoundView {
  render() {
    const container = document.getElementById("app-container")
    container.innerHTML = `
      <div class="page-transition fade-in">
        <div class="not-found-container">
          <div class="not-found-content">
            <div class="not-found-icon">
              <i class="fas fa-compass" aria-hidden="true"></i>
            </div>
            <h2 class="not-found-title">Halaman Tidak Ditemukan</h2>
            <p class="not-found-description">
              Maaf, halaman yang Anda cari tidak dapat ditemukan. 
              Mungkin alamat yang Anda masukkan salah atau halaman telah dipindahkan.
            </p>
            <div class="not-found-suggestions">
              <h3>Apa yang bisa Anda lakukan?</h3>
              <ul>
                <li>
                  <i class="fas fa-check-circle" aria-hidden="true"></i>
                  Periksa kembali alamat URL yang Anda masukkan
                </li>
                <li>
                  <i class="fas fa-check-circle" aria-hidden="true"></i>
                  Kembali ke halaman utama dan navigasi dari sana
                </li>
                <li>
                  <i class="fas fa-check-circle" aria-hidden="true"></i>
                  Gunakan menu navigasi di atas untuk menemukan halaman yang Anda cari
                </li>
              </ul>
            </div>
            <div class="not-found-actions">
              <a href="#/" class="btn btn-primary">
                <i class="fas fa-home" aria-hidden="true"></i>
                Kembali ke Beranda
              </a>
              <a href="#/stories" class="btn btn-secondary">
                <i class="fas fa-book-open" aria-hidden="true"></i>
                Jelajahi Cerita
              </a>
            </div>
            <div class="not-found-help">
              <p>
                <i class="fas fa-question-circle" aria-hidden="true"></i>
                Masih mengalami masalah? 
                <a href="#/" class="help-link">Hubungi dukungan</a>
              </p>
            </div>
          </div>
          <div class="not-found-illustration">
            <div class="floating-elements">
              <div class="floating-element" style="--delay: 0s;">
                <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
              </div>
              <div class="floating-element" style="--delay: 1s;">
                <i class="fas fa-camera" aria-hidden="true"></i>
              </div>
              <div class="floating-element" style="--delay: 2s;">
                <i class="fas fa-book" aria-hidden="true"></i>
              </div>
              <div class="floating-element" style="--delay: 3s;">
                <i class="fas fa-heart" aria-hidden="true"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  showError(message) {
    // Not needed for 404 page, but keeping interface consistent
    console.error("NotFoundView error:", message)
  }

  showLoading(show) {
    // Not needed for 404 page, but keeping interface consistent
  }
}