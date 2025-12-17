importerForPlatform({
  platform: "indeed",
  detect: () => {
    const text = document.body.innerText.toLowerCase();
    return text.includes("application submitted") || text.includes("applied to") || text.includes("thanks for applying");
  },
  extract: () => {
    const title = document.querySelector("h1.jobsearch-JobInfoHeader-title")?.innerText?.trim() || document.title;
    const company = document.querySelector(".jobsearch-CompanyInfoWithoutHeaderImage div[aria-label='Company name']")?.innerText?.trim() || document.querySelector(".jobsearch-InlineCompanyRating div:first-child")?.innerText?.trim();
    const location = document.querySelector(".jobsearch-JobInfoHeader-subtitle div")?.innerText?.trim();
    const job_url = locationHrefSafe();
    return { title, company, location, job_url };
  },
  onApplyClickSelectors: ["#indeedApplyButton", "button#indeedApplyButton"],
});

function importerForPlatform({ platform, detect, extract, onApplyClickSelectors = [] }) {
  let sent = false;

  const send = () => {
    if (sent) return;
    const details = extract() || {};
    const job_url = details.job_url || locationHrefSafe();
    if (!job_url) return;
    sent = true;
    console.log("[ext][indeed] sending application", { job_url, ...details });
    chrome.runtime.sendMessage({
      type: "IMPORT_APPLICATION",
      payload: {
        platform,
        event_type: "Applied",
        job_url,
        // optional fields; backend will scrape if missing
        title: details.title,
        company: details.company,
        location: details.location,
        applied_at: new Date().toISOString(),
        extra: { source: "indeed-content-script" },
      },
    }, (resp) => {
      if (chrome.runtime.lastError) {
        console.warn("[ext][indeed] sendMessage error", chrome.runtime.lastError.message);
        return;
      }
      if (!resp || !resp.ok) {
        console.warn("[ext][indeed] Import failed", resp?.error, resp);
      } else {
        console.log("[ext][indeed] import ok", resp);
      }
    });
  };

  const trySend = () => {
    if (sent) return;
    if (!detect()) return;
    send();
  };

  // Observe for confirmation text
  const observer = new MutationObserver(() => trySend());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => trySend(), 3000);
  setTimeout(() => trySend(), 8000);

  // Hook Apply button clicks
  const bindApplyClicks = () => {
    onApplyClickSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((btn) => {
        if (btn.__extBound) return;
        btn.__extBound = true;
        btn.addEventListener("click", () => {
          console.log("[ext][indeed] apply button clicked", sel);
          setTimeout(() => send(), 300);
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
