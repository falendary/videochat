const express = require('express');

const app = express();
const port = 80;

// Set public folder as root
app.use(express.static('public'));

// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));



var http = require('http').createServer(app);

var io = require('socket.io').listen(http);

io.sockets.on('connection', function (socket) {

	socket.on('message', function (message) {
		console.log('Got message: ', message);
		socket.broadcast.emit('message', message); // should be room only
	});

	// socket.on('create or join', function (room) {
	// 	var numClients = io.sockets.clients(room).length;

	// 	console.log('Room ' + room + ' has ' + numClients + ' client(s)');
	// 	console.log('Request to create or join room', room);

	// 	if(numClients == 0) {
	// 		socket.join(room);
	// 		socket.emit('created', room);
	// 	} 

	// 	else if(numClients == 1) {
	// 		io.sockets.in(room).emit('join', room);
	// 		socket.join(room);
	// 		socket.emit('joined', room);
	// 	} 

	// 	else { // max two clients
	// 		socket.emit('full', room);
	// 	}

	// 	socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
	// 	socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
	// });
});



http.listen(port, () => {
  console.info('listening on %d', port);
});