const LAUNCH_DATE = new Date("2026-06-24T00:00:00Z")
const BASE_COUPLES_COUNT = 127
const DAILY_GROWTH_PROBABILITY = 0.4

// Hash déterministe (pas d'aléa réel) : même jour -> même valeur, à chaque appel.
function dayHash(day: number): number {
  const x = Math.sin(day * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function getCouplesCount(now: Date): number {
  const daysSinceLaunch = Math.max(
    0,
    Math.floor((now.getTime() - LAUNCH_DATE.getTime()) / 86_400_000)
  )

  let count = BASE_COUPLES_COUNT
  for (let day = 1; day <= daysSinceLaunch; day++) {
    if (dayHash(day) < DAILY_GROWTH_PROBABILITY) count += 1
  }
  return count
}
