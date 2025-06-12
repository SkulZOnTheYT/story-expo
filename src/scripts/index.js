import { Router } from "./router/Router.js"
import { StoryPresenter } from "./presenters/StoryPresenter.js"
import { StoryModel } from "./models/StoryModel.js"
import { HomeView } from "./views/HomeView.js"
import { StoriesView } from "./views/StoriesView.js"
import { AddStoryView } from "./views/AddStoryView.js"
import { AuthView } from "./views/AuthView.js"
import { StoryDetailView } from "./views/StoryDetailView.js"
import { AnimationUtils } from "./presenters/animations.js"

class App {
  constructor() {
    this.router = new Router();
    this.storyModel = new StoryModel();
    this.initializeApp();
  }

  initializeApp() {
    // Initialize views
    const homeView = new HomeView();
    const storiesView = new StoriesView();
    const addStoryView = new AddStoryView();
    const authView = new AuthView();
    const storyDetailView = new StoryDetailView();

    // Initialize presenter
    const storyPresenter = new StoryPresenter(
      this.storyModel, 
      storiesView, 
      addStoryView, 
      authView, 
      storyDetailView
    );

    // Setup routes
    this.router.addRoute("/", () => homeView.render());
    this.router.addRoute("/stories", () => storyPresenter.showStories());
    this.router.addRoute("/stories/:id", (params) => storyPresenter.showStoryDetail(params.id));
    this.router.addRoute("/add-story", () => {
      // Check if user is authenticated for adding stories
      if (!this.storyModel.isAuthenticated()) {
        storyPresenter.showAuth('login');
      } else {
        storyPresenter.showAddStoryForm();
      }
    });
    this.router.addRoute("/login", () => storyPresenter.showAuth('login'));
    this.router.addRoute("/register", () => storyPresenter.showAuth('register'));

    // Initialize router
    this.router.init();

    // Setup navigation
    this.setupNavigation(storyPresenter);

    // Setup View Transition API
    this.setupViewTransitions();

    // Update navigation based on auth state
    storyPresenter.updateNavigation();

    // Initialize notifications if authenticated
    if (this.storyModel.isAuthenticated()) {
      storyPresenter.initializeNotifications();
    }
  }

  setupNavigation(storyPresenter) {
    document.addEventListener("click", (e) => {
      if (e.target.matches('a[href^="#"]') || e.target.closest('a[href^="#"]')) {
        e.preventDefault();
        const link = e.target.matches('a[href^="#"]') ? e.target : e.target.closest('a[href^="#"]');
        const href = link.getAttribute("href");
        this.router.navigate(href.substring(1));

        // Update active nav link
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.remove("active");
        });
        link.classList.add("active");
      }
    });

    // Update navigation when auth state changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'authToken') {
        storyPresenter.updateNavigation();
      }
    });
  }

  setupViewTransitions() {
    const container = document.getElementById("app-container");
    let previousContent = null;

    if ("startViewTransition" in document) {
      const originalNavigate = this.router.navigate.bind(this.router);
      this.router.navigate = (path) => {
        document.startViewTransition(() => {
          originalNavigate(path);
        });
      };
    } else {
      // Fallback using Animation API
      const originalNavigate = this.router.navigate.bind(this.router);
      this.router.navigate = async (path) => {
        const currentContent = container.cloneNode(true);
        
        if (previousContent) {
          await AnimationUtils.createCustomPageTransition(
            previousContent, 
            currentContent, 
            'forward'
          );
        }
        
        originalNavigate(path);
        previousContent = currentContent;
      };
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new App();
});