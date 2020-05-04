
var roomsHolder = document.getElementById('roomsHolder');
var createRoomButton = document.getElementById('createRoomButton');

var checkTurnConnectionButton = document.getElementById('checkTurnConnectionButton');
var turnConnectionTestResult = document.getElementById('turnConnectionTestResult');

var checkStunConnectionButton = document.getElementById('checkStunConnectionButton');
var stunConnectionTestResult = document.getElementById('stunConnectionTestResult');

var userHash;

var audioInterval;
var audio = document.getElementById('audio')


function initWebscokets() {

  console.log('initWebscokets');

  socket = io.connect('', {port: 3000});

  socket.on('lobby_message', function (message){

    console.log('message', message);

    if (message.type === 'get_rooms_response') {

      var rooms = message.data.rooms;

      if (Object.keys(rooms).length) {

        audioInterval = setInterval(function(){

          audio.play();

        }, 1000)

        var rooms_result_html = '';

        rooms_result_html = '<div class="rooms-table-head"><div class="width-20 p-8">Комната</div><div class="width-20 p-8">Мест</div><div class="width-60 p-8"></div></div>'

        var rooms_rows = [];

        rooms_result_html = rooms_result_html + '<div class="rooms-table-body">'

        Object.keys(rooms).forEach(function(key) {

          var room = rooms[key];

          if (room.members.length < 2) {

            var row = '<div class="rooms-table-row">';            

            row = row + '<div class="width-20 p-8">' + room.room_hash + '</div>'

            row = row + '<div class="width-20 p-8">' + room.members.length + '/' + room.members_limit + '</div>'

            row = row + '<div class="width-60 p-8"><a class="join-room-button" href="/call.html#room='+room.room_hash+'">Присоединиться</button></a></div>'

            row = row + '</div>';

            rooms_rows.push(row);

          }

        })


        rooms_result_html = rooms_result_html + rooms_rows.join('')

        rooms_result_html = rooms_result_html + '</div>';

        roomsHolder.innerHTML = rooms_result_html;

      } else {

        clearInterval(audioInterval)

        audio.pause();

        roomsHolder.innerHTML = '<p class="text-center">Никто не начал звонка</p>'

      }

    }

    if (message.type === 'create_room_response') {

        location.href = '/call.html#room=' + message.data.room.room_hash;

    }

    if (message.type === 'room_created_signal') {
      socket.emit('lobby_message', {
        action: 'get_rooms_request'
      });
    }



  })


  socket.emit('lobby_message', {
      action: 'get_rooms_request'
  });

}

function checkTurnOrStun(turnConfig, timeout){ 

  return new Promise(function(resolve, reject){

    setTimeout(function(){
        if(promiseResolved){
            if (promiseResolved == 'STUN') resolve('STUN');
            return;
        }
        resolve(false);
        promiseResolved = true;
    }, timeout || 5000);

    var promiseResolved = false;
    var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;   //compatibility for firefox and chrome
    var pc = new myPeerConnection({iceServers:[turnConfig]});
    var noop = function(){};

    pc.createDataChannel("");    //create a bogus data channel
    pc.createOffer(function(sdp){

      if(sdp.sdp.indexOf('typ relay') > -1){ // sometimes sdp contains the ice candidates...
        promiseResolved = 'TURN'; 
        resolve(true);
      }

      pc.setLocalDescription(sdp, noop, noop);

    }, noop);    // create offer and set local description

    pc.onicecandidate = function(ice){  //listen for candidate events

      if( !ice || !ice.candidate || !ice.candidate.candidate)  return;

      if (ice.candidate.candidate.indexOf('typ relay')!=-1) { promiseResolved = 'TURN'; resolve('TURN'); }

      else if (!promiseResolved && (ice.candidate.candidate.indexOf('typ prflx')!=-1 || ice.candidate.candidate.indexOf('typ srflx')!=-1)){
        
        promiseResolved = 'STUN';

        if (turnConfig.url.indexOf('turn:') !== 0) {
          resolve('STUN')
        }

      }

      else return;

    };


  });   
}

function createLocalUser(){

  userHash = localStorage.getItem('user_hash')

  if (!userHash) {
    userHash = Math.floor(Math.random() * 10000 * 0xFFFFFF).toString(16);
    localStorage.setItem('user_hash', userHash);
  } 
  
}

function init(){

    createLocalUser();
    initWebscokets();

    createRoomButton.addEventListener('click', function(){

      socket.emit('lobby_message', {
        action: 'create_room_request',
        data: {
          user_hash: userHash
        }
      });

    })

    checkTurnConnectionButton.addEventListener('click', function(){

      turnConnectionTestResult.innerHTML = '';

      var timeout = 60 * 1000;
      var configuration = {
        url: 'turn:chat.szch.one',
        username: 'prouser', 
        credential: '123456',
      }

      checkTurnOrStun(configuration, timeout).then(function(result){

        if(result)
           turnConnectionTestResult.innerHTML = 'Успех. Соединение с TURN сервером установлено.';
        else
           throw new Error('Doesn\'t work');
      }).catch(function(e){
         console.log(e);
         turnConnectionTestResult.innerHTML = 'TURN сервер не работает.';
      });

    })


    checkStunConnectionButton.addEventListener('click', function(){

      stunConnectionTestResult.innerHTML = '';

      var timeout = 60 * 1000;
      var configuration = {
        url: 'stun:chat.szch.one'
      }

      checkTurnOrStun(configuration, timeout).then(function(result){
        if(result)
           stunConnectionTestResult.innerHTML = 'Успех. Соединение с STUN сервером установлено.';
        else
           throw new Error('Doesn\'t work');
      }).catch(function(e){
         console.log(e);
         stunConnectionTestResult.innerHTML = 'STUN сервер не работает.';
      });

    })

}

init();