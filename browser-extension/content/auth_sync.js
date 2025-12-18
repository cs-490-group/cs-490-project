(function syncAuthFromWebapp() {
  try {
    const token = localStorage.getItem("session");
    const uuid = localStorage.getItem("uuid");
    const apiBase =
      // preferred: expose a global from your webapp build (e.g., window.__APP_API_BASE__)
      window.__APP_API_BASE__ ||
      // or set a localStorage key from your app
      localStorage.getItem("API_BASE");
    if (!token || !uuid) return;

    chrome.runtime.sendMessage({ type: "STORE_AUTH", token, uuid, apiBase }, (resp) => {
      if (resp && resp.ok) {
        console.log("[ext] Synced auth from webapp page");
      }
    });
  } catch (err) {
    console.warn("[ext] auth_sync failed", err);
  }
})();
