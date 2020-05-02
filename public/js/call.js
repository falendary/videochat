var pc; // PeerConnection
var mediaStream;
var socket;

var endCallButton = document.getElementById('endCallButton');
var toggleMicroButton = document.getElementById('toggleMicro');

var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

var roomHash;

var configuration = {
  iceServers: [
    { urls: "stun:chat.szch.one:3478", 
      username: 'prouser', 
      credential: '123456'
    }
  ]
}

function sendMessage(message){

  console.log('send message', message);

  socket.emit('room_message', message);

}

function initWebscokets() {

  socket = io.connect('', {port: 3000});

  socket.on('room_message', function (message){

    console.log('on room_message type', message.type);
    console.log('on room_message ', message);


    if (message.type === 'offer') {
      pc.setRemoteDescription(new RTCSessionDescription(message));
      createAnswer();
    } 

    else if (message.type === 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(message));
    } 

    else if (message.type === 'candidate') {
      var candidate = new RTCIceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
      pc.addIceCandidate(candidate);
    }

    else if (message.type === 'close') {

      if (pc) {

        pc.close();
        pc = null;

        location.href = '/';

      }

    } 


  });

}

function gotIceCandidate(event){

  console.log('gotIceCandidate.event', event);

  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  }

}

function gotRemoteStream(event){
  remoteVideo.srcObject = event.stream
}


function gotLocalDescription(description){

  console.log('gotLocalDescription.description', description);

  pc.setLocalDescription(description);
  sendMessage(description);

}

function createOffer() {

  console.log("creating offer", pc)

  pc = new RTCPeerConnection(configuration);

  pc.addStream(mediaStream);
  pc.onicecandidate = gotIceCandidate;
  pc.onaddstream = gotRemoteStream;

  pc.createOffer(gotLocalDescription, 
    function(error) { console.log(error) }, 
    { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
  );


}

function createAnswer() {

  console.log("creating offer", pc)

  pc.createAnswer(gotLocalDescription,
    function(error) { console.log(error) }, 
    { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
  );

}

function endCall() {

  pc.close();
  pc.null;

  sendMessage({type: 'close', data: {
    room_hash: roomHash
  }})

  location.href = '/';

}

function startCall(){

  console.log('Requesting local stream');

  navigator.mediaDevices.getUserMedia(
    { audio: true, video: true }, 
  ).then(function(data){
    
    mediaStream = data;

    localVideo.srcObject = mediaStream;

    createOffer();

    toggleMicro(); // remove later

  })
  
}

function toggleMicro() {

  mediaStream.getAudioTracks()[0].enabled = !mediaStream.getAudioTracks()[0].enabled;

  console.log('Microphone status: ', mediaStream.getAudioTracks()[0].enabled)

  if (mediaStream.getAudioTracks()[0].enabled) {
    toggleMicroButton.innerText = 'Выключить Микрофон';
  } else {
    toggleMicroButton.innerText = 'Включить Микрофон';
  }

}

function init() {

  if (location.hash) {

    roomHash = location.hash.split('room=')[1];

    initWebscokets();

    startCall();

    endCallButton.addEventListener('click', function(event){
      endCall();
    })

    toggleMicroButton.addEventListener('click', function(event){
      toggleMicro();
    })

   } else {

    location.href = '/'

  }

}

init();


