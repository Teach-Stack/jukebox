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

## Native Host App

`src-tauri/` wraps the hosted site in a Tauri window. Instead of the YouTube iframe, the host downloads each song's audio with [rustypipe](https://codeberg.org/ThetaDev/rustypipe) and plays it locally, so embed-disabled videos play and songs autoplay. Students still join from a normal browser.

```sh
pnpm tauri dev    # run
pnpm tauri build  # installer for the current OS
```

Requires Rust and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/). Audio is cached in the app cache directory.

## License

AGPL-3.0-only
