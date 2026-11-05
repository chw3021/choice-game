import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { choose, newGame, visibleChoices, type GameState, type Scene } from './engine.ts'
import { items, scenes, START, START_ITEMS, START_STATS } from './story.ts'

const artExists = (name: string) => existsSync(new URL(`../assets/art/${name}.jpg`, import.meta.url))

// 신규 장면 삽화·초상화 생성 전까지 todo로 둔다. 그림을 추가하면 todo 옵션을 제거한다
test('모든 장면은 삽화(image 또는 장면 id) 또는 초상화(portrait-이름) 파일이 있다', { todo: '신규 삽화 29장 미생성' }, () => {
  const missing = Object.values(scenes)
    .map(s => (s.portrait ? `portrait-${s.portrait}` : (s.image ?? s.id)))
    .filter(name => !artExists(name))
  assert.deepEqual([...new Set(missing)], [])
})

// rng 값 r → d20 눈 1 + floor(r * 20). 방패 막기 판정은 rng() < 확률
const roll = (...values: number[]) => () => values.shift()!
const d = (face: number) => (face - 1) / 20
const SEED = 7

const nextIds = (scene: Scene) =>
  scene.combat ? [scene.combat.win, scene.combat.lose, scene.combat.timeout] : scene.choices.flatMap(c => [c.next, c.failNext])

test('모든 선택지·전투 결과가 존재하는 장면을 가리키고, 엔딩·전투가 아닌 장면은 선택지가 있다', () => {
  assert.ok(scenes[START])
  for (const scene of Object.values(scenes)) {
    if (!scene.ending && !scene.combat) assert.ok(scene.choices.length > 0, `${scene.id}에 선택지가 없습니다`)
    for (const id of nextIds(scene)) if (id) assert.ok(scenes[id], `${scene.id} → ${id}`)
  }
})

test('시작 장면에서 모든 장면(엔딩 포함)에 도달할 수 있다', () => {
  const seen = new Set([START])
  const queue = [START]
  while (queue.length) {
    for (const id of nextIds(scenes[queue.shift()!])) {
      if (id && !seen.has(id)) {
        seen.add(id)
        queue.push(id)
      }
    }
  }
  assert.deepEqual(Object.keys(scenes).filter(id => !seen.has(id)), [])
})

test('모든 판정 선택지는 기술·상태치·확률 중 하나를 쓴다', () => {
  for (const scene of Object.values(scenes)) {
    for (const c of scene.choices) {
      if (c.target !== undefined) assert.ok(c.skill || c.stat, `${scene.id}: ${c.text}`)
    }
  }
})

test('악몽 난이도는 보정치 -2와 플래그가 붙는다', () => {
  const s = newGame(scenes, START, START_STATS, [], SEED)
  const [normal, nightmare] = scenes[START].choices
  assert.deepEqual(choose(s, normal, scenes).state.mods, {})
  const hard = choose(s, nightmare, scenes).state
  assert.deepEqual(hard.mods, { '악몽 난이도': -2 })
  assert.ok(hard.flags.includes('nightmare'))
})

test('출신은 시드에 따라 3개만 보이고, 같은 시드면 같은 출신이 보인다', () => {
  const at = (seed: number) => visibleChoices(scenes.audience, newGame(scenes, 'audience', START_STATS, [], seed)).map(c => c.text)
  assert.equal(at(SEED).length, 3)
  assert.deepEqual(at(SEED), at(SEED))
  const seen = new Set(Array.from({ length: 50 }, (_, seed) => at(seed)).flat())
  assert.equal(seen.size, 8)
})

test('출신을 고르면 직업 플래그와 숙련 기술을 얻고, 숙련 기술 판정에 +5가 붙는다', () => {
  const s = newGame(scenes, 'audience', START_STATS, [], SEED)
  const noble = scenes.audience.choices.find(c => c.next === 'job-noble')!
  const after = choose(s, noble, scenes).state
  assert.ok(['job-noble', 'skill:협박', 'skill:화술'].every(f => after.flags.includes(f)))

  const talk = scenes.chest.choices.find(c => c.skill === '화술')!
  const at = { ...after, sceneId: 'chest' }
  const check = choose(at, talk, scenes, roll(d(5))).check!
  assert.deepEqual(check.parts, [{ label: '화술 숙련', value: 5 }])
  assert.equal(check.total, 10)
  assert.ok(check.success)
  // 숙련이 없는 기술은 보정 없음
  const steal = scenes.chest.choices.find(c => c.skill === '손재주')!
  assert.deepEqual(choose(at, steal, scenes, roll(d(5))).check!.parts, [])
})

test('판정 보정치는 기술 → 상태치 구간 → 이야기 보정 순으로 출처별 내역이 남는다', () => {
  const s: GameState = {
    ...newGame(scenes, 'well', START_STATS, [], SEED),
    flags: ['skill:운동'],
    mods: { '악몽 난이도': -2 },
  }
  const lift = scenes.well.choices[0]
  const check = choose(s, lift, scenes, roll(d(10))).check!
  assert.deepEqual(check.parts, [
    { label: '운동 숙련', value: 5 },
    { label: '혈기왕성', value: 3 },
    { label: '악몽 난이도', value: -2 },
  ])
  assert.equal(check.total, 16)

  // 상태치 구간: 0-20 → -3, 41-70 → +1
  assert.deepEqual(choose({ ...s, stats: { ...s.stats, hp: 15 } }, lift, scenes, roll(d(10))).check!.parts[1], { label: '빈사', value: -3 })
  assert.deepEqual(choose({ ...s, stats: { ...s.stats, hp: 50 } }, lift, scenes, roll(d(10))).check!.parts[1], { label: '건강함', value: 1 })
})

test('판정: d20 + 보정치가 난이도 이상이면 성공 장면과 효과, 아니면 실패 장면', () => {
  const s = newGame(scenes, 'well', { ...START_STATS, hp: 50 }, [], SEED)
  const lift = scenes.well.choices[0]
  const win = choose(s, lift, scenes, roll(d(11)))
  assert.deepEqual(win.check, { dice: 11, parts: [{ label: '건강함', value: 1 }], modifier: 1, total: 12, target: 12, success: true })
  assert.equal(win.state.sceneId, 'well-saved')
  assert.ok(win.state.flags.includes('people-well'))
  assert.equal(win.state.successes, 1)

  const lose = choose(s, lift, scenes, roll(d(10)))
  assert.equal(lose.state.sceneId, 'well-failed')
  assert.ok(!lose.state.flags.includes('people-well'))
})

test('확률 판정: 성공 확률이 (상태치 + plus)%가 되도록 목표치를 정하고 다른 보정은 붙지 않는다', () => {
  const s: GameState = { ...newGame(scenes, 'palace-info-low', { ...START_STATS, hygiene: 60 }, [], SEED), mods: { '악몽 난이도': -2 } }
  const lie = scenes['palace-info-low'].choices[0]
  // 위생 60 → 60% → d20 9 이상
  assert.deepEqual(choose(s, lie, scenes, roll(d(9))).check, { dice: 9, parts: [], modifier: 0, total: 9, target: 9, success: true })
  assert.equal(choose(s, lie, scenes, roll(d(8))).state.sceneId, 'palace-rule')
  // 위생 + 20 = 80% → d20 5 이상
  const sure = scenes['palace-flatter-high'].choices[0]
  assert.equal(choose({ ...s, sceneId: 'palace-flatter-high' }, sure, scenes, roll(d(5))).check!.target, 5)
})

test('위생 수치에 따라 같은 선택지라도 다른 반응으로 이어진다', () => {
  const at = (hygiene: number) =>
    visibleChoices(scenes['palace-alarm'], newGame(scenes, 'palace-alarm', { ...START_STATS, hygiene }, [], SEED)).map(c => c.next)
  assert.deepEqual(at(80), ['palace-fight-1', 'palace-info-high', 'palace-flatter-high'])
  assert.deepEqual(at(71), ['palace-fight-1', 'palace-info-high', 'palace-flatter-high'])
  assert.deepEqual(at(70), ['palace-fight-1', 'palace-info-low', 'palace-flatter-mid'])
  assert.deepEqual(at(40), ['palace-fight-1', 'palace-info-low', 'palace-flatter-low'])
})

test('궤짝 조사 성공은 귀한 물건 1개 + 일반 물건 3개, 실패는 일반 물건 4개가 보이고 이미 가진 물건은 빠진다', () => {
  const s = newGame(scenes, 'chest-search-ok', START_STATS, [], SEED)
  const ok = visibleChoices(scenes['chest-search-ok'], s)
  assert.equal(ok.length, 4)
  assert.equal(ok[0].trait, '귀한 물건')
  assert.ok(ok.slice(1).every(c => !c.trait))

  const fail = visibleChoices(scenes['chest-search-fail'], s)
  assert.equal(fail.length, 4)
  const owned = fail[0].effects!.items![0]
  assert.ok(!visibleChoices(scenes['chest-search-fail'], { ...s, items: [owned] }).some(c => c.effects?.items?.includes(owned)))
})

test('빼돌린 물건은 품속에 숨겨졌다가 왕궁을 나서면 드러나고, 들키면 소지품과 돈을 모두 잃는다', () => {
  const s = newGame(scenes, 'chest', START_STATS, ['dull-sword'], SEED)
  const steal = scenes.chest.choices.find(c => c.skill === '손재주')!
  const stolen = choose(s, steal, scenes, roll(d(20), 0)).state
  assert.equal(stolen.sceneId, 'steal-ok')
  assert.deepEqual(stolen.items, ['dull-sword'])
  assert.equal(stolen.pocket.length, 1)

  const revealed = choose({ ...stolen, sceneId: 'depart' }, visibleChoices(scenes.depart, stolen)[0], scenes).state
  assert.equal(revealed.sceneId, 'depart-pocket')
  assert.deepEqual(revealed.items, ['dull-sword', ...stolen.pocket])
  assert.deepEqual(revealed.pocket, [])

  const caught = choose(stolen, scenes['steal-ok'].choices[0], scenes, roll(d(1))).state
  assert.equal(caught.sceneId, 'steal-fail')
  assert.deepEqual([caught.items, caught.pocket, caught.stats.money], [[], [], 0])
  assert.deepEqual(visibleChoices(scenes.depart, caught).map(c => c.next), ['crossroads'])
})

test('전투: 공격이 적중하면 적 체력이 줄고, 다 깎으면 승리 장면으로 간다', () => {
  const s = newGame(scenes, 'palace-fight-1', START_STATS, ['sharp-sword'], SEED)
  assert.deepEqual(s.combat, { hp: 2, turn: 1, mods: {}, log: [] })
  const [attack] = visibleChoices(scenes['palace-fight-1'], s, items)

  // 공격 8 + 칼 3 + 혈기왕성 3 = 14 ≥ 방어 11 → 적중, 적 공격 1 + 3 < 12 → 회피
  const t1 = choose(s, attack, scenes, roll(d(8), d(1)), items)
  assert.deepEqual(t1.check!.parts, [
    { label: '날카로운 칼', value: 3 },
    { label: '혈기왕성', value: 3 },
  ])
  assert.ok(t1.check!.success && t1.check!.attack)
  assert.deepEqual(t1.state.combat, { hp: 1, turn: 2, mods: {}, log: ['경비병에게 공격이 적중했습니다.', '경비병의 공격을 피했습니다.'] })

  const t2 = choose(t1.state, attack, scenes, roll(d(8)), items)
  assert.equal(t2.state.sceneId, 'palace-inside')
  assert.equal(t2.state.combat, undefined)
})

test('전투: 턴 제한 안에 못 이기면 timeout 장면, 체력이 0이 되면 lose 장면', () => {
  const s = newGame(scenes, 'palace-fight-1', START_STATS, [], SEED)
  const [attack] = visibleChoices(scenes['palace-fight-1'], s, items)
  const miss = roll(d(1), d(1), d(1), d(1), d(1), d(1))
  let state = s
  for (let i = 0; i < 3; i++) state = choose(state, attack, scenes, miss, items).state
  assert.equal(state.sceneId, 'end-torture')

  const weak = { ...s, stats: { ...s.stats, hp: 10 } }
  const dead = choose(weak, attack, scenes, roll(d(1), d(20)), items).state
  assert.equal(dead.sceneId, 'end-dead')
})

test('전투: 강철 방패로 막으면 손 저림 -4가 붙고, 나무 방패는 못 막으면 부서진 채 맞는다', () => {
  const steel = newGame(scenes, 'arena-fight-2', START_STATS, ['steel-shield'], SEED)
  const [attack] = visibleChoices(scenes['arena-fight-2'], steel, items)
  const blocked = choose(steel, attack, scenes, roll(d(1), d(20), 0.1), items).state
  assert.equal(blocked.stats.hp, 80)
  assert.deepEqual(blocked.combat!.mods, { '손 저림': -4 })
  assert.ok(choose(blocked, attack, scenes, roll(d(1), d(1)), items).check!.parts.some(p => p.label === '손 저림'))

  const wood = newGame(scenes, 'arena-fight-2', START_STATS, ['wooden-shield'], SEED)
  const broken = choose(wood, attack, scenes, roll(d(1), d(20), 0.5), items).state
  assert.deepEqual(broken.items, [])
  assert.equal(broken.stats.hp, 65)
})

test('전투: 후추통을 쓰면 소모되고 그 턴 적이 공격하지 못한다', () => {
  const s = newGame(scenes, 'palace-fight-1', { ...START_STATS, hp: 10 }, ['pepper'], SEED)
  const actions = visibleChoices(scenes['palace-fight-1'], s, items)
  assert.deepEqual(actions.map(c => c.text), ['공격한다', '후추통을 상대의 눈에 뿌린다'])
  const r = choose(s, actions[1], scenes, roll(), items)
  assert.equal(r.check, undefined)
  assert.deepEqual([r.state.items, r.state.stats.hp, r.state.combat!.turn], [[], 10, 2])
})

test('상태치는 0~100 범위를 벗어나지 않는다', () => {
  const s: GameState = { ...newGame(scenes, START, START_STATS, [], SEED), stats: { hp: 10, mind: 100, hygiene: 0, money: 0 } }
  const next = choose(s, { text: '', next: 'caught', effects: { stats: { mind: 50 } } }, scenes).state
  assert.equal(next.stats.hp, 0)
  assert.equal(next.stats.mind, 100)
})

test('결단 장면 선택지는 보유한 비밀·인카운터에 따라 달라진다', () => {
  const base = newGame(scenes, START, START_STATS, START_ITEMS, SEED)
  const go = (owned: string[], flags: string[] = []) =>
    visibleChoices(scenes.decision, { ...base, items: owned, flags }).map(c => c.next)

  assert.deepEqual(go([]), ['end-silence'])
  assert.deepEqual(go(['royal-doc']), ['end-royal-loyal', 'end-church-ally', 'end-silence'])
  assert.deepEqual(go(['church-secret']), ['end-church-ally', 'church-hunt', 'end-silence'])
  // 역병의사를 만난 적이 있어야 치료법 전달 분기가 열린다
  assert.ok(go(['church-secret'], ['met-doctor']).includes('doctor-chase-1'))

  const both = ['royal-doc', 'church-secret']
  assert.deepEqual(go(both), ['end-tyrant', 'end-anarchy', 'end-silence'])
  // 농민영웅: 백성 인카운터 2개 이상. 역병 구역 백성을 구했으면 진 개혁, 아니면 일반 개혁
  assert.ok(!go(both, ['people-well']).some(id => id.includes('reform')))
  assert.ok(go(both, ['people-well', 'people-granary']).includes('end-reform'))
  assert.ok(!go(both, ['people-well', 'people-granary']).includes('end-true-reform'))
  assert.ok(go(both, ['people-well', 'people-ward']).includes('end-true-reform'))
  assert.ok(!go(both, ['people-well', 'people-ward']).includes('end-reform'))
})

test('악몽 난이도에서 왕실 비밀문서를 얻어야 고대 발굴현장이 열린다', () => {
  const base = newGame(scenes, START, START_STATS, [], SEED)
  const open = (owned: string[], flags: string[]) =>
    visibleChoices(scenes.crossroads, { ...base, items: owned, flags }).some(c => c.next === 'excavation')
  assert.ok(!open(['royal-doc'], []))
  assert.ok(!open([], ['nightmare']))
  assert.ok(open(['royal-doc'], ['nightmare']))
})
