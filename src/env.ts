import { defineEnvVars } from '@sveltejs/kit/env'

// Functions returning the value as-is make each variable optional
export const variables = defineEnvVars({
  PUBLIC_YOUTUBE_API_KEY: {
    public: true,
    static: true,
    schema: (value) => value,
  },
  TURN_KEY_ID: {
    schema: (value) => value,
  },
  TURN_KEY_API_TOKEN: {
    schema: (value) => value,
  },
})
