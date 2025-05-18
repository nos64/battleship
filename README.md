# Websocket battleship server

## Description

 WebSocket-based server for the classic Battleship game, built with TypeScript and Node.js.

## Getting Started

Player interface for my battleship backend is [here](https://github.com/rolling-scopes-school/websockets-ui). You should clone or copy this repository nd follow the instructions in README.md.

### Prerequisites

- Node.js (version 22.14.0 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:

```
git clone https://github.com/nos64/battleship.git

cd battleship
```

2. Install the dependencies:

```
npm install
```

### Running the Application

#### For development (hot-reload with ts-node-dev):

```
npm run dev
```

#### For production:

```
npm start
```

#### Compile TypeScript to dist/
```
npm run build
```

### Code Quality

#### To lint the code, run:

```
npm run lint
```

#### Connecting to the Server:

The server runs on `ws://localhost:3000` by default (or the port specified in .env).