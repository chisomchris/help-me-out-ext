const closeBtn = document.getElementById("close") as HTMLButtonElement
const recordBtn = document.getElementById("startRecording") as HTMLButtonElement
const tabs: NodeListOf<HTMLButtonElement> = document.querySelectorAll("[data-tab]");
const toggleBtns: NodeListOf<HTMLButtonElement> = document.querySelectorAll(".switch");

const recordState = {
  currentTab: true,
  camera: true,
  audio: true,
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      t.classList.remove("active");
    });
    tab.classList.add("active");
    if (tab.dataset.tab === "window") {
      recordState.currentTab = false;
    } else {
      recordState.currentTab = true;
    }
  });
});

toggleBtns[0].addEventListener("click", (e) => {
  e.currentTarget && e.currentTarget instanceof HTMLButtonElement && e.currentTarget.classList.toggle("active");
  recordState.camera = !recordState.camera;
});

toggleBtns[1].addEventListener("click", (e) => {
  e.currentTarget && e.currentTarget instanceof HTMLButtonElement && e.currentTarget.classList.toggle("active");
  recordState.audio = !recordState.audio;
});

closeBtn.addEventListener("click", () => {
  window.close();
});

recordBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (!(recordState.audio || recordState.camera)) {
    return;
  }
  if (tab.id && typeof tab.id === 'number') {
    if (recordState.currentTab === true) {
      const tabId = tab.id
      chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (id) => {
        chrome.tabs.sendMessage(tabId, {
          message: {
            type: "start_recording",
            isCurrentTab: recordState.currentTab,
            camera: recordState.camera,
            audio: recordState.audio,
            id
          }
        })
      })
    } else {
      chrome.tabs.sendMessage(tab.id, {
        message: {
          type: "start_recording",
          isCurrentTab: recordState.currentTab,
          camera: recordState.camera,
          audio: recordState.audio,
        }
      })
    }
    close();
  }
});
