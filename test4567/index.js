const code = document.getElementById('code');
const buttons = document.getElementById('buttons');
const message = document.getElementById('message');`
`
const ws = new WebSocket("ws://77.54.205.151/", ['json']);

var msgInput = document.querySelector('#msgInput'); 
var sendMsgBtn = document.querySelector('#sendMsgBtn');

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
    local.onconnectionstatechange = (x) => { 
        // console.log('CHANGED', x) 
    }
   
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
        var receiveChannel = event.channel;
        receiveChannel.onmessage = function(event) {
           console.log("ondatachannel message:", event.data);
        };
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
                var receiveChannel = event.channel;
                receiveChannel.onmessage = function(event) {
                   console.log("ondatachannel message:", event.data);
                };
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
        localChannel.send('hi')
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
        // console.log(`your id is ${id}`) 
    }

}

sendMsgBtn.addEventListener("click", function (event) { 
    console.log("send message");
    var val = msgInput.value; 
    localChannel.send(val); 
 })



// remote.ondatachannel = (noClue) => console.log(`RemoteChannel onDataChannel ${noClue.toString()}`);


// remote.onicecandidate = (e) => { if (e.candidate) { localAddICE(e.candidate) } }


// async function remoteAddICE(candidate) {
//     return await remote.addIceCandidate(candidate)
// }

// function localAddICE(candidate) {
//     local.addIceCandidate(candidate).catch(() => { })
// }

// Now create an offer to connect; this starts the process

// async function slowDownBoy() {
//     try {
//         const offer = await local.createOffer()
//         console.log(1)
//         await local.setLocalDescription(offer)
//         console.log(2)
//         await remote.setRemoteDescription(local.localDescription)
//         console.log(3)
//         const answer = await remote.createAnswer()
//         console.log(4)
//         await remote.setLocalDescription(answer)
//         console.log(5)
//         await local.setRemoteDescription(remote.localDescription)
//         console.log(6)
//     } catch (e) {

//     }

// }

// slowDownBoy()
// console.log('Called it!')

