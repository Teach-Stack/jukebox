# jukebox

## Overview

Jukebox is a local-first collaborative music player designed for classrooms. It allows students to queue songs and vote on their favorites, creating a dynamic and engaging musical experience. Powered by a peer-to-peer communication protocol, Jukebox ensures that all participants can contribute to the playlist without relying on a central server.

## Technology Stack
- Frontend: Svelte
- State Management: signaldb
- Communication Protocol: Peer-to-peer (P2P)
- Styling: `@teach-stack/css`
- Code Quality: Biome

## Project Structure
```
src/
├── lib/
│   ├── components/      # Reusable Svelte components
│   ├── db/              # SignalDB collections and state management logic
│   │   ├── collections/         # SignalDB collection definitions
│   │   └── helper.svelte.ts     # Helper functions for working with SignalDB
│   ├── p2p/             # peer-to-peer communication logic
│   │   ├── host.svelte.ts       # Host logic for managing client connections
│   │   └── client.svelte.ts     # Client logic for connecting to host
│   └── helpers/         # Utility functions and helper methods
├── routes/              # SvelteKit routes
├── styles/              # Global styles and design system
├── app.d.ts             # TypeScript declaration file for the application
└── app.html             # HTML template for the application
```


## Development Guidelines

### Local-First Approach
Jukebox is built with a local-first approach, meaning that all data is stored and managed locally on each participant's device. This allows for seamless collaboration without the need for an internet connection or central server.

- Ensure that all communication between participants is handled through the peer-to-peer protocol.

### State Management
Use signaldb for managing the application state. This allows for synchronization of the playlist and voting data across all participants.

- State is only hosted on the host's device, while participants can read and update the state through the peer-to-peer protocol.
- Keep the state structure simple and organized to facilitate easy updates and synchronization.
- Utilize signaldb's Collection class when making state
- SignalDB is integrated with indexedDB for persistent storage 
- Utilize svelte reactivity adapter from signaldb for integration with Svelte components.

### User Interface
- Prioritize HTML native elements and features to ensure accessibility and performance. 
- Do not write any custom CSS, instead utilize the design system and utility classes provided by `@teach-stack/css`.
- Most elements do not need explicit class names, the design system styles elements directly. Only use existing class names when necessary for layout or specific styling needs.
- Do not write any inline styles

### Music Search and Playback
Music search and playback will utilize the YouTube API. Ensure that the integration is seamless and provides a smooth user experience.

Playback is only played on the host's device, while all participants can contribute to the playlist and vote on songs.

### Git Workflow
Before writing code ensure git repo is clean and up to date.