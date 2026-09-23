/* ==========================================================================
   FreshDrop \u2014 Interactivity
   1. Mobile hamburger menu
   2. "More" categories dropdown + notification bell dropdown
   3. Reviews: render + "Write a review" modal
   4. Multi-step order workflow with simulated order ID generation
   5. Order tracking with a step-by-step timeline
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {

  /* ============================================================
     Utility: Toast notifications
     ============================================================ */
  const toastContainer = document.getElementById("toastContainer");

  function showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = "toast" + (type === "error" ? " error" : "");
    toast.textContent = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("show");
    });

    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () { toast.remove(); }, 300);
    }, 3200);
  }

  /* ============================================================
     Mobile hamburger menu
     ============================================================ */
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  const navCta = document.querySelector(".nav-cta");

  function closeMobileMenu() {
    hamburger.classList.remove("active");
    navLinks.classList.remove("open");
    if (navCta) navCta.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  }

  function toggleMobileMenu() {
    const isOpen = navLinks.classList.toggle("open");
    hamburger.classList.toggle("active", isOpen);
    if (navCta) navCta.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", toggleMobileMenu);

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        // Let the "Categories" dropdown links behave separately
        if (!link.closest(".dropdown")) closeMobileMenu();
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 720) closeMobileMenu();
    });
  }

  /* ============================================================
     Generic dropdown toggle logic (More / Notifications)
     ============================================================ */
  function setupDropdown(toggleId, panelId) {
    const toggle = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    if (!toggle || !panel) return null;

    function open() {
      closeAllDropdowns();
      panel.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    }

    function close() {
      panel.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }

    function toggleFn(e) {
      e.stopPropagation();
      const isOpen = panel.classList.contains("open");
      if (isOpen) close(); else open();
    }

    toggle.addEventListener("click", toggleFn);

    return { open: open, close: close, panel: panel };
  }

  const dropdowns = [];

  function closeAllDropdowns() {
    dropdowns.forEach(function (d) { d.close(); });
  }

  const moreDD = setupDropdown("moreToggle", "morePanel");
  if (moreDD) dropdowns.push(moreDD);

  const notifDD = setupDropdown("notifToggle", "notifPanel");
  if (notifDD) dropdowns.push(notifDD);

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    dropdowns.forEach(function (d) {
      if (!d.panel.contains(e.target) && !d.panel.parentElement.contains(e.target)) {
        d.close();
      } else if (!d.panel.parentElement.contains(e.target)) {
        d.close();
      }
    });
  });

  // Close dropdowns on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllDropdowns();
  });

  // Category links inside the "More" dropdown: highlight matching card
  document.querySelectorAll("#morePanel a[data-category]").forEach(function (link) {
    link.addEventListener("click", function () {
      closeAllDropdowns();
      closeMobileMenu();
      const category = link.getAttribute("data-category");
      highlightCategory(category);
    });
  });

  function highlightCategory(category) {
    const card = document.querySelector('.category-card[data-category="' + category + '"]');
    if (!card) return;
    document.querySelectorAll(".category-card.highlight").forEach(function (c) {
      c.classList.remove("highlight");
    });
    // Force reflow so the animation can restart if triggered again
    void card.offsetWidth;
    card.classList.add("highlight");
    setTimeout(function () { card.classList.remove("highlight"); }, 1500);
  }

  /* ============================================================
     Notification bell: sample notifications + badge clearing
     ============================================================ */
  const notifBadge = document.getElementById("notifBadge");
  const notifList = document.getElementById("notifList");

  const sampleNotifications = [
    { text: "Your order #FD-1001 is out for delivery.", time: "5 min ago" },
    { text: "New seasonal produce just added to Fruits & Vegetables.", time: "2 hrs ago" },
    { text: "Your review for FreshDrop was posted. Thank you!", time: "1 day ago" }
  ];

  function renderNotifications() {
    notifList.innerHTML = "";
    sampleNotifications.forEach(function (n) {
      const li = document.createElement("li");
      li.className = "notif-item";
      li.innerHTML =
        '<span class="notif-dot"></span>' +
        '<div><p>' + escapeHtml(n.text) + '</p><span>' + escapeHtml(n.time) + '</span></div>';
      notifList.appendChild(li);
    });
  }

  renderNotifications();

  if (notifDD) {
    const originalOpen = notifDD.open;
    document.getElementById("notifToggle").addEventListener("click", function () {
      // Clear the unread badge once the panel is opened
      setTimeout(function () {
        if (notifDD.panel.classList.contains("open")) {
          notifBadge.textContent = "0";
          notifBadge.classList.add("hidden");
        }
      }, 0);
    });
  }

  /* ============================================================
     Reviews: render seeded reviews + "Write a review" modal
     ============================================================ */
  const reviewGrid = document.getElementById("reviewGrid");

  const reviews = [
    { name: "Amara Okafor", initials: "AO", rating: 5, text: "Groceries arrived cold and perfectly packed, well within the promised window. My produce has never looked fresher.", meta: "Verified customer" },
    { name: "Daniel Cho", initials: "DC", rating: 5, text: "The delivery tracker made it easy to plan my evening \u2014 I knew exactly when to expect the driver.", meta: "Verified customer" },
    { name: "Priya Nair", initials: "PN", rating: 4, text: "Great selection of pantry staples and the bakery items are always fresh. Wish there were more delivery windows on weekends.", meta: "Verified customer" }
  ];

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      stars += i <= rating ? "\u2605" : "\u2606";
    }
    return stars;
  }

  function renderReviews(highlightFirst) {
    reviewGrid.innerHTML = "";
    reviews.forEach(function (r, index) {
      const card = document.createElement("article");
      card.className = "review-card" + (highlightFirst && index === 0 ? " new-review" : "");
      card.innerHTML =
        '<div class="review-stars">' + renderStars(r.rating) + '</div>' +
        '<p class="review-text">' + escapeHtml(r.text) + '</p>' +
        '<div class="review-author">' +
          '<span class="review-avatar">' + escapeHtml(r.initials) + '</span>' +
          '<div><div class="review-author-name">' + escapeHtml(r.name) + '</div>' +
          '<div class="review-author-meta">' + escapeHtml(r.meta) + '</div></div>' +
        '</div>';
      reviewGrid.appendChild(card);
    });
  }

  renderReviews(false);

  /* ---------- Write a review modal ---------- */
  const reviewModalOverlay = document.getElementById("reviewModalOverlay");
  const writeReviewBtn = document.getElementById("writeReviewBtn");
  const reviewModalClose = document.getElementById("reviewModalClose");
  const reviewForm = document.getElementById("reviewForm");
  const starRating = document.getElementById("starRating");
  const starButtons = starRating.querySelectorAll(".star");

  function openModal(overlay) {
    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";
  }

  function closeModal(overlay) {
    overlay.classList.remove("visible");
    document.body.style.overflow = "";
  }

  writeReviewBtn.addEventListener("click", function () {
    openModal(reviewModalOverlay);
  });

  reviewModalClose.addEventListener("click", function () {
    closeModal(reviewModalOverlay);
  });

  reviewModalOverlay.addEventListener("click", function (e) {
    if (e.target === reviewModalOverlay) closeModal(reviewModalOverlay);
  });

  // Star rating picker
  starButtons.forEach(function (star) {
    star.addEventListener("click", function () {
      const value = parseInt(star.getAttribute("data-value"), 10);
      starRating.setAttribute("data-value", String(value));
      starButtons.forEach(function (s) {
        s.classList.toggle("filled", parseInt(s.getAttribute("data-value"), 10) <= value);
      });
    });
  });

  reviewForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("reviewName").value.trim();
    const text = document.getElementById("reviewText").value.trim();
    const rating = parseInt(starRating.getAttribute("data-value"), 10);

    if (!name || !text || !rating) {
      showToast("Please add your name, a rating, and a short review.", "error");
      return;
    }

    const initials = name
      .split(" ")
      .map(function (n) { return n[0]; })
      .join("")
      .slice(0, 2)
      .toUpperCase();

    reviews.unshift({
      name: name,
      initials: initials || "FD",
      rating: rating,
      text: text,
      meta: "Just now"
    });

    renderReviews(true);
    reviewForm.reset();
    starButtons.forEach(function (s) { s.classList.remove("filled"); });
    starRating.setAttribute("data-value", "0");
    closeModal(reviewModalOverlay);
    showToast("Thanks! Your review has been posted.", "success");
  });

  /* ============================================================
     Category cards: "Order this" jumps to the order form and
     pre-selects the category
     ============================================================ */
  document.querySelectorAll("[data-order-category]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const category = btn.getAttribute("data-order-category");
      const categorySelect = document.getElementById("category");
      if (categorySelect) categorySelect.value = category;
      document.getElementById("order").scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ============================================================
     Multi-step order workflow
     ============================================================ */
  const orderForm = document.getElementById("orderForm");
  const stepperItems = document.querySelectorAll(".stepper-item");
  const formSteps = document.querySelectorAll(".form-step");
  const prevStepBtn = document.getElementById("prevStepBtn");
  const nextStepBtn = document.getElementById("nextStepBtn");
  const submitOrderBtn = document.getElementById("submitOrderBtn");
  const reviewSummary = document.getElementById("reviewSummary");

  let currentStep = 1;
  const totalSteps = formSteps.length;

  const stepFieldIds = {
    1: ["category", "notes", "quantity"],
    2: ["name", "email", "phone", "address", "deliveryTime"],
    3: ["confirmAccuracy"]
  };

  function validateStep(step) {
    const ids = stepFieldIds[step] || [];
    for (let i = 0; i < ids.length; i++) {
      const field = document.getElementById(ids[i]);
      if (field && !field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  function renderReviewSummary() {
    const categorySelect = document.getElementById("category");
    const categoryLabel = categorySelect.options[categorySelect.selectedIndex]
      ? categorySelect.options[categorySelect.selectedIndex].text
      : "\u2014";

    const quantitySelect = document.getElementById("quantity");
    const quantityLabel = quantitySelect.options[quantitySelect.selectedIndex]
      ? quantitySelect.options[quantitySelect.selectedIndex].text
      : "\u2014";

    const timeSelect = document.getElementById("deliveryTime");
    const timeLabel = timeSelect.options[timeSelect.selectedIndex]
      ? timeSelect.options[timeSelect.selectedIndex].text
      : "\u2014";

    const rows = [
      ["Category", categoryLabel],
      ["Basket size", quantityLabel],
      ["Name", document.getElementById("name").value || "\u2014"],
      ["Address", document.getElementById("address").value || "\u2014"],
      ["Delivery window", timeLabel]
    ];

    reviewSummary.innerHTML = rows.map(function (r) {
      return '<div class="review-summary-row"><dt>' + escapeHtml(r[0]) + '</dt><dd>' + escapeHtml(r[1]) + '</dd></div>';
    }).join("");
  }

  function goToStep(step) {
    currentStep = step;

    formSteps.forEach(function (el) {
      el.classList.toggle("active", parseInt(el.getAttribute("data-step"), 10) === step);
    });

    stepperItems.forEach(function (el) {
      const s = parseInt(el.getAttribute("data-step"), 10);
      el.classList.toggle("active", s === step);
      el.classList.toggle("completed", s < step);
    });

    prevStepBtn.disabled = step === 1;
    nextStepBtn.hidden = step === totalSteps;
    submitOrderBtn.hidden = step !== totalSteps;

    if (step === totalSteps) renderReviewSummary();
  }

  nextStepBtn.addEventListener("click", function () {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1);
  });

  prevStepBtn.addEventListener("click", function () {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  /* ---------- Order storage (in-memory, simulated backend) ---------- */
  const orderStore = {};

  // Seed a couple of demo orders so tracking works before any order is placed
  orderStore["FD-1001"] = { status: "out-for-delivery", name: "Sample Customer" };
  orderStore["FD-2045"] = { status: "delivered", name: "Sample Customer" };

  function generateOrderId() {
    let id;
    do {
      id = "FD-" + Math.floor(1000 + Math.random() * 9000);
    } while (orderStore[id]);
    return id;
  }

  const orderModalOverlay = document.getElementById("orderModalOverlay");
  const orderIdDisplay = document.getElementById("orderIdDisplay");
  const orderModalClose = document.getElementById("orderModalClose");

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!validateStep(3)) return;

    const orderId = generateOrderId();
    orderStore[orderId] = {
      status: "placed",
      name: document.getElementById("name").value.trim(),
      category: document.getElementById("category").value,
      placedAt: Date.now()
    };

    orderIdDisplay.textContent = orderId;
    openModal(orderModalOverlay);

    orderForm.reset();
    goToStep(1);
  });

  orderModalClose.addEventListener("click", function () {
    closeModal(orderModalOverlay);
    document.getElementById("trackingId").value = orderIdDisplay.textContent;
    document.getElementById("track").scrollIntoView({ behavior: "smooth" });
  });

  orderModalOverlay.addEventListener("click", function (e) {
    if (e.target === orderModalOverlay) closeModal(orderModalOverlay);
  });

  goToStep(1);

  /* ============================================================
     Order tracking
     ============================================================ */
  const trackingForm = document.getElementById("trackingForm");
  const trackingIdInput = document.getElementById("trackingId");
  const trackingResult = document.getElementById("trackingResult");
  const trackingOrderId = document.getElementById("trackingOrderId");
  const trackingStatusText = document.getElementById("trackingStatusText");
  const timelineSteps = document.querySelectorAll(".timeline-step");
  const sampleIdBtn = document.getElementById("sampleIdBtn");

  const statusOrder = ["placed", "preparing", "out-for-delivery", "delivered"];
  const statusMessages = {
    placed: "Order received \u2014 preparing to pick your items.",
    preparing: "Your basket is being hand-picked and packed cold.",
    "out-for-delivery": "Your driver is on the way!",
    delivered: "Delivered \u2014 enjoy your fresh groceries!"
  };

  function deterministicStatusFromId(id) {
    // For freshly-placed orders we always start at "placed".
    // For any other unseeded ID typed in, derive a stable status from
    // the ID's characters so repeat lookups give a consistent result.
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return statusOrder[sum % statusOrder.length];
  }

  function renderTimeline(status) {
    const statusIndex = statusOrder.indexOf(status);

    timelineSteps.forEach(function (step) {
      const stepStatus = step.getAttribute("data-status");
      const stepIndex = statusOrder.indexOf(stepStatus);
      step.classList.remove("done", "current");
      if (stepIndex < statusIndex) step.classList.add("done");
      if (stepIndex === statusIndex) step.classList.add("current");
    });

    trackingStatusText.textContent = statusMessages[status];
  }

  function trackOrder(rawId) {
    const id = rawId.trim().toUpperCase();

    if (!id) {
      showToast("Enter an order ID to track your delivery.", "error");
      return;
    }

    let order = orderStore[id];

    if (!order) {
      // Unknown ID: only proceed if it loosely matches the FD-#### pattern,
      // otherwise show a friendly error.
      if (!/^FD-\d{3,5}$/.test(id)) {
        showToast("We couldn't find an order with that ID.", "error");
        trackingResult.hidden = true;
        return;
      }
      order = { status: deterministicStatusFromId(id) };
    }

    trackingOrderId.textContent = id;
    renderTimeline(order.status);
    trackingResult.hidden = false;
    trackingResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  trackingForm.addEventListener("submit", function (e) {
    e.preventDefault();
    trackOrder(trackingIdInput.value);
  });

  sampleIdBtn.addEventListener("click", function () {
    trackingIdInput.value = "FD-1001";
    trackOrder("FD-1001");
  });

  /* ---------- Sticky navbar shadow on scroll ---------- */
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", function () {
    navbar.style.boxShadow = window.scrollY > 8 ? "0 2px 12px rgba(27, 67, 50, 0.08)" : "none";
  });

  /* ============================================================
     Dark mode toggle (persisted via localStorage)
     ============================================================ */
  const themeToggle = document.getElementById("themeToggle");
  const THEME_KEY = "freshdrop-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  }

  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) { saved = null; }

    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme("dark");
    } else {
      applyTheme("light");
    }
  })();

  themeToggle.addEventListener("click", function () {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* storage unavailable, ignore */ }
  });

  /* ============================================================
     FAQ accordion
     ============================================================ */
  document.querySelectorAll(".accordion-header").forEach(function (header) {
    const body = header.nextElementSibling;

    header.addEventListener("click", function () {
      const isOpen = header.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        header.setAttribute("aria-expanded", "false");
        body.style.maxHeight = null;
      } else {
        header.setAttribute("aria-expanded", "true");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });

  /* ============================================================
     Back to top button
     ============================================================ */
  const backToTop = document.getElementById("backToTop");

  window.addEventListener("scroll", function () {
    backToTop.classList.toggle("visible", window.scrollY > 480);
  });

  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ============================================================
     Newsletter signup (footer)
     ============================================================ */
  const newsletterForm = document.getElementById("newsletterForm");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const emailField = document.getElementById("newsletterEmail");

      if (!emailField.checkValidity()) {
        emailField.reportValidity();
        return;
      }

      showToast("You're subscribed! Watch your inbox for weekly picks.", "success");
      newsletterForm.reset();
    });
  }
});
