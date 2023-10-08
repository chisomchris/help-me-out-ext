"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const closeBtn = document.getElementById("close");
const recordBtn = document.getElementById("startRecording");
const tabs = document.querySelectorAll("[data-tab]");
const toggleBtns = document.querySelectorAll(".switch");
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
        }
        else {
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
recordBtn.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    const [tab] = yield chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
    });
    if (!(recordState.audio || recordState.camera)) {
        return;
    }
    if (recordState.currentTab === true) {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (id) => {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                    message: {
                        type: "start_recording",
                        isCurrentTab: recordState.currentTab,
                        camera: recordState.camera,
                        audio: recordState.audio,
                        id
                    }
                });
            }
        });
        close();
    }
}));
