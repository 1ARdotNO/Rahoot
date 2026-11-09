import { Player } from "@rahoot/common/types/game"

type Vars = {
  name: string
  other: string
  n: number
  rank: number
  gap: number
}

type Template = (_v: Vars) => string

const places = (n: number) => `${n} ${n === 1 ? "place" : "places"}`
const ordinal = (n: number) => {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"

  return `${n}${suffix}`
}

const TEMPLATES = {
  newLeader: [
    (v) => `👑 ${v.name} storms the throne! ${v.other} has been politely asked to leave.`,
    (v) => `🚨 Breaking news: ${v.name} is the new number one. ${v.other} is "fine", apparently.`,
    (v) => `${v.name} just snatched first place from ${v.other}. Rude. Impressive, but rude.`,
    (v) => `📉📈 Plot twist! ${v.name} takes the lead and ${v.other} is checking the replay.`,
    (v) => `The crown has moved! ${v.name} wears it now. ${v.other}, it suited you briefly.`,
    (v) => `${v.name} has entered the chat… at the very top. Sorry ${v.other}!`,
    (v) => `New sheriff in town: ${v.name}. ${v.other} has been demoted to deputy.`,
    (v) => `${v.other} blinked, and ${v.name} took first place. Never blink.`,
    (v) => `🎉 ${v.name} climbs to the summit! ${v.other} is going to need a moment.`,
    (v) => `Is that ${v.name} in first? It is! ${v.other}'s reign is over.`,
  ],
  leaderHolds: [
    (v) => `${v.name} has been first for ${v.n} rounds. Someone, anyone, please do something.`,
    (v) => `👑 ${v.name} is still on top. ${v.n} rounds and counting. Getting comfy up there?`,
    (v) => `${v.name} is defending first place like it's the last slice of pizza 🍕`,
    (v) => `Round ${v.n} in a row with ${v.name} on top. The others are taking notes.`,
    (v) => `${v.name} remains undefeated. Is this a quiz or a one-person show?`,
    (v) => `Same leader, different round. ${v.name} is making this look easy.`,
    (v) => `${v.name}: still first. Still smug. Probably.`,
    (v) => `Nobody can catch ${v.name}! ${v.n} rounds at the top 🏃💨`,
  ],
  bigClimb: [
    (v) => `🚀 ${v.name} rockets up ${places(v.n)}! Was that a cheat code?`,
    (v) => `${v.name} climbed ${places(v.n)} to ${ordinal(v.rank)}. Someone's been studying!`,
    (v) => `Look out! ${v.name} just leapfrogged ${places(v.n)} 🐸`,
    (v) => `${v.name} woke up and chose violence: up ${places(v.n)}!`,
    (v) => `📈 ${v.name}'s stock is soaring. Up ${places(v.n)} to ${ordinal(v.rank)}!`,
    (v) => `${v.name} is on the move! ${places(v.n)} higher and not slowing down.`,
    (v) => `Elevator going up! 🛗 ${v.name} rides ${places(v.n)} to ${ordinal(v.rank)}.`,
    (v) => `${v.name} said "excuse me" and passed ${v.n} people at once.`,
    (v) => `Comeback alert! ${v.name} jumps ${places(v.n)} 🔥`,
    (v) => `${v.name} has unlocked turbo mode: +${places(v.n)}!`,
  ],
  bigFall: [
    (v) => `📉 ${v.name} slides down ${places(v.n)}. The floor is lava, ${v.name}!`,
    (v) => `${v.name} dropped ${places(v.n)}. Don't worry, it's a "strategic retreat".`,
    (v) => `Oof. ${v.name} tumbles to ${ordinal(v.rank)}. Shake it off!`,
    (v) => `${v.name} took the stairs down… ${places(v.n)} of them 🪜`,
    (v) => `Gravity wins this round: ${v.name} falls ${places(v.n)}.`,
    (v) => `${v.name} is just lulling everyone into a false sense of security. Down ${places(v.n)}.`,
    (v) => `${v.name} lost ${places(v.n)}, but not their dignity. Probably.`,
    (v) => `Houston, ${v.name} has a problem: down ${places(v.n)} 🛰️`,
    (v) => `${v.name} goes from hero to ${ordinal(v.rank)}. Redemption arc incoming?`,
  ],
  tie: [
    (v) => `🤝 ${v.name} and ${v.other} are dead even! Awkward…`,
    (v) => `It's a TIE at the top between ${v.name} and ${v.other}. Breathe, everyone.`,
    (v) => `${v.name} and ${v.other}: same points, different levels of panic.`,
    (v) => `Exactly level! ${v.name} vs ${v.other}. Next question decides everything.`,
    (v) => `Twinning! ${v.name} and ${v.other} share first place 👯`,
  ],
  closeRace: [
    (v) => `Only ${v.gap} points between ${v.name} and ${v.other}. You could cut the tension with a spoon 🥄`,
    (v) => `${v.other} is breathing down ${v.name}'s neck. Just ${v.gap} points in it!`,
    (v) => `${v.gap} points! That's it! ${v.name}, check your mirrors 👀`,
    (v) => `Photo finish incoming: ${v.name} leads ${v.other} by a measly ${v.gap}.`,
    (v) => `${v.name} vs ${v.other}, separated by ${v.gap} points. Grab the popcorn 🍿`,
    (v) => `${v.other} is ${v.gap} points from glory. ${v.name} is sweating.`,
  ],
  runaway: [
    (v) => `${v.name} is ${v.gap} points ahead. Is anyone else playing? 😅`,
    (v) => `${v.name} has left the building with a ${v.gap}-point lead. Send a search party!`,
    (v) => `A ${v.gap}-point lead for ${v.name}. The rest of you: it's not over… right?`,
    (v) => `${v.name} is so far ahead they can see next week's quiz.`,
    (v) => `${v.gap} points clear. ${v.name} could take a nap and still lead 😴`,
  ],
  hotStreak: [
    (v) => `🔥 ${v.name} is on a ${v.n}-answer streak! Someone get a fire extinguisher!`,
    (v) => `${v.name} has nailed ${v.n} in a row. Are they reading our minds? 🧠`,
    (v) => `${v.n} correct in a row for ${v.name}. Unstoppable!`,
    (v) => `${v.name}'s streak: ${v.n}. Everyone else's streak: questionable.`,
    (v) => `Hot hands! ${v.name} keeps scoring: ${v.n} straight 🔥🔥`,
    (v) => `${v.name} hasn't missed in ${v.n} questions. Suspicious. Brilliant, but suspicious.`,
  ],
  roundMvp: [
    (v) => `Round MVP: ${v.name}, with ${v.gap} points in one go 💪`,
    (v) => `${v.name} scooped up ${v.gap} points that round. Greedy! Respect.`,
    (v) => `Biggest haul of the round: ${v.name} (+${v.gap}) 💰`,
    (v) => `${v.name} was fastest on the buzzer: +${v.gap} points ⚡`,
    (v) => `+${v.gap} for ${v.name}! Somebody had their cereal this morning 🥣`,
  ],
  bottomHolds: [
    (v) => `${v.name} is holding the rest of the leaderboard up. Somebody has to 💪`,
    (v) => `${v.name} is in last, but the best comebacks start at the bottom.`,
    (v) => `${v.name} is playing the long game. A very, very long game.`,
    (v) => `Don't count ${v.name} out. Every legend needs an origin story.`,
    (v) => `${v.name} is just warming up. Probably. Hopefully.`,
  ],
  nobodyScored: [
    () => `Nobody scored that round. The question wins! 🏆❓`,
    () => `Zero points all round. Was the question in another language?`,
    () => `That question just defeated the entire room 💀`,
    () => `Not a single point. Impressive teamwork, everyone 👏`,
  ],
  firstLeader: [
    (v) => `${v.name} takes the very first lead! Early bird gets the worm 🐦`,
    (v) => `First blood to ${v.name}! It's going to be a long day for the rest of you.`,
    (v) => `${v.name} is off to a flying start 🛫`,
    (v) => `${v.name} leads after round one. Don't get too comfortable!`,
    (v) => `And we're off! ${v.name} grabs first place right away.`,
  ],
} satisfies Record<string, Template[]>

type EventKind = keyof typeof TEMPLATES

type Candidate = {
  kind: EventKind
  weight: number
  playerId?: string
  vars: Partial<Vars>
}

const MAX_LINES = 2
const SECOND_LINE_MIN_WEIGHT = 40
const CLOSE_RACE_GAP = 150
const RUNAWAY_GAP = 2000
const MIN_BIG_MOVE = 2
const MIN_HOT_STREAK = 3

// Remembers which variants were used per game so lines don't repeat until a kind runs dry.
class Commentator {
  private used = new Map<EventKind, Set<number>>()

  private leaderId: string | null = null

  private leaderRounds = 0

  private rounds = 0

  private pick(kind: EventKind, vars: Vars) {
    const templates: Template[] = TEMPLATES[kind]
    const used = this.used.get(kind) ?? new Set<number>()

    if (used.size >= templates.length) {
      used.clear()
    }

    const available = templates
      .map((_, index) => index)
      .filter((index) => !used.has(index))
    const index = available[Math.floor(Math.random() * available.length)]

    used.add(index)
    this.used.set(kind, used)

    return templates[index](vars)
  }

  private candidates(before: Player[], after: Player[]): Candidate[] {
    const list: Candidate[] = []
    const [leader, second] = after
    const firstRound = this.rounds === 1
    const gained = (p: Player) =>
      p.points - (before.find((b) => b.id === p.id)?.points ?? 0)
    const gains = after.map((p) => ({ player: p, gain: gained(p) }))

    if (gains.every(({ gain }) => gain === 0)) {
      return [{ kind: "nobodyScored", weight: 100, vars: {} }]
    }

    if (firstRound) {
      list.push({ kind: "firstLeader", weight: 100, playerId: leader.id, vars: { name: leader.username } })
    } else if (before[0] && before[0].id !== leader.id) {
      list.push({
        kind: "newLeader",
        weight: 100,
        playerId: leader.id,
        vars: { name: leader.username, other: before[0].username },
      })
    } else if (this.leaderRounds >= 2) {
      list.push({ kind: "leaderHolds", weight: 40, playerId: leader.id, vars: { name: leader.username, n: this.leaderRounds } })
    }

    if (second) {
      const gap = leader.points - second.points
      const pair = { name: leader.username, other: second.username, gap }

      if (gap === 0) {
        list.push({ kind: "tie", weight: 85, vars: pair })
      } else if (gap <= CLOSE_RACE_GAP) {
        list.push({ kind: "closeRace", weight: 60, vars: pair })
      } else if (gap >= RUNAWAY_GAP) {
        list.push({ kind: "runaway", weight: 45, playerId: leader.id, vars: pair })
      }
    }

    // Join order isn't a ranking, so rank movement only means something from round two.
    if (!firstRound) {
      const moves = after
        .map((p, index) => {
          const oldIndex = before.findIndex((b) => b.id === p.id)

          return { player: p, rank: index + 1, delta: oldIndex < 0 ? 0 : oldIndex - index }
        })
        .sort((a, b) => b.delta - a.delta)
      const [climb] = moves
      const fall = moves[moves.length - 1]

      if (climb && climb.delta >= MIN_BIG_MOVE) {
        list.push({
          kind: "bigClimb",
          weight: 75 + climb.delta * 5,
          playerId: climb.player.id,
          vars: { name: climb.player.username, n: climb.delta, rank: climb.rank },
        })
      }

      if (fall && fall.delta <= -MIN_BIG_MOVE) {
        list.push({
          kind: "bigFall",
          weight: 65 - fall.delta * 5,
          playerId: fall.player.id,
          vars: { name: fall.player.username, n: -fall.delta, rank: fall.rank },
        })
      }

      const last = after[after.length - 1]

      if (after.length >= 3 && before[before.length - 1]?.id === last.id) {
        list.push({ kind: "bottomHolds", weight: 15, playerId: last.id, vars: { name: last.username } })
      }
    }

    const [streaker] = [...after].sort((a, b) => b.streak - a.streak)

    if (streaker && streaker.streak >= MIN_HOT_STREAK) {
      list.push({
        kind: "hotStreak",
        weight: 50 + streaker.streak * 2,
        playerId: streaker.id,
        vars: { name: streaker.username, n: streaker.streak },
      })
    }

    const [mvp] = [...gains].sort((a, b) => b.gain - a.gain)

    if (mvp.gain > 0 && mvp.player.id !== leader.id) {
      list.push({ kind: "roundMvp", weight: 30, playerId: mvp.player.id, vars: { name: mvp.player.username, gap: mvp.gain } })
    }

    return list
  }

  // `before`/`after` are full rankings (best first) around the round just scored.
  comment(before: Player[], after: Player[]): string[] {
    if (after.length === 0) {
      return []
    }

    this.rounds += 1

    if (after[0].id === this.leaderId) {
      this.leaderRounds += 1
    } else {
      this.leaderId = after[0].id
      this.leaderRounds = 1
    }

    // Jitter keeps similar-weight events from always resolving the same way.
    const ranked = this.candidates(before, after)
      .map((c) => ({ ...c, score: c.weight + Math.random() * 20 }))
      .sort((a, b) => b.score - a.score)

    const chosen: Candidate[] = []

    for (const candidate of ranked) {
      const duplicatePlayer =
        candidate.playerId &&
        chosen.some((c) => c.playerId === candidate.playerId)

      if (
        chosen.length < MAX_LINES &&
        !duplicatePlayer &&
        (chosen.length === 0 || candidate.weight >= SECOND_LINE_MIN_WEIGHT)
      ) {
        chosen.push(candidate)
      }
    }

    return chosen.map((c) =>
      this.pick(c.kind, { name: "", other: "", n: 0, rank: 0, gap: 0, ...c.vars }),
    )
  }
}

export default Commentator
