export const STAT_KEYS = ['hp', 'mind', 'hygiene', 'money'] as const
export type StatKey = (typeof STAT_KEYS)[number]
export type Stats = Record<StatKey, number>

export const STAT_MAX = 10

export const STAT_NAMES: Record<StatKey, string> = {
  hp: '체력',
  mind: '정신력',
  hygiene: '위생',
  money: '돈',
}

// 수치 구간(0-2, 3-5, 6-7, 8-10)별 상태 표기
const STAT_LABELS: Record<StatKey, [string, string, string, string]> = {
  hp: ['빈사', '지침', '건강함', '혈기왕성'],
  mind: ['붕괴 직전', '흔들림', '안정', '의지 충만'],
  hygiene: ['불결함', '꾀죄죄함', '비교적 청결', '청결함'],
  money: ['빈곤함', '넉넉지 않음', '넉넉함', '부유함'],
}

export interface Item {
  name: string
  desc: string
}

export type Block =
  | { kind: 'narration'; text: string; note?: string }
  | { kind: 'line'; speaker: string; tag?: string; text: string }

export interface Effects {
  stats?: Partial<Stats>
  /** 판정 보정치 변화량 (예: 공포 -1) */
  modifier?: number
  flags?: string[]
  /** 획득 아이템 id (story.ts의 items 키) */
  items?: string[]
}

export interface Choice {
  text: string
  /** [용감함] 같은 성향 태그. 있으면 강조 스타일로 표시 */
  trait?: string
  /** 판정 목표치. 2d6 + 보정치가 이 값 이상이면 성공. 없으면 판정 없이 진행 */
  target?: number
  next: string
  /** 판정 실패 시 이동할 장면. 없으면 next */
  failNext?: string
  /** 모두 보유해야 노출 (플래그 또는 아이템 id) */
  requires?: string[]
  /** 하나라도 보유하면 숨김 (플래그 또는 아이템 id) */
  excludes?: string[]
  /** of 중 count개 이상 보유해야 노출 (예: 백성 인카운터 2회 이상 성공) */
  minOf?: { of: string[]; count: number }
  /** 판정 성공(또는 판정 없음) 시 적용 */
  effects?: Effects
}

export interface Scene {
  id: string
  /** main.ts의 이미지 매핑 키 */
  image?: string
  blocks: Block[]
  /** 장면 진입 시 적용 */
  effects?: Effects
  choices: Choice[]
  /** 엔딩 이름. 있으면 엔딩 장면 */
  ending?: string
}

export interface GameState {
  sceneId: string
  stats: Stats
  modifier: number
  flags: string[]
  /** 보유 아이템 id. 획득 순서대로 */
  items: string[]
  /** 성공한 판정 수 (진 엔딩 조건 등에 사용) */
  successes: number
  /** 마지막으로 변한 상태치. 하단 바에서 강조 */
  lastStat: StatKey
}

export interface CheckResult {
  dice: [number, number]
  modifier: number
  total: number
  target: number
  success: boolean
}

const clamp = (v: number) => Math.min(STAT_MAX, Math.max(0, v))

export function statLabel(key: StatKey, value: number): string {
  const i = value <= 2 ? 0 : value <= 5 ? 1 : value <= 7 ? 2 : 3
  return STAT_LABELS[key][i]
}

function applyEffects(state: GameState, effects: Effects | undefined): GameState {
  if (!effects) return state
  const stats = { ...state.stats }
  let lastStat = state.lastStat
  for (const key of STAT_KEYS) {
    const delta = effects.stats?.[key]
    if (delta) {
      stats[key] = clamp(stats[key] + delta)
      lastStat = key
    }
  }
  const flags = [...new Set([...state.flags, ...(effects.flags ?? [])])]
  const items = [...new Set([...state.items, ...(effects.items ?? [])])]
  return { ...state, stats, flags, items, lastStat, modifier: state.modifier + (effects.modifier ?? 0) }
}

function enter(state: GameState, scenes: Record<string, Scene>, sceneId: string): GameState {
  const scene = scenes[sceneId]
  if (!scene) throw new Error(`존재하지 않는 장면입니다: ${sceneId}`)
  return applyEffects({ ...state, sceneId }, scene.effects)
}

export function newGame(
  scenes: Record<string, Scene>,
  startId: string,
  stats: Stats,
  items: string[] = [],
): GameState {
  return enter({ sceneId: startId, stats, modifier: 0, flags: [], items, successes: 0, lastStat: 'hp' }, scenes, startId)
}

export function visibleChoices(scene: Scene, state: GameState): Choice[] {
  const has = (f: string) => state.flags.includes(f) || state.items.includes(f)
  return scene.choices.filter(
    c =>
      (c.requires ?? []).every(has) &&
      !(c.excludes ?? []).some(has) &&
      (!c.minOf || c.minOf.of.filter(has).length >= c.minOf.count),
  )
}

const d6 = (rng: () => number) => 1 + Math.floor(rng() * 6)

export function choose(
  state: GameState,
  choice: Choice,
  scenes: Record<string, Scene>,
  rng: () => number = Math.random,
): { state: GameState; check?: CheckResult } {
  if (choice.target === undefined) {
    return { state: enter(applyEffects(state, choice.effects), scenes, choice.next) }
  }
  const dice: [number, number] = [d6(rng), d6(rng)]
  const total = dice[0] + dice[1] + state.modifier
  const success = total >= choice.target
  const check = { dice, modifier: state.modifier, total, target: choice.target, success }
  const after = success
    ? applyEffects({ ...state, successes: state.successes + 1 }, choice.effects)
    : state
  return { state: enter(after, scenes, success ? choice.next : (choice.failNext ?? choice.next)), check }
}
