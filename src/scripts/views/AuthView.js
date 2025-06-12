export class AuthView {
  constructor() {
    this.onLogin = null
    this.onRegister = null
  }

  render(mode = "login") {
    const container = document.getElementById("app-container")

    const isLogin = mode === "login"
    const title = isLogin ? "Masuk ke Akun" : "Daftar Akun Baru"
    const subtitle = isLogin ? "Masuk untuk berbagi cerita Anda" : "Bergabung dengan komunitas Story Explorer"
    const icon = isLogin ? "fas fa-sign-in-alt" : "fas fa-user-plus"
    const submitText = isLogin ? "Masuk" : "Daftar"
    const switchText = isLogin ? "Belum punya akun?" : "Sudah punya akun?"
    const switchLinkText = isLogin ? "Daftar di sini" : "Masuk di sini"
    const switchMode = isLogin ? "register" : "login"

    container.innerHTML = `
      <div class="page-transition scale-in">
        <div class="auth-container">
          <div class="auth-card">
            <div class="auth-header">
              <h2 class="auth-title">
                <i class="${icon}" aria-hidden="true"></i>
                ${title}
              </h2>
              <p class="auth-subtitle">${subtitle}</p>
            </div>

            <form id="auth-form" class="auth-form" novalidate>
              ${
                !isLogin
                  ? `
                <div class="form-group">
                  <label for="auth-name" class="form-label">
                    <i class="fas fa-user" aria-hidden="true"></i>
                    Nama Lengkap <span aria-label="wajib diisi">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="auth-name" 
                    name="name" 
                    class="form-input" 
                    placeholder="Masukkan nama lengkap Anda"
                    required
                    autocomplete="name"
                  />
                </div>
              `
                  : ""
              }

              <div class="form-group">
                <label for="auth-email" class="form-label">
                  <i class="fas fa-envelope" aria-hidden="true"></i>
                  Email <span aria-label="wajib diisi">*</span>
                </label>
                <input 
                  type="email" 
                  id="auth-email" 
                  name="email" 
                  class="form-input" 
                  placeholder="Masukkan alamat email Anda"
                  required
                  autocomplete="email"
                />
              </div>

              <div class="form-group">
                <label for="auth-password" class="form-label">
                  <i class="fas fa-lock" aria-hidden="true"></i>
                  Password <span aria-label="wajib diisi">*</span>
                </label>
                <input 
                  type="password" 
                  id="auth-password" 
                  name="password" 
                  class="form-input" 
                  placeholder="Masukkan password Anda"
                  required
                  autocomplete="${isLogin ? "current-password" : "new-password"}"
                  minlength="8"
                />
                ${
                  !isLogin
                    ? `
                  <small class="form-help">
                    <i class="fas fa-info-circle" aria-hidden="true"></i>
                    Password minimal 8 karakter
                  </small>
                `
                    : ""
                }
              </div>

              <div id="auth-messages" aria-live="polite"></div>

              <button type="submit" class="btn btn-primary auth-submit">
                <i class="${icon}" aria-hidden="true"></i>
                ${submitText}
              </button>
            </form>

            <div class="auth-switch">
              <p>${switchText}</p>
              <button type="button" class="auth-link" id="auth-switch-btn">
                ${switchLinkText}
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    this.initializeForm(mode)
  }

  initializeForm(mode) {
    const form = document.getElementById("auth-form")
    const switchBtn = document.getElementById("auth-switch-btn")

    form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSubmit(mode)
    })

    switchBtn.addEventListener("click", () => {
      const newMode = mode === "login" ? "register" : "login"
      this.render(newMode)
    })
  }

  async handleSubmit(mode) {
    const formData = new FormData(document.getElementById("auth-form"))
    const data = Object.fromEntries(formData.entries())

    // Basic validation
    if (!data.email || !data.password) {
      this.showError("Semua field wajib diisi.", mode)
      return
    }

    if (mode === "register" && !data.name) {
      this.showError("Nama lengkap wajib diisi.", mode)
      return
    }

    if (data.password.length < 8) {
      this.showError("Password minimal 8 karakter.", mode)
      return
    }

    if (mode === "login" && this.onLogin) {
      await this.onLogin({
        email: data.email,
        password: data.password,
      })
    } else if (mode === "register" && this.onRegister) {
      await this.onRegister({
        name: data.name,
        email: data.email,
        password: data.password,
      })
    }
  }

  showError(message, mode) {
    this.showMessage(message, "error", mode)
  }

  showSuccess(message, mode) {
    this.showMessage(message, "success", mode)
  }

  showMessage(message, type, mode) {
    const messagesContainer = document.getElementById("auth-messages")
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
        messagesContainer.innerHTML = ""
      }, 3000)
    }
  }
}