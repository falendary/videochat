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
    { urls: "stun:chat.szch.one:3478"},
    { urls: 'turn:chat.szch.one:3478',
      username: 'prouser', 
      credential: '123456',
    }
  ]
}

function initWebscokets() {

  socket = io.connect('', {port: 3000});

  socket.on('webrtc_message', function(message) {

    console.log('webrtc_message message', message);

    if (pc) {

      if (message.type === 'offer') {

        pc.setRemoteDescription(new RTCSessionDescription(message), function(){

          if (pc.remoteDescription.type === 'offer') {
            pc.createAnswer().then(function(answer){

                pc.setLocalDescription(answer).then(function(){
                  socket.emit('webrtc_message', pc.localDescription);
                });

            }).catch(function(error){
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

    }

  })

  socket.on('room_message', function (message){

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

    if (message.action === 'user_joined_room_signal') {

    }


  });

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

    pc = new RTCPeerConnection(configuration);

    pc.addStream(mediaStream);

    pc.onicecandidate = function (event){

      if (event.candidate) {
        socket.emit('webrtc_message', {
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      }

    };

    pc.onaddstream = function (event){
      remoteVideo.srcObject = event.stream
    };

    if (isOfferer) {

      pc.onnegotiationneeded = function(){

        pc.createOffer().then(function(offer){

          pc.setLocalDescription(offer).then(function(){

            socket.emit('webrtc_message', pc.localDescription);

          })

        }).catch(function(error){
          console.log('onnegotiationneeded.error', error)
        });

      }
    }

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


