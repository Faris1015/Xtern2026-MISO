/**
 * MISO OmniSearch — Website Integration Bookmarklet
 * 
 * Injects an "⚡ OmniSearch AI" button right next to the native search bar
 * on https://www.misoenergy.org/.
 * 
 * Usage:
 * 1. Open https://www.misoenergy.org/ in your browser.
 * 2. Open Developer Tools Console (F12 or Cmd+Option+I).
 * 3. Paste this code and press Enter.
 * 4. Or save it as a browser bookmark URL: javascript:(function(){...})();
 */

(function () {
  const OMNISEARCH_URL = window.OMNISEARCH_URL || "http://localhost:3000";

  // Locate MISO's search container or input
  const searchInput =
    document.querySelector('header input[type="search"]') ||
    document.querySelector('header input[type="text"]') ||
    document.querySelector('input[placeholder*="Search" i]') ||
    document.querySelector('.header-search input');

  if (!searchInput) {
    alert("⚠️ Could not find search bar on this page. Please navigate to https://www.misoenergy.org/");
    return;
  }

  // Prevent duplicate button injections
  if (document.getElementById("miso-omnisearch-injected-btn")) {
    alert("✅ OmniSearch button is already active next to the search bar!");
    return;
  }

  const container = searchInput.parentElement;
  if (!container) return;

  // Create styled OmniSearch button matching MISO branding
  const omniBtn = document.createElement("button");
  omniBtn.id = "miso-omnisearch-injected-btn";
  omniBtn.type = "button";
  omniBtn.innerHTML = "⚡ OmniSearch AI";
  omniBtn.title = "Search with MISO OmniSearch 360° Knowledge Canvas & Comparative Insights";

  // Modern CSS styling
  Object.assign(omniBtn.style, {
    backgroundColor: "#0284C7",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "12px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "6px 12px",
    marginLeft: "8px",
    borderRadius: "6px",
    border: "1px solid #0369A1",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(2, 132, 199, 0.35)",
    transition: "all 0.2s ease-in-out",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    zIndex: "9999",
  });

  omniBtn.onmouseenter = () => {
    omniBtn.style.backgroundColor = "#0369A1";
    omniBtn.style.transform = "translateY(-1px)";
    omniBtn.style.boxShadow = "0 4px 10px rgba(2, 132, 199, 0.45)";
  };
  omniBtn.onmouseleave = () => {
    omniBtn.style.backgroundColor = "#0284C7";
    omniBtn.style.transform = "translateY(0)";
    omniBtn.style.boxShadow = "0 2px 6px rgba(2, 132, 199, 0.35)";
  };

  // Launch OmniSearch on click
  omniBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const query = (searchInput.value || "").trim() || "Indiana Hub LMP";
    const targetUrl = `${OMNISEARCH_URL}/?q=${encodeURIComponent(query)}&persona=Power+Trader`;

    omniBtn.innerHTML = "🚀 Launching...";
    omniBtn.style.backgroundColor = "#059669";

    setTimeout(() => {
      omniBtn.innerHTML = "⚡ OmniSearch AI";
      omniBtn.style.backgroundColor = "#0284C7";
    }, 1500);

    window.open(targetUrl, "_blank");
  };

  // Insert immediately adjacent to search input or submit button
  if (searchInput.nextSibling) {
    container.insertBefore(omniBtn, searchInput.nextSibling);
  } else {
    container.appendChild(omniBtn);
  }

  // Visual success notification
  console.log("%c⚡ MISO OmniSearch AI connected successfully to misoenergy.org!", "color: #0284C7; font-size: 14px; font-weight: bold;");
})();

