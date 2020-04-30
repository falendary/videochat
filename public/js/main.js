var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

var pc; // PeerConnection
var mediaStream;


// Step 1. getUserMedia
navigator.getUserMedia(
  { audio: true, video: true }, 
  gotStream, 
  function(error) { console.log(error) }
);

function gotIceCandidate(event){

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
  document.getElementById("remoteVideo").srcObject = event.stream
}


function gotStream(stream) {

  mediaStream = stream;

  // mediaStream.getAudioTracks()[0].enabled = false;

  console.log('gotStream', stream);

  document.getElementById("localVideo").srcObject = stream;

  pc = new PeerConnection(null);
  pc.addStream(stream);
  pc.onicecandidate = gotIceCandidate;
  pc.onaddstream = gotRemoteStream;
}


function gotLocalDescription(description){

  pc.setLocalDescription(description);
  sendMessage(description);

}

function toggleMicro() {
  mediaStream.getAudioTracks()[0].enabled = !mediaStream.getAudioTracks()[0].enabled;
}

// Step 2. createOffer
function createOffer() {

  console.log("creating offer", pc)

  pc.createOffer(
    gotLocalDescription, 
    function(error) { console.log(error) }, 
    { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
  );


}


// Step 3. createAnswer
function createAnswer() {

  console.log("creating offer", pc)

  pc.createAnswer(
    gotLocalDescription,
    function(error) { console.log(error) }, 
    { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
  );
}


////////////////////////////////////////////////
// Socket.io

var socket = io.connect('', {port: 3000});

function sendMessage(message){

   console.log('send message', message);

  socket.emit('message', message);
}

socket.on('message', function (message){

  console.log('on message', message);

  if (message.type === 'offer') {
    pc.setRemoteDescription(new SessionDescription(message));
    createAnswer();
  } 

  else if (message.type === 'answer') {
    pc.setRemoteDescription(new SessionDescription(message));
  } 

  else if (message.type === 'candidate') {
    var candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
    pc.addIceCandidate(candidate);
  }
});


socket.on('log', function (message){

  console.log('log', message);

});
