var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

var pc; // PeerConnection
var mediaStream;
var socket;

function sendMessage(message){

  console.log('send message', message);

  socket.emit('message', message);
}

function initWebscokets() {

  socket = io.connect('', {port: 3000});

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

    else if (message.type === 'close') {
      pc.close();

      handleCloseCall();
    } 


  });


  socket.on('log', function (message){

    console.log('log', message);

  });

}


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

  pc = new PeerConnection(null);
  pc.addStream(stream);
  pc.onicecandidate = gotIceCandidate;
  pc.onaddstream = gotRemoteStream;
}


function gotLocalDescription(description){

  console.log('gotLocalDescription.description', description);

  pc.setLocalDescription(description);
  sendMessage(description);

}

function toggleMicro() {

  mediaStream.getAudioTracks()[0].enabled = !mediaStream.getAudioTracks()[0].enabled;

  console.log('toggleMicro', mediaStream.getAudioTracks()[0].enabled)

  if (mediaStream.getAudioTracks()[0].enabled) {
    $('#toggleMicro').html('Выключить Микрофон')
  } else {
    $('#toggleMicro').html('Включить Микрофон')
  }

}

// Step 2. createOffer
function createOffer() {

  console.log("creating offer", pc)

  document.getElementById("localVideo").srcObject = mediaStream;

  $('#callButton').hide()
  $('#endCallButton').show()

  pc.createOffer(gotLocalDescription, 
    function(error) { console.log(error) }, 
    { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
  );


}


// Step 3. createAnswer
function createAnswer() {

  console.log("creating offer", pc)

  $('#callButton').hide()
  $('#endCallButton').show()

  pc.createAnswer(gotLocalDescription,
    function(error) { console.log(error) }, 
    { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
  );

}

function handleCloseCall(){

  var tracks = mediaStream.getTracks()

  tracks.forEach(function(track) {

    track.stop();

  })

  mediaStream = undefined

  document.getElementById("localVideo").srcObject = undefined;
  document.getElementById("remoteVideo").srcObject = undefined;

  $('#callButton').show()
  $('#endCallButton').hide()

}

function endCall() {

  sendMessage({type: 'close'})

  pc.close();

  handleCloseCall();

}

function init() {

  initWebscokets();

}

init();


////////////////////////////////////////////////
// Socket.io


