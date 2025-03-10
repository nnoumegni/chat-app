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


## Architecture Decisions
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
