const express = require('express');
const https = require('https');
const fs = require('fs');
const io = require('socket.io')

const credentials = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const app = express();
const port = 8080;
const secure_port = 8433

app.use(express.static('public'));
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

var https_app = https.createServer(app, credentials);

var io_app = io.listen(https_app);

io_app.sockets.on('connection', function (socket) {

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


https_app.listen(secure_port, () => {
  console.info('listening on %d', secure_port);
});