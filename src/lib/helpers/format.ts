export function formatDuration(seconds: number): string {
  if (seconds === 0 || Number.isNaN(seconds)) {
    return 'Unknown'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}
