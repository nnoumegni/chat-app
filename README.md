## Getting Started

### [Watch the video](https://www.youtube.com/watch?v=Wavb_ucARsY)

[![App Demo](https://github.com/nnoumegni/chat-app/blob/main/public/assets/preview.gif)](https://www.youtube.com/watch?v=Wavb_ucARsY)

This app is build using React with NextJs and NodeJs at the backend. To get started

### 1) Install the dependencies
- Checkout this repo
- Navigate to the root folder
```bash
run 
npm install
or 
yarn install
```

### 2) Start the backend server

1) Navigate to the `server` directory

```bash
run node server.js
```

### 2) Start the React app
1) In a separate terminal, run
```bash
npm dev
or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to load the app.


## Design Decisions
The most important aspect of a real-time app is performance. In order to achieve our goal, we've made the following design decisions:
### Handling Sockets communications
#### Front-end
- Have only one hook to manage communication with the backend socket server
- Upon login, create a web socket passing the user id as a query param for future requests
- Only keep one socket connection at anytime!
- From the hook, allow other components to register to events with different callbacks
- Only update message-related states from callbacks to keep things unidirectional
- Use zustand as it's intuitive, simple use yet very robust.
- To persist chat history, use IndexedDB for its performance and scalability 
- For authentication, use irreversible crypto algorithm (`HmacSHA256`) to encrypt user credentials. Never save user password in clear!

#### Backend
- Use a hash map to keep track of all connected sockets per user since they can join from different devices
- Upon disconnect or reconnect, update the list of connected sockets
- When a user creates a chat room, persist the data to a database and immediately join the room from all his connected sockets
- For scalability, create a separate table for each room chat history instead of having a single and huge table with foreign keys

### Folder structure
The folder structure below takes into account the app scalability and maintainability with clear separation of concerns with the layouts, components, hooks, models, store and api logic added into separate folders.
The ChatApp component component is the main entry point to the App.
```
📦 Chat App
├── 📂 src
│   ├── 📂 app
│   │   ├── 📂 components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── RoomList.tsx
│   │   │   ├── RoomUsers.tsx
│   │   │   ├── ChatMessages.tsx
│   │   │   └── Loader.tsx
│   │   ├── 📂 layouts
│   │   │   ├── AuthLayout.tsx
│   │   │   └── UnAuthLayout.tsx
│   │   ├── 📂 hooks
│   │   │   └── use-socket-io.tsx
│   │   ├── 📂 store
│   │   │   └── use-app.store.tsx
│   │   ├── 📂 api
│   │   │   └── fetch-data.tsx
│   │   ├── 📂 constants
│   │   │   └── api-constants.tsx
│   │   ├── 📂 models
│   │   │   └── chat-models.tsx
│   │   ├── ChatApp.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── global.css
│   │   └── favicon.ico
├── 📂 public
├── 📂 server
├── .gitignore
├── package.json
├── README.md
└── yarn.lock
```

... in progress
