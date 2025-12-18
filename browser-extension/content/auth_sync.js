(function syncAuthFromWebapp() {
  try {
    const token = localStorage.getItem("session");
    const uuid = localStorage.getItem("uuid");
    if (!token || !uuid) return;

    chrome.runtime.sendMessage({ type: "STORE_AUTH", token, uuid }, (resp) => {
      if (resp && resp.ok) {
        console.log("[ext] Synced auth from webapp page");
      }
    });
  } catch (err) {
    console.warn("[ext] auth_sync failed", err);
  }
})();
