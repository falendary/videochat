
var roomsHolder = document.getElementById('roomsHolder');
var createRoomButton = document.getElementById('createRoomButton');

function initWebscokets() {

  console.log('initWebscokets');

  socket = io.connect('', {port: 3000});

  socket.on('lobby_message', function (message){

    console.log('message', message);

    if (message.type === 'get_rooms_response') {

      var rooms = message.data.rooms;

      if (Object.keys(rooms).length) {

        var rooms_result_html = '';

        rooms_result_html = '<div class="rooms-table-head"><div class="width-50 p-8">Room Name</div><div class="width-20 p-8">Members</div><div class="width-30 p-8"></div></div>'

        var rooms_rows = [];

        rooms_result_html = rooms_result_html + '<div class="rooms-table-body">'

        Object.keys(rooms).forEach(function(key) {

          var row = '<div class="rooms-table-row">';

          var room = rooms[key];

          row = row + '<div class="width-50 p-8">' + room.room_hash + '</div>'

          row = row + '<div class="width-20 p-8">' + room.members + '/' + room.members_limit + '</div>'

          row = row + '<div class="width-30 p-8"><a class="join-room-button" href="/call.html#room='+room.room_hash+'">Присоединиться</button></a>'

          row = row + '</div>';

          rooms_rows.push(row);

        })


        rooms_result_html = rooms_result_html + rooms_rows.join('')

        rooms_result_html = rooms_result_html + '</div>';

        roomsHolder.innerHTML = rooms_result_html;

      } else {

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

function init(){

    initWebscokets();

    createRoomButton.addEventListener('click', function(){

      socket.emit('lobby_message', {
        action: 'create_room_request'
      });

    })

}

init();