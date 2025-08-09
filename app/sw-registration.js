if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log(
        "ServiceWorker registration successful with scope:",
        registration.scope
      );

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("New service worker available");
              if (
                confirm(
                  "App update available. Reload to get the latest version?"
                )
              ) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error("ServiceWorker registration failed:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      if (error instanceof TypeError) {
        console.error("Network error - check if sw.js is accessible");
      }
    }
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("Service worker controller changed");
  });
} else {
  console.log("Service Worker not supported in this browser");
}
