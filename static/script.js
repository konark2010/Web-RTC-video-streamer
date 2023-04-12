//accessing DOM Elements and storing them in variable sfor easy use
let previewElement = document.getElementById("preview");
let recordingElement = document.getElementById("recording");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let downloadButton = document.getElementById("downloadButton");
let logElement = document.getElementById("log");
let databaseLogElement = document.getElementById("databaseLog");
const videoElement = document.querySelector('video');

//variables for timer, mediaRecorder, counter of chunk
let timer;
let mediaRecorder;
let chunkCounter;

//to fetch from the database for all uploaded videos
fetchUploadList();

//main logic for start of recording of video stream using media recorder
function startRecording(stream) {
  mediaRecorder = new MediaRecorder(stream);
  chunkCounter = 1;
  let data = [];
  mediaRecorder.ondataavailable = (event) => {
  data.push(event.data);
    // Uploading Segment
    sendFile(event.data, chunkCounter);
    chunkCounter++;
}
  //starts recording
  mediaRecorder.start();

  //sets intervals for segment of 3sec
  startIntervalForSegments();

  let stopped = new Promise((resolve, reject) => {
    mediaRecorder.onstop = resolve;
    mediaRecorder.onerror = (event) => reject(event.name);
  });

  let recorded = new Promise((resolve) => {
    stopButton.addEventListener('click', () => {
      resolve();
    });
  }).then(() => {
    if (mediaRecorder.state === "recordingElement") {
      mediaRecorder.stop();
    }
  });

  return Promise.all([stopped, recorded]).then(() => data);
}

function stop(stream) {
  stream.getTracks().forEach((track) => track.stop());
}

//onclick of start button it captures stream from camera and calls the start record function
startButton.addEventListener(
  "click",
  () => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          //video constraints as given in assignment description
          width:{exact: 1280},
          height: {exact: 720},
          frameRate: {ideal: 30, max: 30},
          bitrate: 5000000,
        },
        audio: true,
      })
      .then((stream) => {
        previewElement.srcObject = stream;
        downloadButton.href = stream;
        previewElement.captureStream =
          previewElement.captureStream || previewElement.mozCaptureStream;
        return new Promise((resolve) => (previewElement.onplaying = resolve));
      })
      .then(() => startRecording(previewElement.captureStream()))
      .then((recordedChunks) => {
        let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
        recordingElement.src = URL.createObjectURL(recordedBlob);
        downloadButton.href = recordingElement.src;
        downloadButton.download = "RecordedVideo.mp4";

        messageLogger(
          `Successfully uploaded ${recordedBlob.size} bytes of ${recordedBlob.type} media.`
        );
      })
      .catch((error) => {
        if (error.name === "NotFoundError") {
          messageLogger("Camera or microphone not found. Can't record.");
        } else {
          messageLogger(error);
        }
      });
  },
  false
);

//on click event of stop button wherre is clears interval stops preview element and stops recording
stopButton.addEventListener(
  "click",
  () => {
    clearInterval(timer);
    mediaRecorder.stop();
    stop(previewElement.srcObject);
    mergeVideoScript();
    displayVideo();
  },
  false
);

//function to write log message
function messageLogger(msg) {
  logElement.innerHTML += `${msg}\n`;
}

//function to write log message
function databaseLogger(msg) {
  databaseLogElement.innerHTML += `${msg}\n`;
}

function wait(delayInMS) {
  return new Promise((resolve) => setTimeout(resolve, delayInMS));
}

//starts interval for segments every 3 second 
function startIntervalForSegments(){
   timer = setInterval(()=>{
      mediaRecorder.stop();
      mediaRecorder.start();
  }, 3000);
}

//adds file contents, STREAM name which is the unique videoID and chunk numbers
function sendFile(file, chunkNumber) {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('name', uniqueStreamNumber);
  formData.append('chunk', chunkNumber);

  fetch('/api/upload', {
      method: 'PUT',
      body: formData
  });
}

//GET request to retrieve all the uploaded videos from database
function fetchUploadList()
{
  fetch(`/api/uploaded_list`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
        for (let i = 0; i < data.length; i++) {
        databaseLogger(`Video ID: ${data[i].videoId}, Chunk ID: ${data[i].chunkId}\n`);
    }
  })
}

// creates videoID using Date function of js
function getName() {
  return +new Date()
}

// assigns the created name to 
const uniqueStreamNumber = getName()

//function to call script for merging video using FFmpeg in shell script
function mergeVideoScript()
{
  fetch(`/api/run/${uniqueStreamNumber}`, {
    method: 'GET'
});
}

//function to display merged video through FFmpeg
function displayVideo()
{
  // Client-side code
  fetch(`/api/${uniqueStreamNumber}`)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.blob();
  })
  .then(blob => {
    const videoUrl = URL.createObjectURL(blob);
    videoElement.src = videoUrl;
    videoElement.controls = true;
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });
  
}
