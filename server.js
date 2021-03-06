const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = 3000;

const USERNAME = process.env.USERNAME || 'user';
const PASSWORD = process.env.PASSWORD || '666666';

console.log("Basic Auth Username: " + USERNAME)
console.log("Basic Auth Password: " + PASSWORD)

app.use(function(req, res, next) {

	var authorization = req.headers['authorization'];
    console.log("Authorization Header is: ", authorization);

    if(!authorization) { 

        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

        res.end('<html><body>Login required</body></html>');

    } else {   

        var pieces = authorization.split(' ');   // eg "Basic Y2hhcmxlczoxMjM0NQ==" we are loking for the 2nd part

        var buf = new Buffer(pieces[1], 'base64'); // create a buffer and tell it the data coming in is base64
        var decoded_auth = buf.toString();        // read it back out as a string

        console.log("Decoded Authorization ", decoded_auth);

        var credentials = decoded_auth.split(':');   // eg "username:password" split on a ':'
        var username = credentials[0];
        var password = credentials[1];

        if( username === USERNAME && password === PASSWORD) {
            return next()
        } else {
            res.statusCode = 401; // Force them to retry authentication
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.end('<html><body>Access Denied</body></html>');
        }
    }

})

// Set public folder as root
app.use(express.static('public'));

// Provide access to node_modules folder from the client-side
app.use('/scripts', express.static(`${__dirname}/node_modules/`));

// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

var http = require('http').createServer(app);

var io = require('socket.io').listen(http);

var rooms = {

};

io.sockets.on('connection', function (socket) {

	socket.on('webrtc_message', function(message){

		socket.broadcast.emit('webrtc_message', message);

	})

	socket.on('room_message', function (message) {

		console.log('room_message.message', message)

		if (message.action === 'close') {
			delete rooms[message.data.room_hash];

			console.log('rooms', rooms);

			socket.broadcast.emit('room_message', message);

			socket.broadcast.emit('lobby_message', {type: 'get_rooms_response', data: {
				rooms: rooms
			}});


		}
		
		if (message.action === 'refresh') {

			if (message.data) {

				if (message.data.room) {
					if (rooms[message.data.room.room_hash]) {

						rooms[message.data.room.room_hash].modified_at = new Date();

					}

				}

				destroyBrokenRooms();

				socket.broadcast.emit('room_message', message);

			}

		}

		if (message.action === 'join_room_request') {

			var room = null;

			if (message.data) {

				room_hash = message.data.room_hash
				user_hash = message.data.user_hash;

				room = rooms[room_hash]

				if (room) {

					if (room.members.length < 2) {

						if (room.members.indexOf(user_hash) === -1) {

							room.members.push(user_hash);

						}

					}

				}

				console.log('room', room);
			
			}

			message = {
				action: 'join_room_response',
				data: {
					room: room
				}
			}

			socket.emit('room_message', message);
			socket.broadcast.emit('room_message', {
				type: 'user_joined_room_signal'
			});

		}

		
	});

	socket.on('lobby_message', function(message){

		console.log('lobby_message.message', message)

		if (message.action === 'get_rooms_request') {

			socket.emit('lobby_message', {type: 'get_rooms_response', data: {
				rooms: rooms
			}});

		}

		if (message.action === 'create_room_request') {

			var hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);

			var room = {
				members_limit: 2,
				members: [message.data.user_hash],
				room_hash: hash,
				created_at: new Date(),
				modified_at: new Date()
			}

			rooms[hash] = room

			socket.emit('lobby_message', {type: 'create_room_response', data: {
				room: room
			}});

			socket.broadcast.emit('lobby_message', {type: 'room_created_signal'})

		}

	});

});

function destroyBrokenRooms(){

	console.log("Looking for broking rooms")

	Object.keys(rooms).forEach(function(key){

		var room = rooms[key]

		var two_minutes = 2 * 60 * 1000;

		if (new Date() - room.modified_at > two_minutes) {
			delete rooms[key];
		}

	})

}

setInterval(function(){

	destroyBrokenRooms();

}, 60 * 1000)

http.listen(port, () => {
  console.info('listening on %d', port);
});