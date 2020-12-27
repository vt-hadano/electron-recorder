const videoElement = document.querySelector('video');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

const { desktopCapturer, remote } = require('electron');
const { dialog, Menu } = remote;

// Get the acaliable video source
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
          return {
            label: source.name,
            click: () => selectSource(source)
          };
        })
    );
    
    videoOptionsMenu.popup();

}

let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Change the videoSource window to record
async function selectSource(source) {
    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    // Create stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Preview the source in a video element
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register event handlers
    mediaRecorder.ondataavaliable = handleDataAvaliable;
    mediaRecorder.onstop = handleStop;

}

// Capture all recorded chunks
function handleDataAvaliable(e) {

    console.log('Video data avaliable');
    recordedChunks.push(e.data);

}

const { writeFile } = require( 'fs' ); 

// Save the video files on stop
async function handleStop(e) {

    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    });

    console.log(filePath)

    writeFile(filePath, buffer, () => console.log('File saved successfully!'));

}