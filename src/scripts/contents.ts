interface MediaOption extends MediaTrackConstraints {
  mandatory: {
    chromeMediaSource: "tab",
    chromeMediaSourceId: string | undefined,
  }
}

interface StreamOptions {
  streamId?: string;
  video: boolean;
  audio: boolean;
}

let url: string;
let last_chunk = 0;
const api_url = 'http://localhost:4000/api/v1/videos/'

const getStream = async ({ streamId, video, audio }: StreamOptions) => {
  let media: MediaStream | undefined | null;
  if (streamId) {
    const config: MediaStreamConstraints = {};
    const option: MediaOption = {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    };
    if (video) {
      config.video = option;
    }
    if (audio) {
      config.audio = option;
    }
    media = await navigator.mediaDevices.getUserMedia(config);
    if (!media) {
      alert("No stream available");
    }
    const output = new AudioContext();
    const source = output.createMediaStreamSource(media);
    source.connect(output.destination)
  } else {
    media = await navigator.mediaDevices.getDisplayMedia({ video, audio });
  }
  return media;
};

const createRecorder = (stream: MediaStream) => {
  let recordedChuncks: Blob[] = [];
  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = async (e) => {
    if (e.data.size > 0) {
      recordedChuncks.push(e.data);
      // up to 500kb
      if (size(recordedChuncks) > 512000) {
        sendChunk(recordedChuncks, last_chunk + 1);
        recordedChuncks = [];
      }
    }
  };

  mediaRecorder.onstop = async () => {
    await sendChunk(recordedChuncks, last_chunk + 1, true);
    recordedChuncks = [];
    mediaRecorder.stop()
    stream.getTracks().forEach(track => track.stop())

    chrome.runtime.sendMessage({
      redirect: `https://help-me-out-fe.vercel.app/`,
      // redirect: `https://help-me-out-fe.vercel.app/home/watch/${url}`,
    });
  };

  mediaRecorder.start(1000);
  // return mediaRecorder;
};

const startRecording = async (streamOptions: StreamOptions) => {
  try {
    const success = await requesUploadtUrl();
    if (!success) {
      return new Error("can't start streaming");
    }
    const stream = await getStream(streamOptions);
    if (stream instanceof MediaStream) {
      createRecorder(stream);
    }
  } catch (error) {
    console.error(error);
  }
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.message.type === "start_recording") {
    const { isCurrentTab, camera, audio, id }: { isCurrentTab: boolean, camera: boolean, audio: boolean, id: string } = request.message
    if (isCurrentTab) {
      startRecording({
        streamId: id,
        video: camera,
        audio,
      });
    } else {
      startRecording({
        video: camera,
        audio,
      });
    }
  }
});

const size = (arr: Blob[]) => arr.reduce((prev, current) => prev + current.size, 0);

const sendChunk = async (chunk: Blob[], nextBlock: number, isLastChunck?: boolean) => {
  try {
    const blob = new Blob(chunk, {
      type: "video/webm;codec=vp9",
    });
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("nextBlock", `${nextBlock}`);
    if (isLastChunck) {
      formData.append("isLastBlock", "1");
    }

    const res = await fetch(
      `${api_url}/upload/${url}`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (res.ok) {
      const data = await res.json();
      last_chunk = data.last_chunk;
      if (data.completed === true) {
        last_chunk = 0;
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const requesUploadtUrl = async (): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(
      `${api_url}/create-file-upload-link`
    );
    const data = await response.json();

    if (data.success && data.link) {
      url = data.link;
      resolve(true);
    } else {
      reject(false);
    }
  });
};

const modal = `<div class="fixed bottom-0 left-0  pl-12 grid grid-cols-12 items-center group hide h-[250px]">
<div
  class="bg-[#efefef] w-[156px] aspect-square rounded-full mr-12 col-span-3 border-solid border-2 border-[#B6B6B6] group-[.hide]:hidden"
></div>
<div
  class=" border-solid border-[8px] border-[#eaeaea]] bg-[#141414] h-[102px] w-[567px] flex col-span-8 rounded-full pr-[40px] pt-[12px] pb-[12px] pl-[16px]"
>
  <div
    class="h-[56px] w-[153px] flex items-center justify-center border-r-[2px] border-r-solid border-r-white"
  >
    <p class="text-[20px] text-white font-medium">00:03:45</p>
    <div class="relative group playing ml-4 w-[20px] h-[20px]">
      <div
        class="absolute w-[20px] h-[20px] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 aspect-auto rounded-full z-50 bg-[#c0040470] group-[.playing]:ping group-[.playing]:pulsate"
      ></div>
      <div
        class="block w-[10px] absolute z-[1] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-[10px] aspect-auto rounded-full bg-[#c00404]"
      ></div>
    </div>
  </div>
  <!-- controls -->
  <div class="flex flex-col items-center gap-1 ml-7">
    <button
      class="m-0 bg-white h-[44px] aspect-square rounded-full grid place-items-center"
    ><img alt="" src="../extension/assets/pause.png"/></button>
    <p class="mt-0 leading-none text-white text-[12px] font-bold">
      Pause
    </p>
  </div>
  <div class="flex flex-col items-center gap-1 ml-7">
    <button
      class="m-0 bg-white h-[44px] aspect-square rounded-full grid place-items-center"
    ><img alt="" src="../extension/assets/stop.png"/></button>
    <p class="mt-0 leading-none text-white text-[12px] font-bold">Stop</p>
  </div>
  <div class="flex flex-col items-center gap-1 ml-7">
    <button
      class="m-0 bg-white h-[44px] aspect-square rounded-full grid place-items-center"
    ><img alt="" src="../extension/assets/camera.png"/></button>
    <p class="mt-0 leading-none text-white text-[12px] font-bold">
      Camera
    </p>
  </div>
  <div class="flex flex-col items-center gap-1 ml-7">
    <button
      class="m-0 bg-white h-[44px] aspect-square rounded-full grid place-items-center"
    ><img alt="" src="../extension/assets/microphone.png"/></button>
    <p class="mt-0 leading-none text-white text-[12px] font-bold">Mic</p>
  </div>

  <button class="aspect-square h-[44px] rounded-full ml-6 grid place-items-center bg-[#4B4B4B] ">
    <img src="./extension/assets/trash.png" />
  </button>
</div>
</div>`;
