/**
 * Utilidad para estructura del cuadro eliminatorio (bracket).
 * Solo partidos con groupId === null (eliminatoria directa).
 */

export type BracketMatch = {
  id: string
  round: string
  positionInRound: number
  registration1Label: string | null
  registration2Label: string | null
  winnerLabel: string | null
  score: string | null
}

export type BracketRound = {
  round: string
  matches: BracketMatch[]
}

const ROUND_LABELS: Record<string, string> = {
  ROUND_1: 'Ronda 1',
  ROUND_2: 'Ronda 2',
  QUARTERFINAL: 'Cuartos',
  SEMIFINAL: 'Semifinales',
  FINAL: 'Final',
}

/**
 * Filtra partidos de eliminatoria directa (sin grupo) y agrupa por ronda.
 * Orden de rondas: por cantidad de partidos descendente (primera ronda = más partidos).
 */
export function getBracketRounds(
  matches: Array<BracketMatch & { groupId?: string | null }>
): BracketRound[] {
  const direct = matches.filter((m) => m.groupId == null) as BracketMatch[]
  if (direct.length === 0) return []

  const byRound = new Map<string, BracketMatch[]>()
  for (const m of direct) {
    const list = byRound.get(m.round) ?? []
    list.push(m)
    byRound.set(m.round, list)
  }

  for (const list of byRound.values()) {
    list.sort((a, b) => a.positionInRound - b.positionInRound)
  }

  const rounds = Array.from(byRound.entries()).map(([round, matches]) => ({
    round,
    matches,
  }))

  rounds.sort((a, b) => b.matches.length - a.matches.length)
  return rounds
}

export function getRoundLabel(round: string): string {
  return ROUND_LABELS[round] ?? round.replace(/_/g, ' ')
}
