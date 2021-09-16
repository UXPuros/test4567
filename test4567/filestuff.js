
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progress');
const downloaded = document.getElementById('download');

fileInput.addEventListener('change', handleTheFile, false)

const CHUNKSIZE = 1024;
const FAKEDELAY = 100;

let remoteReceiveFiletype = '';
let remoteReceiveFilename = '';
let remoteReceiveFilesize = 0;
let remoteReceiveBuffer;
let remoteReceivedChunks = 0;

function handleTheFile(ev) {
    const file = ev.target.files[0];
    console.log(file.name, file.size, file.type)

    remoteReceiveFiletype = file.type;
    remoteReceiveFilename = file.name;
    remoteReceiveFilesize = file.size;
    // remoteReceiveBuffer = new ArrayBuffer(0);
    remoteReceiveBuffer = new Uint8Array(file.size);



    remoteReceivedChunks = 0;

    const progress = document.createElement('DIV');
    progressBar.appendChild(progress);

    const reader = new FileReader()
    reader.onerror = (e) => { console.error(`Error reading file: ${e.message}`) }
    reader.onabort = () => { console.error(`File reading abort!`) }
    reader.onload = (e) => {
        const wholeFile = e.target.result;
        setTimeout(() => {
            sendBuffer(wholeFile, 1)
        }, FAKEDELAY);

    }
    reader.readAsArrayBuffer(file);
}


async function sendBuffer(buffer, chunk) {
    progressUpdate(buffer.byteLength, chunk)
    const lastChunk = (buffer.byteLength - chunk * CHUNKSIZE <= 0)
    let from = (chunk - 1) * CHUNKSIZE;
    if (!lastChunk) {
        const chunkData = buffer.slice(from, from + CHUNKSIZE);

        receiveThisSheet(chunkData);
        setTimeout(() => {
            sendBuffer(buffer, chunk + 1)
        }, FAKEDELAY);
    } else {
        const chunkData = buffer.slice(from);
        receiveThisSheet(chunkData);
    }
}

function progressUpdate(bytes, chunk) {
    const bar = progressBar.childNodes[0];
    const total = Math.min(100, (chunk * CHUNKSIZE / bytes)) * 100
    bar.style.maxWidth = `${total}%`;
}

function receiveThisSheet(chunkData) {

    remoteReceiveBuffer.set(new Uint8Array(chunkData), remoteReceivedChunks);
    remoteReceivedChunks++;

    console.log(`${chunkData.byteLength} < ${CHUNKSIZE}`)
    const lastChunk = (chunkData.byteLength < CHUNKSIZE)

    if (lastChunk) {
        downloadBlob()
    }

}

function downloadBlob() {
    var blob, url;
    blob = new Blob([remoteReceiveBuffer], {
        type: remoteReceiveFiletype
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = remoteReceiveFilename;
    document.body.appendChild(a);
    a.click();
    // downloadURL(url);
    // setTimeout(function () {
    //     return window.URL.revokeObjectURL(url);
    // }, 1000);
};

function downloadURL(data) {
    var a;
    a = document.createElement('a');
    a.href = data;
    a.download = remoteReceiveFilename;
    document.body.appendChild(a);
    // a.style = 'display: none';
    // a.click();
    // a.remove();
};

/*
fileReader.addEventListener('error', error => console.error('Error reading file:', error));
fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
fileReader.addEventListener('load', e => {
  console.log('FileRead.onload ', e);
  sendChannel.send(e.target.result);
  offset += e.target.result.byteLength;
  sendProgress.value = offset;
  if (offset < file.size) {
    readSlice(offset);
  }
});
const readSlice = o => {
  console.log('readSlice ', o);
  const slice = file.slice(offset, o + chunkSize);
  fileReader.readAsArrayBuffer(slice);
};
readSlice(0);

*/