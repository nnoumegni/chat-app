const ioServer = require('socket.io');
const express 	= require('express');
const {AES}  = require('crypto-js');
const _	= require('lodash');
const cors = require('cors');
const http = require('http');
const axios = require('axios');
const JsDB = require('./JsBD');
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
		this.db = new JsDB();
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
			const deviceId = _.get(socket, 'handshake.query.deviceId');

			console.log(`new connection from ${from} ${deviceId}`);

			// Register event handlers
			SUPPORTED_EVENTS.forEach(({name: eventName}) => {
				socket.on(eventName, (data) => {
					return this.emit({eventName, data});
				});
			});

			if(!(from && deviceId)) { return; }

			// Keep track of all connected clients
			// This is very helpful when Direct Messaging a user so we can send the message to all connected socket from that user
			this.socketInstances[from] = this.socketInstances[from] || {};
			this.socketInstances[from][deviceId] = socket;
		});

		this.io.sockets.on('disconnect', (socket) => {
			// Clean up user open connection list
			const from = _.get(socket, 'handshake.query.userId');
			const deviceId = _.get(socket, 'handshake.query.deviceId');

			console.log(`new disconnection from ${from} deviceId`);

			delete this.socketInstances[from][deviceId];
		});

		console.log('Listening on: ', PORT);

		this.initRoutes();
	}

	// Return a consistent channel name for chat rooms
	getChannelName({eventName, roomUri}) {
		return `${roomUri}`;
		// return `${eventName}-${roomUri}`;
	}

	getUuidByDevice({from, deviceId}) {
		return `${from}${deviceId}`;
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

	getUsersInRoom({roomUri}) {
		const channel = this.getChannelName({eventName: CHAT_EVENT_NAME, roomUri});
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
		return Promise.resolve({success: true});

		// TODO: Save user subscriptions to DB

		const keys = Object.keys(this.socketInstances[from] || {});

		const sockets = [];
		keys.forEach((deviceId) => {
			sockets.push(this.socketInstances[from][deviceId]);
		});

		// Stop here if there is no connected socket for this user
		if(!(sockets && sockets.length)) {
			return Promise.resolve({success: true});
		}

		console.log(sockets.length);

		rooms.forEach(roomUri => {
			const channel = this.getChannelName({eventName, roomUri});
			this.joinChannel({channel, sockets});
		});

		return Promise.resolve({success: true});
	}

	// Delete the user subscription and disconnect him from chat rooms
	unsubscribe({eventName, rooms, from}) {
		// TODO: delete subscriptions from the DB

		rooms.forEach(roomUri => {
			const channel = this.getChannelName({eventName, roomUri});

			// remove the channel from user subscriptions
			const userSockets = (this.subscriptions[from] || []).filter(name => name === channel);

			userSockets.forEach((socket) => {
				socket.leave(channel);
			})
		});

		return Promise.resolve({success: true});
	}

	sendMsg({userId, eventName, data}) {
		// get all connected clients for the receiver
		const devices = Object.keys((this.socketInstances[userId] || {}));
		console.log(devices)
		// Forward the message to all of them
		devices.forEach((deviceId) => {
			console.log('sending to ', deviceId);
			const socket = this.socketInstances[userId][deviceId];
			if(socket && socket.connected) {
				socket.emit(eventName, data);
			}
		});
	}

	// Every event originate from a specific room (group or p2p)
	// So we should only broadcast the event to those who belongs to the corresponding room
	emit({eventName, data}) {
		const {roomUri, type, receiver, sender, users} = data;
		const {userId: senderId} = sender || {};
		const {userId: receiverId} = receiver || {};

		console.log(type, receiver, data);
		this.sendMsg({userId: senderId, eventName, data});

		if(type === 'dm' && receiver) {
			const {userId} = receiver;
			this.sendMsg({userId, eventName, data});
		}

		// const channel = this.getChannelName({eventName, roomUri});
		// this.io.to(channel).emit(eventName, data);

		return Promise.resolve({success: true});
	}



	initRoutes() {
		app.post('/subscribe', (req, res) => {
			const eventName = _.get(req.body, 'eventName');
			const userId = _.get(req.body, 'userId');
			const rooms = _.get(req.body, 'roomUris');

			this.subscribe({eventName, rooms, from: userId}).then((reps) => {
				res.status(201).send({success: true});
			});
		});

		app.post('/unsubscribe', (req, res) => {
			const eventName = _.get(req.body, 'eventName');
			const userId = _.get(req.body, 'userId');
			const rooms = _.get(req.body, 'roomUris');
			this.unsubscribe({eventName, rooms, from: userId}).then((reps) => {
				res.status(201).send({success: true});
			});
		});

		app.post('/auth', (req, res) => {
			const requestIp = require('request-ip');
			const ip = requestIp.getClientIp(req);

			const data = req.body;
			data.ip = ip;
			data.s2s = 1;

			// Forward the request to the target server
			axios({
				method: req.method,
				url: `https://api.jetcamer.com/scrud`,
				data, // Forward the request body
			}).then(resp => {
				const {data: response} = resp || {};
				const {account} = response || {};

				if(account) {
					const {credit, success, email, username, card, ...user} = account;
					return res.status(201).send({success, user});
				} else {
					return res.status(201).send({success: false});
				}
			}, (e) => {
				res.status(201).send({success: false});
			});
		});

		app.post('/get-room-users', (req, res) => {
			const roomUri = _.get(req.body, 'roomUri');
			this.getUsersInRoom({roomUri}).then((users) => {
				res.status(201).send({success: true, users});
			}, () => {
				res.status(201).send({success: false});
			});
		});

		app.post('/scrud', (req, res) => {
			const requestIp = require('request-ip');
			const ip = requestIp.getClientIp(req);

			const data = req.body;
			data.ip = ip;
			data.s2s = 1;

			// Forward the request to the target server
			axios({
				method: req.method,
				url: `https://api.jetcamer.com/scrud`,
				data, // Forward the request body
			}).then(resp => {
				const {data: response} = resp || {};
				return res.status(201).send(response);
			}, (e) => {
				res.status(201).send({success: false});
			});
		});
	}
}

module.exports = new Server();
