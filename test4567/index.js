const MAXIMUM_MESSAGE_SIZE = 65535;
const END_OF_FILE_MESSAGE = 'EOF';

const code = document.getElementById('code');
const buttons = document.getElementById('buttons');
const message = document.getElementById('message');
const ws = new WebSocket("ws://77.54.205.151/", ['json']);

var msgInput = document.querySelector('#msgInput'); 
var sendMsgBtn = document.querySelector('#sendMsgBtn'); 

var sendFile = document.querySelector('#sendFile')
var fileInput = document.querySelector('#fileInput');

let myId = ''
let messagecount = 0
let allusers = []
let receivedMsg = ''

ws.onmessage = (message) => {
    messagecount++

    let parsed = JSON.parse(message.data)
    // console.log(messagecount, message.data, parsed)
    if (parsed.type && parsed.data) {
        switch (parsed.type) {
            case 'myid':
                processMyId(parsed.data)

                break;

            case 'showallusers':
                processAllUsers(parsed.data)

                break;

            case 'msg':
                processMsg(parsed.data)

            default:
            // console.log(parsed);
        }
    }
}


//Lest constants that are not constants
const peerConfig = {
    "iceServers": [{
        url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
     },] 
}
let local, localChannel;


function sendRequest(i) {

    local = new RTCPeerConnection(peerConfig);
   
    local.onicecandidate = (e) => { 
        if (e.candidate) {
            sendIceCandidate(allusers[i], e.candidate)
        }
    }

    const request = {
        type: 'msg',
        to: allusers[i],
        from: myId,
        message: {
            stage: 0,
            data: null
        }
    }

    local.ondatachannel = function(event) {
                const localChannel  = event.channel
                localChannel.binaryType = 'arraybuffer'

                const receivedBuffers = []

                localChannel.onmessage = async (event) =>{
                    HandleFileData(event, receivedBuffers, localChannel.label)
                   
                }
             };

    openDataChannel()
    ws.send(JSON.stringify(request))
}

function sendIceCandidate(to, candidate) {
    const request = {
        type: 'msg',
        to: to,
        from: myId,
        message: {
            stage: 4,
            data: candidate
        }
    }

    ws.send(JSON.stringify(request))
}

async function processMsg(msg) {

    if (typeof msg.message.stage != 'number')
        return


    let request
    switch (msg.message.stage) {
        case 0:
            request = {
                type: 'msg',
                to: msg.from,
                from: myId,
                message: {
                    stage: 1,
                    data: null
                }
            }

            local = new RTCPeerConnection(peerConfig);
            local.ondatachannel = function(event) {
                const localChannel  = event.channel
                localChannel.binaryType = 'arraybuffer'

                const receivedBuffers = []

                localChannel.onmessage = async (event) =>{
                    HandleFileData(event, receivedBuffers, localChannel.label)
                   
                }
             };
            openDataChannel()

            local.onicecandidate = (e) => { 
                if (e.candidate) {
                    sendIceCandidate(msg.from, e.candidate)
                    
                }
            }
            ws.send(JSON.stringify(request))


            break;
        case 1:
            const offer = await local.createOffer()
            await local.setLocalDescription(offer)

            request = {
                type: 'msg',
                to: msg.from,
                from: myId,
                message: {
                    stage: 2,
                    data: local.localDescription
                }
            }

            ws.send(JSON.stringify(request))
            break;

        case 2:
            await local.setRemoteDescription(msg.message.data)
            const answer = await local.createAnswer()
            await local.setLocalDescription(answer)
            request = {
                type: 'msg',
                to: msg.from,
                from: myId,
                message: {
                    stage: 3,
                    data: local.localDescription
                }
            }

            ws.send(JSON.stringify(request))
            break;

        case 3:
            await local.setRemoteDescription(msg.message.data)
            break;

        default:
            local.addIceCandidate(msg.message.data)
            

            break;
    }

}

function openDataChannel(){
    localChannel = local.createDataChannel("myDataChannel");
     
    localChannel.onopen = function () { 
        console.log("we in"); 
     };

    localChannel.onerror = function (error) { 
       console.log("Error:", error); 
    };
     
    localChannel.onmessage = function (event) { 
       console.log("Got message:", event.data); 
    };  
}


function processAllUsers(users) {
    allusers = users

    var temp = document.getElementsByClassName('tempblock')

    while (temp[0]) {
        temp[0].parentNode.removeChild(temp[0]);
    }



    for (let i = 0; i < allusers.length; i++) {

        
        let label = allusers[i];
        if (label == myId){
            continue
        }

        
        var btn = document.createElement("BUTTON");
        btn.className = "tempblock";

        btn.onclick = function () {
            sendRequest(i)
        }
        btn.innerHTML = label;
        buttons.appendChild(btn);

    }

}


function processMyId(id) {

    if (typeof id == 'string') {
        myId = id
    }

}


sendMsgBtn.addEventListener("click", async function (event) { 

    var file = document.getElementById('msgInput').files[0]
    console.log(file.name)
    fileChannel = local.createDataChannel(file.name);
    fileChannel.binaryType = 'arraybuffer';

    const arrayBuffer =  await file.arrayBuffer();

    for (let i = 0; i < arrayBuffer.byteLength; i += MAXIMUM_MESSAGE_SIZE) {
        fileChannel.send(arrayBuffer.slice(i, i + MAXIMUM_MESSAGE_SIZE));
    }

    fileChannel.send(END_OF_FILE_MESSAGE);

    fileChannel.close()

  });

  
 

const downloadFile = (blob, fileName) => {
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    console.log(fileName)
    a.href = url ;
    a.download = fileName 
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove()
  };

function HandleFileData(event, receivedBuffers, label){
    const data = event.data
    try {
        if (data !== END_OF_FILE_MESSAGE)
            receivedBuffers.push(data);
        else{
            const arrayBuffer = receivedBuffers.reduce((acc, arrayBuffer) => {
            const tmp = new Uint8Array(acc.byteLength + arrayBuffer.byteLength);
            tmp.set(new Uint8Array(acc), 0);
            tmp.set(new Uint8Array(arrayBuffer), acc.byteLength);
            return tmp;
        }, new Uint8Array());
        const blob = new Blob([arrayBuffer]);
        console.log(blob)
        downloadFile(blob, label)
        }
    } catch(err){

    }
}