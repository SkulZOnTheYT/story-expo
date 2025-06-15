export class AuthView {
  constructor() {
    this.onLogin = null
    this.onRegister = null
  }

  render(mode = "login") {
    const container = document.getElementById("app-container")

    if (mode === "login") {
      container.innerHTML = `
        <div class="page-transition fade-in">
          <div class="auth-container">
            <div class="auth-card">
              <div class="auth-header">
                <h2 class="auth-title">
                  <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                  Login
                </h2>
                <p class="auth-subtitle">Masuk untuk menjelajahi dan berbagi cerita</p>
              </div>
              
              <form id="login-form" class="auth-form">
                <div class="form-group">
                  <label for="login-email" class="form-label">
                    <i class="fas fa-envelope" aria-hidden="true"></i>
                    Email
                  </label>
                  <input 
                    type="email" 
                    id="login-email" 
                    class="form-input" 
                    placeholder="Masukkan email Anda"
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="login-password" class="form-label">
                    <i class="fas fa-lock" aria-hidden="true"></i>
                    Password
                  </label>
                  <input 
                    type="password" 
                    id="login-password" 
                    class="form-input" 
                    placeholder="Masukkan password Anda"
                    required
                  />
                </div>
                
                <div id="login-message" aria-live="polite"></div>
                
                <button type="submit" class="btn btn-primary auth-submit">
                  <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                  Login
                </button>
              </form>
              
              <div class="auth-switch">
                <p>Belum memiliki akun?</p>
                <a href="#/auth/register" class="auth-link">Daftar sekarang</a>
              </div>
            </div>
          </div>
        </div>
      `

      this.initLoginForm()
    } else {
      container.innerHTML = `
        <div class="page-transition fade-in">
          <div class="auth-container">
            <div class="auth-card">
              <div class="auth-header">
                <h2 class="auth-title">
                  <i class="fas fa-user-plus" aria-hidden="true"></i>
                  Register
                </h2>
                <p class="auth-subtitle">Daftar untuk mulai berbagi cerita</p>
              </div>
              
              <form id="register-form" class="auth-form">
                <div class="form-group">
                  <label for="register-name" class="form-label">
                    <i class="fas fa-user" aria-hidden="true"></i>
                    Nama
                  </label>
                  <input 
                    type="text" 
                    id="register-name" 
                    class="form-input" 
                    placeholder="Masukkan nama Anda"
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="register-email" class="form-label">
                    <i class="fas fa-envelope" aria-hidden="true"></i>
                    Email
                  </label>
                  <input 
                    type="email" 
                    id="register-email" 
                    class="form-input" 
                    placeholder="Masukkan email Anda"
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="register-password" class="form-label">
                    <i class="fas fa-lock" aria-hidden="true"></i>
                    Password
                  </label>
                  <input 
                    type="password" 
                    id="register-password" 
                    class="form-input" 
                    placeholder="Minimal 8 karakter"
                    required
                    minlength="8"
                  />
                </div>
                
                <div id="register-message" aria-live="polite"></div>
                
                <button type="submit" class="btn btn-primary auth-submit">
                  <i class="fas fa-user-plus" aria-hidden="true"></i>
                  Register
                </button>
              </form>
              
              <div class="auth-switch">
                <p>Sudah memiliki akun?</p>
                <a href="#/auth" class="auth-link">Login sekarang</a>
              </div>
            </div>
          </div>
        </div>
      `

      this.initRegisterForm()
    }
  }

  initLoginForm() {
    const form = document.getElementById("login-form")
    if (!form) return

    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const email = document.getElementById("login-email").value
      const password = document.getElementById("login-password").value

      if (this.onLogin) {
        this.onLogin({ email, password })
      }
    })
  }

  initRegisterForm() {
    const form = document.getElementById("register-form")
    if (!form) return

    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const name = document.getElementById("register-name").value
      const email = document.getElementById("register-email").value
      const password = document.getElementById("register-password").value

      if (this.onRegister) {
        this.onRegister({ name, email, password })
      }
    })
  }

  showError(message, formType) {
    const messageContainer = document.getElementById(`${formType}-message`)
    if (!messageContainer) return

    messageContainer.innerHTML = `
      <div class="error-message" role="alert">
        <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
        ${message}
      </div>
    `
  }

  showSuccess(message, formType) {
    const messageContainer = document.getElementById(`${formType}-message`)
    if (!messageContainer) return

    messageContainer.innerHTML = `
      <div class="success-message" role="alert">
        <i class="fas fa-check-circle" aria-hidden="true"></i>
        ${message}
      </div>
    `
  }

  // Set handlers from Presenter
  setLoginHandler(handler) {
    this.onLogin = handler
  }

  setRegisterHandler(handler) {
    this.onRegister = handler
  }

  // View handles navigation
  navigateAfterDelay(path, delay) {
    setTimeout(() => {
      window.location.hash = path
    }, delay)
  }

  switchToLoginAfterDelay(delay) {
    setTimeout(() => {
      this.render("login")
    }, delay)
  }
}
