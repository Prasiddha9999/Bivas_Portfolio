(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const navToggle = $(".nav-toggle");
  const mobileNav = $("#mobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    $$("#mobileNav a").forEach((a) => {
      a.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const headerOffset = () => {
    const topbar = $(".topbar");
    return topbar ? topbar.getBoundingClientRect().height : 0;
  };
  const scrollToHash = (hash) => {
    const el = $(hash);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - headerOffset() - 10;
    window.scrollTo({ top: y, behavior: "smooth" });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;
      if (!$(href)) return;
      e.preventDefault();
      history.pushState(null, "", href);
      scrollToHash(href);
    });
  });

  const toTopBtn = $("#toTop");
  if (toTopBtn) {
    const toggleToTop = () => {
      const on = window.scrollY > 600;
      toTopBtn.classList.toggle("is-on", on);
    };
    toggleToTop();
    window.addEventListener("scroll", () => requestAnimationFrame(toggleToTop), { passive: true });
    toTopBtn.addEventListener("click", () => scrollToHash("#home"));
  }

  const revealEls = $$("[data-reveal]");
  const meterEls = $$("[data-meter]");
  const hasReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setMeter = (meterEl) => {
    const bar = $(".meter__bar", meterEl);
    const label = $(".meter__label", meterEl);
    const value = Number(meterEl.getAttribute("data-meter") || "0");
    const clamped = Math.max(0, Math.min(100, value));
    if (bar) bar.style.width = `${clamped}%`;
    if (label) label.textContent = `${clamped}%`;
    meterEl.dataset.animated = "true";
  };

  if (!hasReducedMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          el.classList.add("is-inview");
          io.unobserve(el);

          const meters = $$("[data-meter]", el);
          meters.forEach((m) => {
            if (m.dataset.animated === "true") return;
            setTimeout(() => setMeter(m), 120);
          });
        }
      },
      { threshold: 0.18 }
    );

    revealEls.forEach((el) => io.observe(el));

    meterEls.forEach((m) => io.observe(m));
  } else {
    revealEls.forEach((el) => el.classList.add("is-inview"));
    meterEls.forEach((m) => setMeter(m));
  }

  const heroBg = $(".hero__bg");
  const onScrollParallax = () => {
    if (!heroBg) return;
    const y = window.scrollY;
    heroBg.style.transform = `translate3d(0, ${Math.min(0, -y * 0.08)}px, 0)`;
  };
  window.addEventListener("scroll", () => {
    window.requestAnimationFrame(onScrollParallax);
  }, { passive: true });
  onScrollParallax();

  $$(".flare").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${mx}%`);
      card.style.setProperty("--my", `${my}%`);
    });
  });

  const filterButtons = $$(".portfolio__filters [data-filter]");
  const workCards = $$(".workCard[data-tags]");
  const setFilter = (tag) => {
    workCards.forEach((card) => {
      const tags = (card.getAttribute("data-tags") || "").split(",").map((t) => t.trim());
      const show = tag === "all" || tags.includes(tag);
      card.style.display = show ? "" : "none";
    });
  };
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => {
        b.classList.toggle("chip--active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      setFilter(btn.getAttribute("data-filter") || "all");
    });
  });

  const cursor = $(".cursor");
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (cursor && dot && ring && canHover && !hasReducedMotion) {
    cursor.classList.add("is-on");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    window.addEventListener("pointerup", () => cursor.classList.remove("is-down"));

    const tick = () => {
      rx += (x - rx) * 0.14;
      ry += (y - ry) * 0.14;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      requestAnimationFrame(tick);
    };
    tick();

    const setLink = (isLink) => cursor.classList.toggle("is-link", isLink);
    const isInteractive = (el) =>
      !!el &&
      (el.tagName === "A" ||
        el.tagName === "BUTTON" ||
        el.closest("a, button, input, textarea, select, label"));
    window.addEventListener("pointerover", (e) => setLink(isInteractive(e.target)));
    window.addEventListener("pointerout", () => setLink(false));
  }

  const form = $("#contactForm");
  const formNote = $("#formNote");
  const setError = (name, msg) => {
    const field = $(`[name="${name}"]`, form);
    const err = $(`[data-error-for="${name}"]`, form);
    if (field) field.classList.toggle("is-invalid", Boolean(msg));
    if (err) err.textContent = msg || "";
  };
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (formNote) formNote.textContent = "";

      const name = String($('[name="name"]', form)?.value || "").trim();
      const email = String($('[name="email"]', form)?.value || "").trim();
      const subject = String($('[name="subject"]', form)?.value || "").trim();
      const message = String($('[name="message"]', form)?.value || "").trim();

      let ok = true;
      setError("name", "");
      setError("email", "");
      setError("subject", "");
      setError("message", "");

      if (name.length < 2) {
        ok = false;
        setError("name", "Please enter your name (at least 2 characters).");
      }
      if (!validateEmail(email)) {
        ok = false;
        setError("email", "Please enter a valid email address.");
      }
      if (subject.length < 3) {
        ok = false;
        setError("subject", "Please add a short subject (at least 3 characters).");
      }
      if (message.length < 10) {
        ok = false;
        setError("message", "Please write a message (at least 10 characters).");
      }

      if (!ok) {
        if (formNote) formNote.textContent = "Please fix the highlighted fields.";
        return;
      }

      const to = "beevasgg@gmail.com";
      const mailSubject = `Portfolio Contact: ${subject}`;
      const mailBody =
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `\n` +
        `Message:\n${message}\n`;

      const gmailComposeUrl =
        `https://mail.google.com/mail/?view=cm&fs=1` +
        `&to=${encodeURIComponent(to)}` +
        `&su=${encodeURIComponent(mailSubject)}` +
        `&body=${encodeURIComponent(mailBody)}`;

      const opened = window.open(gmailComposeUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        if (formNote) {
          formNote.innerHTML =
            `Popup blocked. Please allow popups, or ` +
            `<a href="${gmailComposeUrl}" target="_blank" rel="noopener noreferrer">open Gmail</a>.`;
        }
        return;
      }

      if (formNote) formNote.textContent = "";
      form.reset();
    });
  }
})();


