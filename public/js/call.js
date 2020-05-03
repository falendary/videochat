var pc; // PeerConnection
var mediaStream;
var socket;

var endCallButton = document.getElementById('endCallButton');
var toggleMicroButton = document.getElementById('toggleMicro');

var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

var roomHash;
var userHash;

var configuration = {
  iceServers: [
    { urls: "stun:chat.szch.one:3478"}
  ]
}

function initWebscokets() {

  socket = io.connect('', {port: 3000});

  socket.on('webrtc_message', function(message) {

    console.log('webrtc_message message', message);

    if (message.type === 'offer') {

      pc.setRemoteDescription(new RTCSessionDescription(message), function(){

        if (pc.remoteDescription.type === 'offer') {
          pc.createAnswer().then(gotLocalDescription).catch(function(error){
            console.log('Error', error);
          })
       }

      });
     
    } 

    if (message.type === 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(message));
    } 

    if (message.type === 'candidate') {

      var candidate = new RTCIceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
        
      console.log('candidate', candidate);

      try {
        if (candidate) {
          pc.addIceCandidate(candidate);
        }
      } catch  (err) {
          console.log("err", err);
      }

    }



  })

  socket.on('room_message', function (message){

    console.log('on room_message type', message.type);
    console.log('on room_message ', message);

    if (message.action === 'close') {

      if (pc) {

        pc.close();
        pc = null;

        location.href = '/';

      }

    } 

    if(message.action  === 'join_room_response') {

      if (message.data.room) {

        var isOfferer = false;


        if (message.data.room.members.length === 1) {

          console.log("Initiator")

          startCall(isOfferer);

        }

        if (message.data.room.members.length === 2) {

          isOfferer = true;

          

          console.log("Offerer")

          startCall(isOfferer);

        }

        endCallButton.addEventListener('click', function(event){
            endCall();
        })

        toggleMicroButton.addEventListener('click', function(event){
          toggleMicro();
        })

        setInterval(function(){

            socket.emit('room_message', {
              action: 'refresh',
              data: {
                room: {
                  room_hash: roomHash
                }
              }
            })

          }, 60 * 1000)

      } else {

        location.href = '/'

      }

    }


  });

}

function gotIceCandidate(event){

  if (event.candidate) {
    socket.emit('webrtc_message', {
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
  socket.emit('webrtc_message', description);

}

function createOffer(isOfferer) {

  pc = new RTCPeerConnection(configuration);

  pc.addStream(mediaStream);
  pc.onicecandidate = gotIceCandidate;
  pc.onaddstream = gotRemoteStream;

  if (isOfferer) {

    pc.onnegotiationneeded = function(){

      pc.createOffer(gotLocalDescription, 
        function(error) { console.log(error) }, 
        { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
      );

    }
  }


}

function endCall() {

  pc.close();
  pc.null;

  socket.emit('room_message', {action: 'close', data: {
    room_hash: roomHash
  }})

  location.href = '/';

}

function startCall(isOfferer){

  console.log('Requesting local stream');

  navigator.mediaDevices.getUserMedia(
    { audio: true, video: true }, 
  ).then(function(data){
    
    mediaStream = data;

    localVideo.srcObject = mediaStream;

    createOffer(isOfferer);

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

  userHash = localStorage.getItem('user_hash')

  if(!userHash) {
    location.href = '/'
  }

  if (location.hash) {

    roomHash = location.hash.split('room=')[1];

    initWebscokets();

    socket.emit('room_message', {
      action: 'join_room_request',
      data: {
        room_hash: roomHash,
        user_hash: userHash
      }
    })

   } else {

    location.href = '/'

  }

}

init();


