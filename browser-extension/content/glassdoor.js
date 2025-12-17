importerForPlatform({
  platform: "glassdoor",
  detect: () => {
    const text = document.body.innerText.toLowerCase();
    return text.includes("application submitted") || text.includes("you applied") || text.includes("thanks for applying");
  },
  extract: () => {
    const title = document.querySelector("h1")?.innerText?.trim() || document.title;
    const company = document.querySelector("[data-test='employerName']")?.innerText?.trim();
    const location = document.querySelector("[data-test='location']")?.innerText?.trim();
    const job_url = locationHrefSafe();
    return { title, company, location, job_url };
  },
  onApplyClickSelectors: [
    "[data-test='easyApply']",
    "button.button_Button__o_a9q.button-base_Button__zzUq2",
  ],
});

function importerForPlatform({ platform, detect, extract, onApplyClickSelectors = [] }) {
  let sent = false;

  const send = () => {
    if (sent) return;
    const details = extract() || {};
    const job_url = details.job_url || locationHrefSafe();
    if (!job_url) return;
    sent = true;
    console.log("[ext][glassdoor] sending application", { job_url, ...details });
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
        extra: { source: "glassdoor-content-script" },
      },
    }, (resp) => {
      if (chrome.runtime.lastError) {
        console.warn("[ext][glassdoor] sendMessage error", chrome.runtime.lastError.message);
        return;
      }
      if (!resp || !resp.ok) {
        console.warn("[ext][glassdoor] Import failed", resp?.error, resp);
      } else {
        console.log("[ext][glassdoor] import ok", resp);
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
          console.log("[ext][glassdoor] apply button clicked", sel);
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
