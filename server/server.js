const ioServer = require('socket.io');
const express 	= require('express');
const _	= require('lodash');
const cors = require('cors');
const http = require('http');
const PORT = 4000;
const app = express();

// Handle cors
app.use(cors());

// Parse JSON body
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

const CHAT_EVENT_NAME = 'chat';
const CHAT_ROOM_JOIN_EVENT_NAME = 'new-user-joined';

const SUPPORTED_EVENTS = [{name: CHAT_EVENT_NAME}, {name: CHAT_ROOM_JOIN_EVENT_NAME}];

// This class manage all socket connections and chat room communications using Socket.io
class Server {
	constructor() {
		this.socketInstances = {};
		this.subscribers = {};
		this.subscriptions = {};
		const httpServer = http.createServer(app).listen(PORT);
		this.io = ioServer(httpServer, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
				credentials: false
			}
		});

		this.io.on('connection',  (socket) => {
			// Get the user and room associated with this connection
			const from = _.get(socket, 'handshake.query.userId');
			console.log(`new connection from ${from}`);

			// Register event handlers
			SUPPORTED_EVENTS.forEach(({name: eventName}) => {
				socket.on(eventName, (data) => {
					return this.emit({eventName, data});
				});
			});

			if(!from) { return; }

			// Keep track of all connected clients
			// This is very helpful when Direct Messaging a user so we can send the message to all connected socket from that user
			this.socketInstances[from] = (this.socketInstances[from] || []).filter(socket => socket && socket.connected);
			this.socketInstances[from].push(socket);
		});

		this.io.sockets.on('disconnect', (socket) => {
			// Clean up user open connection list
			const from = _.get(socket, 'handshake.query.userId');
			console.log(`new disconnection from ${from}`);
			this.socketInstances[from] = (this.socketInstances[from] || []).filter(socket => socket && socket.connected);
		});

		this.initRoutes();
	}

	// Return a consistent channel name for chat rooms
	getChannelName({eventName, roomId}) {
		return `${roomId}`;
		// return `${eventName}-${roomId}`;
	}

	// Register user sockets to a chat room (channel)
	joinChannel({sockets, channel}) {
		sockets.forEach(socket => {
			const isInRoom = socket.rooms.has(channel);
			if(!isInRoom) {
				socket.join(channel);
			}
		});
	}

	getUsersInRoom({roomId}) {
		const channel = this.getChannelName({eventName: CHAT_EVENT_NAME, roomId});
		return this.io.in(channel).fetchSockets().then((sockets) => {
			const userMap = {};
			sockets.forEach((socket) => {
				const from = _.get(socket, 'handshake.query.userId');
				userMap[from] = from;
			});

			return Object.keys(userMap).map(key => parseInt(key, 10));
		});
	}

	// Persist the user subscriptions and connect him to the room
	subscribe({eventName, rooms, from}) {
		// TODO: Save user subscriptions to DB

		const sockets = this.socketInstances[from];

		// Stop here if there is no connected socket for this user
		if(!(sockets && sockets.length)) {
			return Promise.resolve({success: true});
		}

		rooms.forEach(roomId => {
			const channel = this.getChannelName({eventName, roomId});
			this.joinChannel({channel, sockets});
		});

		return Promise.resolve({success: true});
	}

	// Delete the user subscription and disconnect him from chat rooms
	unsubscribe({eventName, rooms, from}) {
		// TODO: delete subscriptions from the DB

		rooms.forEach(roomId => {
			const channel = this.getChannelName({eventName, roomId});

			// remove the channel from user subscriptions
			const userSockets = (this.subscriptions[from] || []).filter(name => name === channel);

			userSockets.forEach((socket) => {
				socket.leave(channel);
			})
		});

		return Promise.resolve({success: true});
	}

	// Every event originate from a specific room (group or p2p)
	// So we should only broadcast the event to those who belongs to the corresponding room
	emit({eventName, data}) {
		const {roomId} = data;
		const channel = this.getChannelName({eventName, roomId});
		this.io.to(channel).emit(eventName, data);

		return Promise.resolve({success: true});
	}

	initRoutes() {
		app.post('/subscribe', (req, res) => {
			const eventName = _.get(req.body, 'eventName');
			const userId = _.get(req.body, 'userId');
			const rooms = _.get(req.body, 'roomIds');

			this.subscribe({eventName, rooms, from: userId}).then((reps) => {
				res.status(201).send({success: true});
			});
		});

		app.post('/unsubscribe', (req, res) => {
			const eventName = _.get(req.body, 'eventName');
			const userId = _.get(req.body, 'userId');
			const rooms = _.get(req.body, 'roomIds');
			this.unsubscribe({eventName, rooms, from: userId}).then((reps) => {
				res.status(201).send({success: true});
			});
		});

		app.post('/sign-out', (req, res) => {
			const from = _.get(req.body, 'userId');

			// Remove user socket instance from connected socket list
			delete this.socketInstances[from];

			// Remove user from event subscribers
			(this.subscriptions[from] || []).forEach(eventName => {
				// Important: do not call unsubscribe method here has it will also remove eventName from user subscriptions
				delete this.subscribers[eventName][from];
			});

			// delete user subscriptions
			delete this.subscriptions[from];

			res.status(201).send({success: true});
		});

		app.post('/get-room-users', (req, res) => {
			const roomId = _.get(req.body, 'roomId');
			this.getUsersInRoom({roomId}).then((users) => {
				res.status(201).send({success: true, users});
			}, () => {
				res.status(201).send({success: false});
			});
		});
	}
}

module.exports = new Server();
