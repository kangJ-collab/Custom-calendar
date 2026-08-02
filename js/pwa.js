"use strict";

(() => {
  const runtimeStatus = document.querySelector("#runtimeStatus");
  const runtimeStatusText = document.querySelector("#runtimeStatusText");
  const installButton = document.querySelector("#installAppButton");
  const installStatusTitle = document.querySelector("#installStatusTitle");
  const installStatusText = document.querySelector("#installStatusText");
  const updateBanner = document.querySelector("#updateBanner");
  const updateNowButton = document.querySelector("#updateNowButton");
  const updateLaterButton = document.querySelector("#updateLaterButton");
  const checkUpdateButton = document.querySelector("#checkUpdateButton");

  let deferredInstallPrompt = null;
  let waitingWorker = null;
  let refreshingForUpdate = false;

  function setRuntimeStatus(status, text) {
    runtimeStatus.dataset.status = status;
    runtimeStatusText.textContent = text;
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function updateInstallUI() {
    if (isStandalone()) {
      installButton.hidden = true;
      installStatusTitle.textContent = "설치된 앱으로 실행 중";
      installStatusText.textContent = "홈 화면에서 독립 실행 모드로 사용하고 있습니다.";
      return;
    }
    if (deferredInstallPrompt) {
      installButton.hidden = false;
      installStatusTitle.textContent = "앱을 설치할 수 있습니다";
      installStatusText.textContent = "설치하면 홈 화면에서 빠르게 실행하고 오프라인에서도 사용할 수 있습니다.";
      return;
    }
    installButton.hidden = true;
    installStatusTitle.textContent = "브라우저에서 실행 중";
    installStatusText.textContent = isIOS()
      ? "Safari 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요."
      : "브라우저 메뉴에서 앱 설치 또는 홈 화면 추가를 사용할 수 있습니다.";
  }

  function showUpdate(worker) {
    waitingWorker = worker;
    setRuntimeStatus("update", "업데이트 가능");
    updateBanner.hidden = false;
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      installStatusText.textContent = "이 브라우저는 오프라인 설치 기능을 지원하지 않습니다.";
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      if (registration.waiting) showUpdate(registration.waiting);

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate(worker);
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshingForUpdate) return;
        refreshingForUpdate = true;
        location.reload();
      });

      checkUpdateButton.addEventListener("click", async () => {
        try {
          await registration.update();
          window.CustomCalendarApp?.showToast(
            registration.waiting ? "새 버전을 확인했습니다." : "현재 최신 버전입니다."
          );
          if (registration.waiting) showUpdate(registration.waiting);
        } catch {
          window.CustomCalendarApp?.showToast("업데이트를 확인하지 못했습니다.");
        }
      });
    } catch {
      setRuntimeStatus("error", "오프라인 준비 실패");
      installStatusText.textContent = "서비스 워커 등록에 실패했습니다. 새로고침 후 다시 확인해 주세요.";
    }
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallUI();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    updateInstallUI();
    window.CustomCalendarApp?.showToast("앱 설치가 완료되었습니다.");
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    updateInstallUI();
  });

  updateNowButton.addEventListener("click", () => {
    window.CustomCalendarApp?.flush();
    updateBanner.hidden = true;
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  });

  updateLaterButton.addEventListener("click", () => {
    updateBanner.hidden = true;
    setRuntimeStatus(navigator.onLine ? "online" : "offline", navigator.onLine ? "온라인" : "오프라인");
  });

  window.addEventListener("online", () => setRuntimeStatus("online", "온라인"));
  window.addEventListener("offline", () => setRuntimeStatus("offline", "오프라인"));

  setRuntimeStatus(navigator.onLine ? "online" : "offline", navigator.onLine ? "온라인" : "오프라인");
  updateInstallUI();
  registerServiceWorker();
})();
