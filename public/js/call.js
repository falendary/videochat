var pc; // PeerConnection
var mediaStream;
var socket;

var endCallButton = document.getElementById('endCallButton');
var toggleMicroButton = document.getElementById('toggleMicro');

var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
navigator.msGetUserMedia;

var roomHash;
var userHash;

var showButtons = true;

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

  console.log('Requesting local stream: init');

  navigator.getUserMedia(
    { audio: true, video: true }, 
    function onSuccess(data){

      console.log('Requesting local stream: success');

      mediaStream = data;

      localVideo.srcObject = mediaStream;



      pc = new RTCPeerConnection(configuration);

      for (const track of mediaStream.getTracks()) {
        pc.addTrack(track, mediaStream);
      }

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

      pc.ontrack = function (event){
        remoteVideo.srcObject = event.streams[0];
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

  }, function onError(error){

    console.log('Requesting local stream: fail');

    alert(error);

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

function setLocalDraggableListener(){

    var startX;
    var startY;

    var lastX;
    var lastY;

    var currentY;
    var currentX;

    var resultY;
    var resultX;

    var mousePressed = false;

    var maxLeft;
    var maxTop;

    var elem = document.querySelector('.local-video-holder')

    elem.addEventListener('mousedown', function(event){

      // console.log('card mousedown event', event);

      if (event.target.classList.contains('draggable-corner')) {

        startX = event.clientX;
        startY = event.clientY;

        currentY = parseInt(elem.style.top.split('px')[0], 10);
        currentX = parseInt(elem.style.left.split('px')[0], 10);

        mousePressed = true;

      }

    })

    document.body.addEventListener('mouseup', function(event) {

      // console.log('mouseup event', event);

      mousePressed = false;

    })

    document.body.addEventListener('mousemove', function(event) {

      // console.log('mousePressed', mousePressed);

      if (mousePressed) {

        // console.log('mousemove event', event);

        lastX = event.clientX;
        lastY = event.clientY;

        maxLeft = document.body.clientWidth - elem.clientWidth;
        maxTop = document.body.clientHeight - elem.clientHeight;

        console.log('maxTop', maxTop);

        
        if (!currentY){
            currentY = 0
        }

        if (!currentX){
            currentX = 0
        }

        resultY = currentY + lastY - startY
        resultX = currentX + lastX - startX

        if (resultY < 0) {
          resultY = 0
        } 

        if (resultY > maxTop) {
          resultY = maxTop
        }

        if (resultX < 0) {
          resultX = 0
        } 

        if (resultX > maxLeft) {
          resultX = maxLeft
        }


        elem.style.top = resultY  + 'px';

        elem.style.left =  resultX + 'px';

       
      }

    })

}

function setHideButtonsHandler(){

  document.getElementById('hideButtonsButton').addEventListener('click', function(){

    showButtons = !showButtons;


    if (showButtons) {

      document.getElementById('endCallButton').style.display = 'block';
      document.getElementById('toggleMicro').style.display = 'block';

    } else {

      document.getElementById('endCallButton').style.display = 'none';
      document.getElementById('toggleMicro').style.display = 'none';

    }

  })

}

function init() {

  setLocalDraggableListener();
  setHideButtonsHandler();

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


