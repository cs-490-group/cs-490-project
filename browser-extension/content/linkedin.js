importerForPlatform({
  platform: "linkedin",
  detect: () => {
    const text = document.body.innerText.toLowerCase();
    return text.includes("application submitted") || text.includes("your application was sent");
  },
  extract: extractLinkedInJob,
  onApplyClickSelectors: [
    "button[data-control-name='jobdetails_topcard_inapply']",
    "button.jobs-apply-button",
    "button[aria-label*='Easy Apply']",
    ".jobs-apply-button--top-card",
    "button.jobs-apply-button.artdeco-button",
    "button.jobs-apply-button--top-card.artdeco-button"
  ],
});

// Shared helper
function importerForPlatform({ platform, detect, extract, onApplyClickSelectors = [] }) {
  let sent = false;

  const send = () => {
    if (sent) return;
    const details = extract() || {};
    const job_url = details.job_url || locationHrefSafe();
    if (!job_url) return;
    sent = true;
    console.log("[ext][linkedin] sending application", { job_url, ...details });
    chrome.runtime.sendMessage({
      type: "IMPORT_APPLICATION",
      payload: {
        platform,
        event_type: "Applied",
        job_url,
        // title/company/location are optional now; backend will scrape from URL
        title: details.title,
        company: details.company,
        location: details.location,
        applied_at: new Date().toISOString(),
        extra: { source: `${platform}-content-script` },
      },
    }, (resp) => {
      if (chrome.runtime.lastError) {
        console.warn("[ext][linkedin] sendMessage error", chrome.runtime.lastError.message);
        return;
      }
      if (!resp || !resp.ok) {
        console.warn("[ext][linkedin] Import failed", resp?.error, resp);
      } else {
        console.log("[ext][linkedin] import ok", resp);
      }
    });
  };

  const trySendOnDetection = () => {
    if (sent) return;
    if (!detect()) return;
    send();
  };

  // Watch for confirmation text
  const observer = new MutationObserver(() => trySendOnDetection());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => trySendOnDetection(), 3000);
  setTimeout(() => trySendOnDetection(), 8000);

  // Also hook Apply button clicks to send immediately with current page data
  const bindApplyClicks = () => {
    onApplyClickSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((btn) => {
        if (btn.__extBound) return;
        btn.__extBound = true;
        btn.addEventListener("click", () => {
          console.log("[ext][linkedin] apply button clicked", sel);
          setTimeout(() => send(), 300); // slight delay to allow DOM to populate
        });
      });
    });
  };
  bindApplyClicks();
  const btnObserver = new MutationObserver(() => bindApplyClicks());
  btnObserver.observe(document.body, { childList: true, subtree: true });
}

function locationHrefSafe() {
  try { return window.location.href; } catch { return undefined; }
}

function extractLinkedInJob() {
  const title = document.querySelector("h1")?.innerText?.trim() || document.title;
  const company = document.querySelector(".topcard__org-name-link, a[data-control-name='jobdetails_company']")?.innerText?.trim();
  const location = document.querySelector(".topcard__flavor--bullet")?.innerText?.trim();
  const job_url = locationHrefSafe();
  return { title, company, location, job_url };
}
