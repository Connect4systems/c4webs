document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const navShell = document.querySelector("[data-nav-shell]");
  const header = document.querySelector(".site-header");
  const navDropdowns = document.querySelectorAll("[data-nav-dropdown]");
  const isMobileNav = () => window.matchMedia("(max-width: 860px)").matches;
  const normalizeMenuPath = (href) => {
    if (!href) return "";

    try {
      const parsed = new URL(href, window.location.origin);
      return (parsed.pathname || "/").replace(/\/+$/, "") || "/";
    } catch {
      const fallback = href.split(/[?#]/)[0].trim();
      return fallback.replace(/\/+$/, "") || "/";
    }
  };

  const ensureFavicon = () => {
    const hasFavicon = document.head.querySelector("link[rel~='icon']");
    if (hasFavicon) return;

    const brandLogo = document.querySelector(".brand-logo");
    const brandSrc = brandLogo instanceof HTMLImageElement ? (brandLogo.getAttribute("src") || "").trim() : "";
    const faviconHref = brandSrc && !brandSrc.includes("{{") ? brandSrc : "/files/logo-erp.png";

    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/png";
    favicon.href = faviconHref;
    document.head.appendChild(favicon);
  };

  ensureFavicon();

  // Remove stale legacy menu label if an old cached template is still being served.
  navDropdowns.forEach((dropdown) => {
    const links = dropdown.querySelectorAll(".c4-dropdown-menu a, .dropdown-menu a");
    links.forEach((link) => {
      const label = (link.textContent || "").replace(/\s+/g, " ").trim();
      if (!label.includes("الشحن")) return;

      const item = link.closest("li");
      if (item) {
        item.remove();
      } else {
        link.remove();
      }
    });
  });

  const closeDropdowns = () => {
    navDropdowns.forEach((dropdown) => {
      dropdown.classList.remove("open");
      const toggle = dropdown.querySelector(".c4-nav-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  };

  const closeMenu = () => {
    if (!menuToggle || !navShell) return;
    navShell.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    closeDropdowns();
  };

  if (menuToggle && navShell) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navShell.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      body.classList.toggle("menu-open", isOpen);
    });

    navShell.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
        body.classList.remove("menu-open");
      });
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!navShell.classList.contains("open")) return;
      if (navShell.contains(target) || menuToggle.contains(target)) return;
      closeMenu();
      body.classList.remove("menu-open");
    });
  }

  navDropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".c4-nav-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", (event) => {
      if (!isMobileNav()) {
        closeDropdowns();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const isExpanded = toggle.getAttribute("aria-expanded") === "true";

      navDropdowns.forEach((item) => {
        if (item === dropdown) return;
        item.classList.remove("open");
        const itemToggle = item.querySelector(".c4-nav-toggle");
        if (itemToggle) {
          itemToggle.setAttribute("aria-expanded", "false");
        }
      });

      dropdown.classList.toggle("open", !isExpanded);
      toggle.setAttribute("aria-expanded", String(!isExpanded));
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-nav-dropdown]")) return;
    closeDropdowns();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeDropdowns();
    closeMenu();
    body.classList.remove("menu-open");
  });

  window.addEventListener("resize", () => {
    if (!isMobileNav()) {
      closeDropdowns();
    }
  });

  const ensureCompleteSolutionsLinks = () => {
    const solutionLinksToEnsure = [
      { href: "/wells-solar", text: "الآبار والطاقة الشمسية" },
      { href: "/security-systems", text: "الأنظمة الأمنية" },
      { href: "/computer-networks", text: "الحاسوب والشبكات" },
    ];

    navDropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector(".c4-nav-toggle");
      const menu = dropdown.querySelector(".c4-dropdown-menu");
      if (!(toggle instanceof HTMLElement) || !(menu instanceof HTMLElement)) return;

      const toggleLabel = (toggle.textContent || "").replace(/\s+/g, " ").trim();
      const menuGroup = (toggle.getAttribute("data-nav-group") || "").trim();

      if (!(menuGroup === "complete-solutions" || toggleLabel.includes("الحلول الكاملة"))) {
        return;
      }

      const pricingLink = Array.from(menu.querySelectorAll("a")).find((anchor) => {
        return normalizeMenuPath(anchor.getAttribute("href")) === "/catalog";
      });

      solutionLinksToEnsure.forEach(({ href, text }) => {
        const hasLink = Array.from(menu.querySelectorAll("a")).some((anchor) => {
          return normalizeMenuPath(anchor.getAttribute("href")) === href;
        });
        if (hasLink) return;

        const link = document.createElement("a");
        link.href = href;
        link.textContent = text;

        if (pricingLink) {
          menu.insertBefore(link, pricingLink);
        } else {
          menu.appendChild(link);
        }
      });
    });
  };

  ensureCompleteSolutionsLinks();

  const navLinks = document.querySelectorAll(".main-nav a");
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    const normalizedHref = href.replace(/\/$/, "") || "/";

    if (normalizedHref === currentPath) {
      link.classList.add("active");
      return;
    }

    // Keep section pages highlighted for mapped aliases such as /home -> /
    if (normalizedHref === "/" && ["/home", "/index-ar", "/index-en"].includes(currentPath)) {
      link.classList.add("active");
    }
  });

  const navToggles = document.querySelectorAll(".c4-nav-toggle");
  navToggles.forEach((toggle) => {
    const dropdown = toggle.closest("[data-nav-dropdown]");
    if (!dropdown) return;
    if (dropdown.querySelector("a.active")) {
      toggle.classList.add("active");
    }
  });

  const progressBar = document.querySelector("[data-scroll-progress]");
  const onScroll = () => {
    if (header) {
      header.classList.toggle("compact", window.scrollY > 10);
    }

    if (!progressBar) return;

    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = documentHeight > 0 ? Math.min((scrollTop / documentHeight) * 100, 100) : 0;
    progressBar.style.width = `${progress}%`;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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
      { threshold: 0.16 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("revealed"));
  }

  const counters = document.querySelectorAll("[data-counter]");
  const animateCounter = (element) => {
    const target = Number(element.dataset.counter || 0);
    const duration = Number(element.dataset.duration || 1400);
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const start = performance.now();

    const render = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const value = Math.floor(progress * target);
      element.textContent = `${prefix}${value.toLocaleString("ar-EG")}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(render);
      } else {
        element.textContent = `${prefix}${target.toLocaleString("ar-EG")}${suffix}`;
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

  const tabShells = document.querySelectorAll(".tab-shell");
  tabShells.forEach((shell) => {
    const buttons = Array.from(shell.querySelectorAll(".tab-button"));
    const panels = shell.querySelectorAll(".tab-panel");

    if (!buttons.length || !panels.length) return;

    let autoTimer = 0;
    const mobileOnlyAuto = shell.getAttribute("data-tab-mobile-auto") === "1";
    const autoDelayMs = Number(shell.getAttribute("data-tab-auto-delay") || 4600);

    const getActiveIndex = () => buttons.findIndex((button) => button.classList.contains("active"));

    const scrollActiveIntoView = () => {
      if (!isMobileNav()) return;

      const activeButton = buttons[getActiveIndex()];
      if (!(activeButton instanceof HTMLElement)) return;

      activeButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    };

    const activateTab = (id) => {
      buttons.forEach((button) => {
        const isActive = button.dataset.tabTarget === id;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.tabPanel === id;
        panel.classList.toggle("active", isActive);
      });

      scrollActiveIntoView();
    };

    const stopAuto = () => {
      if (!autoTimer) return;
      window.clearTimeout(autoTimer);
      autoTimer = 0;
    };

    const canAutoRotateTabs = () => {
      if (!mobileOnlyAuto || !isMobileNav()) return false;
      if (buttons.length <= 1) return false;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      return true;
    };

    const startAuto = () => {
      stopAuto();
      if (!canAutoRotateTabs()) return;

      autoTimer = window.setTimeout(() => {
        const currentIndex = getActiveIndex();
        const safeIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextButton = buttons[(safeIndex + 1) % buttons.length];
        const nextTarget = nextButton?.dataset.tabTarget;

        if (nextTarget) {
          activateTab(nextTarget);
        }

        startAuto();
      }, autoDelayMs);
    };

    if (getActiveIndex() < 0 && buttons[0]?.dataset.tabTarget) {
      activateTab(buttons[0].dataset.tabTarget);
    } else {
      scrollActiveIntoView();
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.tabTarget;
        if (!target) return;
        activateTab(target);
        startAuto();
      });
    });

    shell.addEventListener("mouseenter", () => {
      stopAuto();
    });

    shell.addEventListener("mouseleave", () => {
      startAuto();
    });

    shell.addEventListener("focusin", () => {
      stopAuto();
    });

    shell.addEventListener("focusout", (event) => {
      const nextFocused = event.relatedTarget;
      if (!(nextFocused instanceof Node) || !shell.contains(nextFocused)) {
        startAuto();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAuto();
      } else {
        startAuto();
      }
    });

    window.addEventListener("resize", () => {
      if (!canAutoRotateTabs()) {
        stopAuto();
        return;
      }

      if (!autoTimer) {
        startAuto();
      }
    });

    startAuto();
  });

  const storyCarousels = document.querySelectorAll("[data-story-carousel]");
  storyCarousels.forEach((carousel) => {
    const track = carousel.querySelector(".story-track");
    const slides = carousel.querySelectorAll(".story-card");
    const prevButton = carousel.querySelector("[data-story-prev]");
    const nextButton = carousel.querySelector("[data-story-next]");

    if (!(track instanceof HTMLElement) || slides.length <= 1) {
      if (prevButton instanceof HTMLButtonElement) {
        prevButton.hidden = true;
      }
      if (nextButton instanceof HTMLButtonElement) {
        nextButton.hidden = true;
      }
      return;
    }

    let activeIndex = 0;
    let autoTimer = 0;
    let touchStartX = 0;
    let touchCurrentX = 0;
    let touchStartY = 0;
    let touchCurrentY = 0;
    const autoDelayMs = 4600;
    const forceAuto = carousel.getAttribute("data-story-force-auto") === "1";
    const mobileOnlyAuto = carousel.getAttribute("data-story-mobile-auto") === "1";

    const canAutoRotate = () => {
      if (mobileOnlyAuto && !isMobileNav()) return false;
      if (!forceAuto && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      return true;
    };

    const goToSlide = (nextIndex) => {
      activeIndex = (nextIndex + slides.length) % slides.length;
      track.style.transform = `translate3d(${-100 * activeIndex}%, 0, 0)`;
      carousel.setAttribute("data-story-index", String(activeIndex));
    };

    const goNext = () => {
      goToSlide(activeIndex + 1);
    };

    const goPrev = () => {
      goToSlide(activeIndex - 1);
    };

    const stopAuto = () => {
      if (!autoTimer) return;
      window.clearTimeout(autoTimer);
      autoTimer = 0;
    };

    const startAuto = () => {
      stopAuto();
      if (!canAutoRotate()) return;

      autoTimer = window.setTimeout(() => {
        goNext();
        startAuto();
      }, autoDelayMs);
    };

    if (prevButton instanceof HTMLButtonElement) {
      prevButton.addEventListener("click", () => {
        goPrev();
        startAuto();
      });
    }

    if (nextButton instanceof HTMLButtonElement) {
      nextButton.addEventListener("click", () => {
        goNext();
        startAuto();
      });
    }

    carousel.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.changedTouches && event.changedTouches[0];
        if (!touch) return;

        touchStartX = touch.clientX;
        touchCurrentX = touch.clientX;
        touchStartY = touch.clientY;
        touchCurrentY = touch.clientY;
        stopAuto();
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchmove",
      (event) => {
        const touch = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
        if (!touch) return;

        touchCurrentX = touch.clientX;
        touchCurrentY = touch.clientY;
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchend",
      (event) => {
        const touch = event.changedTouches && event.changedTouches[0];

        if (touch) {
          touchCurrentX = touch.clientX;
          touchCurrentY = touch.clientY;
        }

        const deltaX = touchCurrentX - touchStartX;
        const deltaY = touchCurrentY - touchStartY;

        if (Math.abs(deltaX) > 36 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            goNext();
          } else {
            goPrev();
          }
        }

        startAuto();
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchcancel",
      () => {
        startAuto();
      },
      { passive: true }
    );

    carousel.addEventListener("mouseenter", () => {
      stopAuto();
    });

    carousel.addEventListener("mouseleave", () => {
      startAuto();
    });

    carousel.addEventListener("focusin", () => {
      stopAuto();
    });

    carousel.addEventListener("focusout", (event) => {
      const nextFocused = event.relatedTarget;
      if (!(nextFocused instanceof Node) || !carousel.contains(nextFocused)) {
        startAuto();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAuto();
      } else {
        startAuto();
      }
    });

    window.addEventListener("resize", () => {
      if (!canAutoRotate()) {
        stopAuto();
        return;
      }

      if (!autoTimer) {
        startAuto();
      }
    });

    goToSlide(0);
    startAuto();
  });

  const filterGroups = document.querySelectorAll("[data-filter-group]");
  filterGroups.forEach((group) => {
    const chips = group.querySelectorAll(".chip[data-filter]");
    const targetSelector = group.getAttribute("data-filter-target") || "";
    const scope = targetSelector ? document.querySelector(targetSelector) : group;

    if (!scope || !chips.length) return;

    const items = scope.querySelectorAll("[data-category]");
    if (!items.length) return;

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.dataset.filter || "all";

        chips.forEach((item) => item.classList.remove("active"));
        chip.classList.add("active");

        items.forEach((card) => {
          const category = card.dataset.category || "";
          const categories = category.split(" ").filter(Boolean);
          const visible = filter === "all" || categories.includes(filter);
          card.hidden = !visible;
        });
      });
    });
  });

  const accordionTriggers = document.querySelectorAll(".accordion-trigger");
  accordionTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panelId = trigger.getAttribute("data-accordion-target");
      const panel = panelId ? document.getElementById(panelId) : null;
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";

      trigger.setAttribute("aria-expanded", String(!isExpanded));
      const icon = trigger.querySelector("span:last-child");
      if (icon) {
        icon.textContent = isExpanded ? "+" : "-";
      }

      if (!panel) return;
      panel.style.maxHeight = isExpanded ? "0" : `${panel.scrollHeight}px`;
    });
  });

  const floatItems = document.querySelectorAll("[data-float]");
  if (floatItems.length) {
    window.addEventListener("mousemove", (event) => {
      const xRatio = event.clientX / window.innerWidth - 0.5;
      const yRatio = event.clientY / window.innerHeight - 0.5;

      floatItems.forEach((item) => {
        const depth = Number(item.getAttribute("data-float")) || 8;
        const x = -(xRatio * depth);
        const y = -(yRatio * depth);
        item.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    });
  }

  const setupImageFallbacks = () => {
    const fallbackSrc = "/assets/c4web/images/image-fallback.svg";
    const contentImages = document.querySelectorAll("main img, .site-footer img");

    contentImages.forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;

      // Keep explicit inline onerror behavior when provided in templates.
      if (img.hasAttribute("onerror")) return;

      if (!img.getAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }
      img.decoding = "async";

      img.addEventListener("error", () => {
        if (img.dataset.fallbackApplied === "1") return;
        img.dataset.fallbackApplied = "1";
        img.classList.add("img-fallback");
        img.src = fallbackSrc;
      });
    });
  };

  setupImageFallbacks();

  const SOCIAL_PROFILES = [
    {
      key: "facebook",
      label: "Facebook",
      url: "https://www.facebook.com/connect4egypt",
      icon:
        '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8.94 6.495H7.25V5.312c0-.453.3-.558.512-.558h1.38V2.45L7.237 2.443C5.003 2.443 4.494 4.11 4.494 5.172v1.323H3v2.39h1.494V16h3.06V8.885h2.066l.307-2.39z"/></svg>',
    },
    {
      key: "tiktok",
      label: "TikTok",
      url: "https://www.tiktok.com/@connect4systems",
      icon:
        '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M9 0h3a4 4 0 0 0 4 4v3a7 7 0 0 1-4-1.26V11a5 5 0 1 1-5-5h1v3H7a2 2 0 1 0 2 2V0z"/></svg>',
    },
    {
      key: "youtube",
      label: "YouTube",
      url: "https://www.youtube.com/@ConnectSystems-ERP",
      icon:
        '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M15.5 4.3a2 2 0 0 0-1.4-1.4C12.9 2.5 8 2.5 8 2.5s-4.9 0-6.1.4A2 2 0 0 0 .5 4.3 20.3 20.3 0 0 0 0 8a20.3 20.3 0 0 0 .5 3.7 2 2 0 0 0 1.4 1.4c1.2.4 6.1.4 6.1.4s4.9 0 6.1-.4a2 2 0 0 0 1.4-1.4A20.3 20.3 0 0 0 16 8a20.3 20.3 0 0 0-.5-3.7zM6.4 10.4V5.6L10.8 8 6.4 10.4z"/></svg>',
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      url: "https://www.linkedin.com/company/7695997/admin/page-posts/published/",
      icon:
        '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.473 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.527 16 0 15.487 0 14.854V1.146zM4.943 13.394V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.432.568-.88 1.232-.88.869 0 1.216.664 1.216 1.637v3.864h2.401V9.252c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>',
    },
  ];

  const createSocialLinks = ({ labeled = false } = {}) => {
    const shell = document.createElement("div");
    shell.className = labeled ? "social-links social-links-labeled" : "social-links";

    SOCIAL_PROFILES.forEach((profile) => {
      const link = document.createElement("a");
      link.className = labeled ? "social-link social-link-labeled" : "social-link";
      link.href = profile.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", profile.label);
      link.innerHTML = `
        <span class="social-icon" aria-hidden="true">${profile.icon}</span>
        ${labeled ? `<span class="social-label">${profile.label}</span>` : ""}
      `;
      shell.appendChild(link);
    });

    return shell;
  };

  const setupSocialMediaLinks = () => {
    const footerColumns = document.querySelectorAll(".site-footer .footer-col");
    const footerContactCol = Array.from(footerColumns).find((col) => {
      const heading = (col.querySelector("h4")?.textContent || "").trim();
      return heading.includes("تواصل");
    });

    if (footerContactCol && !footerContactCol.querySelector("[data-social-links='footer']")) {
      const wrapper = document.createElement("div");
      wrapper.className = "footer-social-wrap";
      wrapper.dataset.socialLinks = "footer";

      const title = document.createElement("p");
      title.className = "social-links-title";
      title.textContent = "تابعنا";

      wrapper.appendChild(title);
      wrapper.appendChild(createSocialLinks());
      footerContactCol.appendChild(wrapper);
    }

    if (!currentPath.startsWith("/contact")) return;

    const contactInfoCard = document.querySelector(".info-card");
    if (!contactInfoCard || contactInfoCard.querySelector("[data-social-links='contact']")) return;

    const insertAfter = contactInfoCard.querySelector(".hero-actions");
    if (!insertAfter) return;

    const contactSocial = document.createElement("div");
    contactSocial.className = "contact-social";
    contactSocial.dataset.socialLinks = "contact";

    const title = document.createElement("p");
    title.className = "social-links-title";
    title.textContent = "تابعنا على المنصات";

    contactSocial.appendChild(title);
    contactSocial.appendChild(createSocialLinks({ labeled: true }));
    insertAfter.insertAdjacentElement("afterend", contactSocial);
  };

  setupSocialMediaLinks();

  const DEFAULT_PARTNER_KICKER = "شركاء وكيانات نعمل معها";
  const DEFAULT_PARTNER_TITLE = "منظومة تعاون قوية تعزز سرعة التنفيذ";

  const normalizePartnerSectionText = (text = {}) => ({
    kicker: String(text?.kicker || "").trim() || DEFAULT_PARTNER_KICKER,
    title: String(text?.title || "").trim() || DEFAULT_PARTNER_TITLE,
  });

  const applyPartnerSectionText = (section, text = {}) => {
    if (!section) return;

    const normalized = normalizePartnerSectionText(text);
    const kickerEl = section.querySelector(".section-head .kicker");
    const titleEl = section.querySelector(".section-head h2");
    const ribbonEl = section.querySelector(".logo-ribbon");

    if (kickerEl) {
      kickerEl.textContent = normalized.kicker;
    }
    if (titleEl) {
      titleEl.textContent = normalized.title;
    }
    if (ribbonEl) {
      ribbonEl.setAttribute("aria-label", normalized.title);
    }
  };

  const createPartnerSection = (text = {}) => {
    const section = document.createElement("section");
    section.className = "section section-tight";
    section.dataset.partnerLogosSection = "1";

    section.innerHTML = `
      <div class="container">
        <div class="section-head reveal">
          <span class="kicker"></span>
          <h2></h2>
        </div>
        <div class="logo-ribbon reveal" aria-label="">
          <div class="logo-track" data-partner-logo-track></div>
        </div>
      </div>
    `;

    applyPartnerSectionText(section, text);

    return section;
  };

  const fetchPartnerLogos = async () => {
    const response = await fetch("/api/method/c4web.api.get_partner_logos?limit=120", {
      method: "GET",
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.exc) {
      throw new Error("Failed to fetch partner logos");
    }

    const message = payload?.message;
    const messageObject = message && typeof message === "object" && !Array.isArray(message) ? message : {};
    const items = Array.isArray(messageObject?.items) ? messageObject.items : Array.isArray(message) ? message : [];

    return {
      text: normalizePartnerSectionText({
        kicker: messageObject?.kicker,
        title: messageObject?.title,
      }),
      items: items
        .map((item) => ({
          title: String(item?.title || "partner").trim(),
          route: String(item?.route || "/blog/partner").trim(),
          logo_url: String(item?.logo_url || "").trim(),
        }))
        .filter((item) => Boolean(item.logo_url)),
    };
  };

  const renderPartnerLogos = (track, logos) => {
    if (!track || !logos.length) return;

    const toCard = (item) => {
      const card = document.createElement("div");
      card.className = "logo-card";

      const link = document.createElement("a");
      link.href = item.route && item.route.startsWith("/") ? item.route : "/blog/partner";
      link.setAttribute("aria-label", item.title || "partner");

      const img = document.createElement("img");
      img.src = item.logo_url;
      img.alt = item.title || "partner";
      img.loading = "lazy";
      img.decoding = "async";

      link.appendChild(img);
      card.appendChild(link);
      return card;
    };

    track.innerHTML = "";

    // Duplicate the sequence for seamless infinite scrolling animation.
    logos.forEach((item) => track.appendChild(toCard(item)));
    logos.forEach((item) => track.appendChild(toCard(item)));
  };

  const setupPartnerLogos = async () => {
    const main = document.querySelector("main");
    if (!main) return;
    const defaultText = normalizePartnerSectionText();

    let section = document.querySelector("[data-partner-logos-section]");
    if (!section) {
      const existingRibbon = main.querySelector(".logo-ribbon");
      section = existingRibbon ? existingRibbon.closest("section") : null;
    }

    if (!section) {
      section = createPartnerSection(defaultText);
    }

    section.dataset.partnerLogosSection = "1";
    applyPartnerSectionText(section, defaultText);

    const leadSection = main.querySelector("#lead-request");
    if (leadSection) {
      main.insertBefore(section, leadSection);
    } else if (!section.parentElement || section.parentElement !== main) {
      main.appendChild(section);
    } else if (section !== main.lastElementChild) {
      main.appendChild(section);
    }

    section.querySelectorAll(".reveal").forEach((item) => {
      item.classList.add("revealed");
    });

    let track = section.querySelector("[data-partner-logo-track]");
    if (!track) {
      const ribbon = section.querySelector(".logo-ribbon");
      if (!ribbon) return;
      track = ribbon.querySelector(".logo-track");
      if (track) {
        track.setAttribute("data-partner-logo-track", "1");
      }
    }
    if (!track) return;

    try {
      const partnerPayload = await fetchPartnerLogos();
      applyPartnerSectionText(section, partnerPayload.text);

      const logos = partnerPayload.items;
      if (!logos.length) return;
      renderPartnerLogos(track, logos);
      setupImageFallbacks();
    } catch (_error) {
      // Keep existing logos as fallback when API is unavailable.
      applyPartnerSectionText(section, defaultText);
    }
  };

  setupPartnerLogos();

  const leadForms = document.querySelectorAll("[data-lead-form]");
  leadForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector("button[type='submit']");
      const statusEl = form.querySelector("[data-form-status]");
      const setStatus = (message, type = "") => {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.classList.remove("success", "error");
        if (type) {
          statusEl.classList.add(type);
        }
      };

      if (submitButton) {
        submitButton.disabled = true;
      }
      setStatus("جاري إرسال الطلب...");

      const extractServerMessage = (payload) => {
        const raw = payload?._server_messages;
        if (!raw) return "";

        try {
          const messages = JSON.parse(raw);
          if (!Array.isArray(messages) || !messages.length) return "";

          const parsed = JSON.parse(messages[0] || "{}");
          const clean = String(parsed?.message || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          return clean;
        } catch (_error) {
          return "";
        }
      };

      try {
        const formData = new FormData(form);
        const body = new URLSearchParams();

        formData.forEach((value, key) => {
          const normalizedValue = String(value).trim();
          body.append(key, normalizedValue);
        });

        const sectorValue = String(formData.get("sector") || "").trim();
        const scopeValue = String(formData.get("scope") || "").trim();
        const messageValue = String(formData.get("message") || "").trim();
        const usersValue = String(formData.get("users") || "").trim();

        if (sectorValue && !sectorValue.startsWith("اختر")) {
          body.append("وصف_النشاط", sectorValue);
        }
        if (scopeValue && !scopeValue.startsWith("اختر")) {
          body.append("custom_req", scopeValue);
        }
        if (messageValue) {
          body.append("custom_inq", messageValue);
        }
        if (usersValue) {
          body.append("users", usersValue);
        }

        body.append("source_page", window.location.pathname || "/contact");

        const csrfToken = window.csrf_token || window.frappe?.csrf_token || "";
        const sessionUser = window.frappe?.session?.user || window.session_user || "Guest";
        const isGuestSession = !sessionUser || sessionUser === "Guest";
        const headers = {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        };
        const hasValidCsrf =
          typeof csrfToken === "string" &&
          csrfToken.length > 0 &&
          csrfToken !== "None" &&
          csrfToken !== "null";
        if (hasValidCsrf && !isGuestSession) {
          headers["X-Frappe-CSRF-Token"] = csrfToken;
        }

        const sendLeadRequest = (requestHeaders, credentialsMode = "same-origin") =>
          fetch("/api/method/c4web.api.create_website_lead", {
            method: "POST",
            headers: requestHeaders,
            body: body.toString(),
            credentials: credentialsMode,
          });

        let response = await sendLeadRequest(headers);
        let payload = await response.json().catch(() => ({}));

        const firstMessage = extractServerMessage(payload) || String(payload?.message || "");
        const shouldRetryWithoutCsrf = /invalid request/i.test(firstMessage) || response.status === 403;

        if (shouldRetryWithoutCsrf) {
          const retryHeaders = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          };
          response = await sendLeadRequest(retryHeaders, "omit");
          payload = await response.json().catch(() => ({}));
        }

        if (!response.ok || payload.exc) {
          const detailedServerMessage = extractServerMessage(payload);
          const errorMessage =
            detailedServerMessage || payload?.message || "تعذر إرسال الطلب حاليا. حاول مرة أخرى.";
          throw new Error(errorMessage);
        }

        form.reset();
        setStatus("تم إنشاء Lead جديد بنجاح. سيتواصل فريقنا معك قريبا.", "success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "تعذر إرسال الطلب حاليا. حاول مرة أخرى.";
        setStatus(message, "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  });

  const year = document.querySelector("[data-current-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  if (!document.querySelector(".wa-float")) {
    const waLink = document.createElement("a");
    waLink.className = "wa-float";
    waLink.href = "https://wa.me/201006676145";
    waLink.target = "_blank";
    waLink.rel = "noopener noreferrer";
    waLink.setAttribute("aria-label", "تواصل عبر واتساب");
    waLink.innerHTML = '<img src="/files/WhatsApp.svg.webp" alt="واتساب" loading="lazy" />';
    body.appendChild(waLink);
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
