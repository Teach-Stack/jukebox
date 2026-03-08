const STORAGE_KEY = 'jukebox:votes'

type VoteValue = 'up' | 'down'
type VotesStore = Record<string, VoteValue>

export function saveVote(songId: string, value: VoteValue): void {
  const votes = getAllVotes()
  votes[songId] = value
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
}

export function getVote(songId: string): VoteValue | null {
  const votes = getAllVotes()
  return votes[songId] ?? null
}

export function getAllVotes(): VotesStore {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return {}
    return JSON.parse(data) as VotesStore
  } catch {
    return {}
  }
}

export function clearVotes(): void {
  localStorage.removeItem(STORAGE_KEY)
}
