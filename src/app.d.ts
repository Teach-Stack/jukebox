// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import 'unplugin-icons/types/svelte'

/// <reference types="@types/youtube" />

declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  declare type ClassProperties<C> = {
    // biome-ignore lint/complexity/noBannedTypes: just need to exclude functions
    [K in keyof C as C[K] extends Function ? never : K]: C[K]
  }

  interface Window {
    onYouTubeIframeAPIReady?: () => void
    YT?: typeof YT & { loaded?: number }
  }
}
