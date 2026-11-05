export const STAT_KEYS = ['hp', 'mind', 'hygiene', 'money'] as const
export type StatKey = (typeof STAT_KEYS)[number]
export type Stats = Record<StatKey, number>

export const STAT_MAX = 100

export const STAT_NAMES: Record<StatKey, string> = {
  hp: '체력',
  mind: '정신력',
  hygiene: '위생',
  money: '돈',
}

const STAT_LABELS: Record<StatKey, [string, string, string, string]> = {
  hp: ['빈사', '지침', '건강함', '혈기왕성'],
  mind: ['붕괴 직전', '흔들림', '안정', '의지 충만'],
  hygiene: ['불결함', '꾀죄죄함', '비교적 청결', '청결함'],
  money: ['빈곤함', '넉넉지 않음', '넉넉함', '부유함'],
}

// 구간 상한. 체력·정신력·위생은 0~100(0-20, 21-40, 41-70, 71-100), 돈은 닢 수(0-2, 3-5, 6-9, 10 이상)
const TIER_LIMITS: Record<StatKey, [number, number, number]> = {
  hp: [20, 40, 70],
  mind: [20, 40, 70],
  hygiene: [20, 40, 70],
  money: [2, 5, 9],
}

// 구간별 판정 보정치. 판정에 쓰이는 상태치의 구간에 따라 붙는다
const STAT_BONUS = [-3, -1, 1, 3]

/** 기술 숙련 보정치. 직업으로 얻은 기술(skill:이름 플래그)로 판정하면 붙는다 */
export const SKILL_BONUS = 5

/** 전투 공격 판정에 숙련 보정이 붙는 기술 */
export const COMBAT_SKILL = '운동'

/** 적의 공격 판정 목표치. d20 + 적 attack이 이 값 이상이면 맞는다 */
const ENEMY_HIT = 12

export const tier = (key: StatKey, value: number) => TIER_LIMITS[key].filter(limit => value > limit).length

export interface Item {
  name: string
  desc: string
  /** 전투 공격 판정 보정 */
  attack?: number
  /** 적의 공격을 막을 확률(0~1). 막으면 penalty가 이번 전투 동안 공격 판정에 붙고, 못 막으면 breaks일 때 부서진다 */
  block?: { chance: number; penalty?: ModPart; breaks?: boolean }
  /** 전투에서 소모해 이번 턴 적의 공격을 막는 아이템의 선택지 문구 */
  blind?: string
}

/** 판정 보정치 한 항목. 결과 화면에 출처별로 표시한다 */
export interface ModPart {
  label: string
  value: number
}

export type Block =
  | { kind: 'narration'; text: string; note?: string }
  | { kind: 'line'; speaker: string; tag?: string; text: string }

export interface Effects {
  stats?: Partial<Stats>
  /** 이름별 판정 보정치 변화량 (예: { '악몽 난이도': -2 }). 같은 이름끼리 합산되고 0이 되면 사라진다 */
  mods?: Record<string, number>
  flags?: string[]
  /** 획득 아이템 id (story.ts의 items 키) */
  items?: string[]
  /** pool 중 아직 없는 아이템 하나를 무작위로 얻는다. hidden이면 품속(pocket)에 두었다가 reveal로 드러낸다 */
  randomItem?: { pool: string[]; hidden?: boolean }
  /** 품속에 숨긴 아이템을 소지품으로 옮긴다 */
  reveal?: boolean
  /** 소지품과 품속 아이템을 모두 잃는다 */
  loseItems?: boolean
}

export interface Choice {
  text: string
  /** [용감함] 같은 성향 태그. 있으면 강조 스타일로 표시 */
  trait?: string
  /** 판정 기술 (화술, 조사 등). 숙련이 있으면 SKILL_BONUS가 붙는다 */
  skill?: string
  /** 판정 난이도. d20 + 보정치가 이 값 이상이면 성공. target·odds 둘 다 없으면 판정 없이 진행 */
  target?: number
  /** 판정에 상태치 구간 보정을 붙일 상태치 */
  stat?: StatKey
  /** 확률 판정: 성공 확률 = (상태치 + plus)%. 다른 보정치는 붙지 않는다 */
  odds?: { stat: StatKey; plus?: number }
  next: string
  /** 판정 실패 시 이동할 장면. 없으면 next */
  failNext?: string
  /** 모두 보유해야 노출 (플래그 또는 아이템 id) */
  requires?: string[]
  /** 하나라도 보유하면 숨김 (플래그 또는 아이템 id) */
  excludes?: string[]
  /** of 중 count개 이상 보유해야 노출 (예: 백성 인카운터 2회 이상 성공) */
  minOf?: { of: string[]; count: number }
  /** 상태치가 min 이상 max 이하일 때만 노출 */
  when?: { stat: StatKey; min?: number; max?: number }
  /** 무작위 노출 묶음 이름. 장면의 pick에 정한 개수만큼만 보인다 */
  group?: string
  /** 전투 행동. 전투 장면에서 엔진이 만든다 */
  action?: 'attack' | 'use'
  /** action이 use일 때 소모하는 아이템 id */
  item?: string
  /** 판정 성공(또는 판정 없음) 시 적용 */
  effects?: Effects
}

export interface Enemy {
  name: string
  /** 쓰러뜨리는 데 필요한 공격 적중 횟수 */
  hp: number
  /** 플레이어 공격 판정 목표치 */
  defense: number
  /** 적 공격 판정 보정치 */
  attack: number
  /** 적 공격이 맞았을 때 줄어드는 체력 */
  damage: number
}

export interface Combat {
  enemy: Enemy
  /** 이 턴 수가 끝날 때까지 이기지 못하면 timeout 장면으로 간다 */
  turns?: number
  win: string
  /** 체력이 0이 되면 가는 장면 */
  lose: string
  timeout?: string
}

export interface Scene {
  id: string
  /** 삽화 파일 이름 (assets/art/이름.jpg). 없으면 장면 id */
  image?: string
  /** 대화 장면: 삽화 대신 상대 초상화(assets/art/portrait-이름.jpg)를 작게 보여준다 */
  portrait?: string
  blocks: Block[]
  /** 장면 진입 시 적용 */
  effects?: Effects
  choices: Choice[]
  /** 묶음(group)별 무작위 노출 개수 */
  pick?: Record<string, number>
  /** 있으면 전투 장면. 선택지는 엔진이 전투 행동으로 만든다 */
  combat?: Combat
  /** 엔딩 이름. 있으면 엔딩 장면 */
  ending?: string
}

export interface CombatState {
  /** 적의 남은 체력 */
  hp: number
  /** 현재 턴 (1부터) */
  turn: number
  /** 이번 전투 동안만 붙는 공격 보정 (방패로 막은 뒤 손 저림 등) */
  mods: Record<string, number>
  /** 직전 턴 결과 */
  log: string[]
}

export interface GameState {
  sceneId: string
  stats: Stats
  /** 이야기로 얻은 이름별 판정 보정치 (악몽 난이도 등) */
  mods: Record<string, number>
  flags: string[]
  /** 보유 아이템 id. 획득 순서대로 */
  items: string[]
  /** 아직 플레이어에게 드러나지 않은 아이템 id */
  pocket: string[]
  /** 성공한 판정 수 (진 엔딩 조건 등에 사용) */
  successes: number
  /** 마지막으로 변한 상태치. 하단 바에서 강조 */
  lastStat: StatKey
  /** 무작위 선택지 노출에 쓰는 시드. 같은 진행에서는 같은 선택지가 보인다 */
  seed: number
  combat?: CombatState
}

export interface CheckResult {
  /** d20 눈 */
  dice: number
  /** 보정치 출처별 내역 */
  parts: ModPart[]
  /** parts 합계 */
  modifier: number
  total: number
  target: number
  success: boolean
  /** 전투 공격 판정이면 true */
  attack?: boolean
}

const clamp = (v: number) => Math.min(STAT_MAX, Math.max(0, v))
const d20 = (rng: () => number) => 1 + Math.floor(rng() * 20)

/** 받침 유무에 따라 조사를 붙인다. josa('후추통', '을', '를') → '후추통을' */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return word + (code >= 0 && code < 11172 && code % 28 ? withFinal : withoutFinal)
}

export function statLabel(key: StatKey, value: number): string {
  return STAT_LABELS[key][tier(key, value)]
}

/** 확률 판정의 목표치. 성공 확률 p%면 d20에서 21 - p/5 이상이 나와야 한다 */
export const oddsTarget = (state: GameState, odds: NonNullable<Choice['odds']>) =>
  21 - Math.floor(clamp(state.stats[odds.stat] + (odds.plus ?? 0)) / 5)

function applyEffects(state: GameState, effects: Effects | undefined, rng: () => number): GameState {
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
  let items = [...new Set([...state.items, ...(effects.items ?? [])])]
  let pocket = state.pocket
  if (effects.randomItem) {
    const left = effects.randomItem.pool.filter(id => !items.includes(id) && !pocket.includes(id))
    if (left.length) {
      const got = left[Math.floor(rng() * left.length)]
      if (effects.randomItem.hidden) pocket = [...pocket, got]
      else items = [...items, got]
    }
  }
  if (effects.reveal) {
    items = [...items, ...pocket]
    pocket = []
  }
  if (effects.loseItems) {
    items = []
    pocket = []
  }
  const mods = { ...state.mods }
  for (const [label, delta] of Object.entries(effects.mods ?? {})) {
    mods[label] = (mods[label] ?? 0) + delta
    if (!mods[label]) delete mods[label]
  }
  return { ...state, stats, flags, items, pocket, mods, lastStat }
}

function statPart(state: GameState, key: StatKey): ModPart[] {
  const value = state.stats[key]
  const bonus = STAT_BONUS[tier(key, value)]
  return bonus ? [{ label: statLabel(key, value), value: bonus }] : []
}

const skillPart = (state: GameState, skill: string | undefined): ModPart[] =>
  skill && state.flags.includes(`skill:${skill}`) ? [{ label: `${skill} 숙련`, value: SKILL_BONUS }] : []

const modParts = (mods: Record<string, number>): ModPart[] => Object.entries(mods).map(([label, value]) => ({ label, value }))

function checkParts(state: GameState, choice: Choice): ModPart[] {
  return [
    ...skillPart(state, choice.skill),
    ...(choice.stat ? statPart(state, choice.stat) : []),
    ...modParts(state.mods),
  ]
}

function enter(state: GameState, scenes: Record<string, Scene>, sceneId: string, rng: () => number): GameState {
  const scene = scenes[sceneId]
  if (!scene) throw new Error(`존재하지 않는 장면입니다: ${sceneId}`)
  const next = applyEffects({ ...state, sceneId, combat: undefined }, scene.effects, rng)
  return scene.combat ? { ...next, combat: { hp: scene.combat.enemy.hp, turn: 1, mods: {}, log: [] } } : next
}

export function newGame(
  scenes: Record<string, Scene>,
  startId: string,
  stats: Stats,
  items: string[] = [],
  seed = Math.floor(Math.random() * 2 ** 31),
): GameState {
  const state: GameState = { sceneId: startId, stats, mods: {}, flags: [], items, pocket: [], successes: 0, lastStat: 'hp', seed }
  return enter(state, scenes, startId, Math.random)
}

// FNV-1a 32비트. 무작위 노출 순서를 시드로 고정하는 용도
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

function combatChoices(scene: Scene, state: GameState, catalog: Record<string, Item>): Choice[] {
  return [
    { text: '공격한다', action: 'attack', next: scene.id },
    ...state.items
      .filter(id => catalog[id]?.blind)
      .map((id): Choice => ({ text: catalog[id].blind!, action: 'use', item: id, next: scene.id })),
  ]
}

export function visibleChoices(scene: Scene, state: GameState, catalog: Record<string, Item> = {}): Choice[] {
  if (scene.combat) return combatChoices(scene, state, catalog)
  const has = (f: string) => state.flags.includes(f) || state.items.includes(f)
  const shown = scene.choices.filter(
    c =>
      (c.requires ?? []).every(has) &&
      !(c.excludes ?? []).some(has) &&
      (!c.minOf || c.minOf.of.filter(has).length >= c.minOf.count) &&
      (!c.when || (state.stats[c.when.stat] >= (c.when.min ?? 0) && state.stats[c.when.stat] <= (c.when.max ?? Infinity))),
  )
  if (!scene.pick) return shown
  const picked = new Set<Choice>()
  for (const [group, count] of Object.entries(scene.pick)) {
    shown
      .filter(c => c.group === group)
      .map(c => ({ c, order: hash(`${state.seed}:${scene.id}:${c.text}`) }))
      .sort((a, b) => a.order - b.order)
      .slice(0, count)
      .forEach(({ c }) => picked.add(c))
  }
  return shown.filter(c => !c.group || picked.has(c))
}

function roll(parts: ModPart[], target: number, rng: () => number): CheckResult {
  const dice = d20(rng)
  const modifier = parts.reduce((sum, p) => sum + p.value, 0)
  const total = dice + modifier
  return { dice, parts, modifier, total, target, success: total >= target }
}

// 한 턴: 플레이어 행동 → (적이 남았으면) 적 공격 → 체력·턴 제한 확인
function combatTurn(
  state: GameState,
  choice: Choice,
  scenes: Record<string, Scene>,
  rng: () => number,
  catalog: Record<string, Item>,
): { state: GameState; check?: CheckResult } {
  const { enemy, turns, win, lose, timeout } = scenes[state.sceneId].combat!
  const current = state.combat!
  const log: string[] = []
  let enemyHp = current.hp
  let items = state.items
  let mods = current.mods
  let check: CheckResult | undefined

  if (choice.action === 'attack') {
    const parts = [
      ...items.filter(id => catalog[id]?.attack).map(id => ({ label: catalog[id].name, value: catalog[id].attack! })),
      ...skillPart(state, COMBAT_SKILL),
      ...statPart(state, 'hp'),
      ...modParts(state.mods),
      ...modParts(mods),
    ]
    check = { ...roll(parts, enemy.defense, rng), attack: true }
    if (check.success) enemyHp--
    log.push(check.success ? `${enemy.name}에게 공격이 적중했습니다.` : '공격이 빗나갔습니다.')
  } else {
    items = items.filter(id => id !== choice.item)
    log.push(`${josa(catalog[choice.item!].name, '을', '를')} 사용했습니다. ${josa(enemy.name, '이', '가')} 이번 턴에 공격하지 못합니다.`)
  }
  if (enemyHp <= 0) return { state: enter({ ...state, items }, scenes, win, rng), check }

  const stats = { ...state.stats }
  let lastStat = state.lastStat
  if (choice.action === 'attack') {
    if (d20(rng) + enemy.attack < ENEMY_HIT) {
      log.push(`${enemy.name}의 공격을 피했습니다.`)
    } else {
      const shield = items.find(id => catalog[id]?.block)
      const block = shield ? catalog[shield].block! : undefined
      const blocked = block !== undefined && rng() < block.chance
      if (blocked) {
        log.push(`${josa(catalog[shield!].name, '으로', '로')} 공격을 막았습니다.`)
        if (block.penalty) mods = { ...mods, [block.penalty.label]: block.penalty.value }
      } else {
        if (block?.breaks) {
          items = items.filter(id => id !== shield)
          log.push(`${josa(catalog[shield!].name, '이', '가')} 부서졌습니다.`)
        }
        stats.hp = clamp(stats.hp - enemy.damage)
        lastStat = 'hp'
        log.push(`${enemy.name}의 공격에 맞아 체력이 ${enemy.damage} 줄었습니다.`)
      }
    }
  }
  const after = { ...state, stats, items, lastStat }
  if (stats.hp <= 0) return { state: enter(after, scenes, lose, rng), check }
  if (turns && current.turn >= turns) return { state: enter(after, scenes, timeout ?? lose, rng), check }
  return { state: { ...after, combat: { hp: enemyHp, turn: current.turn + 1, mods, log } }, check }
}

export function choose(
  state: GameState,
  choice: Choice,
  scenes: Record<string, Scene>,
  rng: () => number = Math.random,
  catalog: Record<string, Item> = {},
): { state: GameState; check?: CheckResult } {
  if (choice.action) return combatTurn(state, choice, scenes, rng, catalog)
  let check: CheckResult
  if (choice.odds) check = roll([], oddsTarget(state, choice.odds), rng)
  else if (choice.target !== undefined) check = roll(checkParts(state, choice), choice.target, rng)
  else return { state: enter(applyEffects(state, choice.effects, rng), scenes, choice.next, rng) }
  const after = check.success
    ? applyEffects({ ...state, successes: state.successes + 1 }, choice.effects, rng)
    : state
  return { state: enter(after, scenes, check.success ? choice.next : (choice.failNext ?? choice.next), rng), check }
}
