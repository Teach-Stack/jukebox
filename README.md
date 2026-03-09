# Jukebox

A local-first collaborative music player for classrooms. Students can queue songs and vote on their favorites.

## Features

- Real-time collaborative playlist
- Peer-to-peer communication (no central server required)
- Song search powered by YouTube
- Upvote/downvote system for song priority
- Host controls for managing participants
- QR code for easy room joining

## Technology Stack

- **Frontend**: SvelteKit + Svelte 5
- **State Management**: SignalDB with IndexedDB persistence
- **P2P Communication**: PeerJS
- **Music**: YouTube IFrame Player API + YouTube Data API v3
- **Styling**: @teach-stack/css
- **Code Quality**: Biome

## License

AGPL-3.0-only
