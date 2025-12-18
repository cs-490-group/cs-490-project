const API_BASE = "https://cs-490-project-production.up.railway.app"; // TODO: adjust to your backend origin

async function getAuth() {
  const data = await chrome.storage.local.get(["token", "uuid"]);
  return {
    token: data.token,
    uuid: data.uuid,
  };
}

async function setAuth(token, uuid) {
  await chrome.storage.local.set({ token, uuid });
  console.log("[ext] Stored auth from webapp domain");
}

async function postApplication(payload) {
  const { token, uuid } = await getAuth();
  if (!token || !uuid) {
    throw new Error("Missing auth (token/uuid) in extension storage");
  }

  const url = `${API_BASE}/api/applications/import/extension`;
  console.log("[ext][bg] POST", url, payload);
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      uuid,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.warn("[ext][bg] backend error", resp.status, text);
    throw new Error(`Backend error ${resp.status}: ${text}`);
  }
  console.log("[ext][bg] backend ok", resp.status);
  return resp.json();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === "STORE_AUTH") {
        await setAuth(message.token, message.uuid);
        sendResponse({ ok: true });
        return;
      }

      if (message.type === "IMPORT_APPLICATION") {
        console.log("[ext][bg] IMPORT_APPLICATION", message.payload);
        const result = await postApplication(message.payload);
        sendResponse({ ok: true, result });
        return;
      }
      console.warn("[ext][bg] unknown message type", message.type);
      sendResponse({ ok: false, error: "unknown message type" });
    } catch (err) {
      console.error("[ext] Error handling message", err);
      sendResponse({ ok: false, error: err.message });
    }
  })();
  return true; // keep the channel open for async
});
