document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const navShell = document.querySelector("[data-nav-shell]");
  const header = document.querySelector(".site-header");

  if (menuToggle && navShell) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navShell.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  window.addEventListener("scroll", () => {
    if (!header) return;
    header.classList.toggle("compact", window.scrollY > 10);
  });

  const navLinks = document.querySelectorAll(".main-nav a");
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const normalized = href.includes("#") ? href.split("#")[0] : href;
    if (normalized === currentPath) {
      link.classList.add("active");
    }
  });

  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("revealed"));
  }

  const counters = document.querySelectorAll("[data-counter]");

  const animateCounter = (element) => {
    const target = Number(element.dataset.counter || 0);
    const duration = Number(element.dataset.duration || 1400);
    const start = performance.now();

    const render = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const value = Math.floor(progress * target);
      element.textContent = value.toLocaleString("ar-EG");
      if (progress < 1) {
        requestAnimationFrame(render);
      }
    };

    requestAnimationFrame(render);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach((counter) => animateCounter(counter));
  }

  const tabBlocks = document.querySelectorAll(".tabs");

  tabBlocks.forEach((tabs) => {
    const buttons = tabs.querySelectorAll(".tab-buttons button");
    const panels = tabs.querySelectorAll(".tab-panel");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const panelId = button.getAttribute("data-tab");

        buttons.forEach((btn) => btn.classList.remove("active"));
        panels.forEach((panel) => panel.classList.remove("active"));

        button.classList.add("active");
        tabs.querySelector(`#${panelId}`)?.classList.add("active");
      });
    });
  });

  const accordionTriggers = document.querySelectorAll(".accordion-trigger");

  accordionTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panelId = trigger.getAttribute("data-accordion-target");
      const panel = document.getElementById(panelId);
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";

      trigger.setAttribute("aria-expanded", String(!isExpanded));
      const icon = trigger.querySelector("span:last-child");
      if (icon) {
        icon.textContent = isExpanded ? "+" : "-";
      }

      if (!panel) return;

      if (isExpanded) {
        panel.style.maxHeight = "0";
      } else {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

  const year = document.querySelector("[data-current-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const setupElfsightChatbot = () => {
    const scriptSrc = "https://elfsightcdn.com/platform.js";
    const widgetClass = "elfsight-app-d237957c-adc1-4d28-9be7-8cad7316f08f";

    const hasPlatformScript = Array.from(document.querySelectorAll("script[src]")).some((script) => {
      if (!(script instanceof HTMLScriptElement)) return false;

      try {
        return new URL(script.src, window.location.origin).href === scriptSrc;
      } catch {
        return false;
      }
    });

    if (!hasPlatformScript) {
      // Elfsight AI Chatbot | Connect 4 Systems
      const platformScript = document.createElement("script");
      platformScript.src = scriptSrc;
      platformScript.async = true;
      document.body.appendChild(platformScript);
    }

    if (!document.querySelector(`.${widgetClass}`)) {
      const widget = document.createElement("div");
      widget.className = widgetClass;
      widget.setAttribute("data-elfsight-app-lazy", "");
      document.body.appendChild(widget);
    }
  };

  setupElfsightChatbot();
});
