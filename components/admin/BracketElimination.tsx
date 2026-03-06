"use client"

import { useMemo, Fragment } from "react"
import { cn } from "@/lib/utils"
import {
  getBracketRounds,
  getRoundLabel,
  type BracketMatch,
  type BracketRound,
} from "@/lib/tournament-bracket"

export type BracketEliminationProps = {
  matches: Array<BracketMatch & { groupId?: string | null }>
  roundLabels?: Record<string, string>
}

function MatchCell({
  match,
  roundLabel,
}: {
  match: BracketMatch
  roundLabel: string
}) {
  const p1 = match.registration1Label ?? "Bye"
  const p2 = match.registration2Label ?? "Bye"
  const winner = match.winnerLabel
  const score = match.score
  const ariaLabel = `Partido: ${p1} contra ${p2}${score ? `, resultado ${score}` : ""}${winner ? `, ganador ${winner}` : ""}`

  return (
    <div
      role="article"
      aria-label={ariaLabel}
      className={cn(
        "rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm",
        "min-w-[140px]"
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {roundLabel} · Partido {match.positionInRound + 1}
      </p>
      <div className="space-y-1">
        <p
          className={cn(
            "truncate font-medium",
            winner && p1 === winner && "text-green-600 dark:text-green-400 font-bold"
          )}
          title={p1}
        >
          {p1}
        </p>
        <p className="text-muted-foreground text-xs">vs</p>
        <p
          className={cn(
            "truncate font-medium",
            winner && p2 === winner && "text-green-600 dark:text-green-400 font-bold"
          )}
          title={p2}
        >
          {p2}
        </p>
      </div>
      {score && (
        <p className="text-muted-foreground text-xs mt-1.5 pt-1 border-t border-border/50">
          {score}
        </p>
      )}
      {winner && (
        <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold mt-1">
          Ganador: {winner}
        </p>
      )}
    </div>
  )
}

function ConnectorSvg({
  fromRoundCount,
  toRoundCount,
  className,
}: {
  fromRoundCount: number
  toRoundCount: number
  className?: string
}) {
  const totalRows = fromRoundCount * 2
  const paths: string[] = []
  for (let p = 0; p < toRoundCount; p++) {
    const half = fromRoundCount / toRoundCount
    const top = (p * half * 2) / totalRows
    const bottom = ((p + 1) * half * 2) / totalRows
    const mid = (top + bottom) / 2
    const topPct = top * 100
    const bottomPct = bottom * 100
    const midPct = mid * 100
    paths.push(
      `M 0 ${topPct} L 40 ${topPct} L 40 ${midPct} L 100 ${midPct}`,
      `M 40 ${midPct} L 40 ${bottomPct} L 0 ${bottomPct}`
    )
  }

  return (
    <svg
      className={cn("w-10 flex-shrink-0", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border"
        />
      ))}
    </svg>
  )
}

export function BracketElimination({ matches, roundLabels }: BracketEliminationProps) {
  const rounds = useMemo(() => getBracketRounds(matches), [matches])

  if (rounds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No hay partidos para mostrar.
      </p>
    )
  }

  const firstRoundCount = rounds[0].matches.length
  const totalRows = firstRoundCount * 2

  const getGridRow = (roundIndex: number, positionInRound: number) => {
    const span = Math.pow(2, roundIndex)
    const startRow0 = positionInRound * Math.pow(2, roundIndex + 1) + Math.pow(2, roundIndex) - 1
    return `${startRow0 + 1} / span ${span}`
  }

  const getRoundDisplayLabel = (round: string) =>
    roundLabels?.[round] ?? getRoundLabel(round)

  return (
    <div
      role="region"
      aria-label="Cuadro eliminatorio del torneo"
      className="overflow-x-auto"
    >
      <div
        className="inline-flex items-stretch gap-0 min-w-[800px] py-4"
        style={{
          minHeight: totalRows * 48,
        }}
      >
        {rounds.map((bracketRound, roundIndex) => (
          <Fragment key={bracketRound.round}>
            <div className="flex flex-col items-stretch gap-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-1">
                {getRoundDisplayLabel(bracketRound.round)}
              </h3>
              <div
                className="grid pr-2"
                style={{
                  gridTemplateRows: `repeat(${totalRows}, 1fr)`,
                  gridTemplateColumns: "1fr",
                  minHeight: totalRows * 48,
                }}
              >
                {bracketRound.matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center"
                    style={{
                      gridRow: getGridRow(roundIndex, match.positionInRound),
                    }}
                  >
                    <MatchCell
                      match={match}
                      roundLabel={getRoundDisplayLabel(bracketRound.round)}
                    />
                  </div>
                ))}
              </div>
            </div>
            {roundIndex < rounds.length - 1 && (
              <ConnectorSvg
                fromRoundCount={bracketRound.matches.length}
                toRoundCount={rounds[roundIndex + 1].matches.length}
                className="self-stretch mt-8"
              />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
