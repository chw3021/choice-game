import { test } from 'node:test'
import assert from 'node:assert/strict'
import { choose, newGame, visibleChoices, type GameState } from './engine.ts'
import { scenes, START, START_ITEMS, START_STATS } from './story.ts'

// rng 값 r → 주사위 눈 1 + floor(r * 6)
const roll = (...values: number[]) => () => values.shift()!
const SIX = 0.99
const ONE = 0

test('모든 선택지가 존재하는 장면을 가리키고, 엔딩이 아닌 장면은 선택지가 있다', () => {
  assert.ok(scenes[START])
  for (const scene of Object.values(scenes)) {
    if (!scene.ending) assert.ok(scene.choices.length > 0, `${scene.id}에 선택지가 없습니다`)
    for (const c of scene.choices) {
      assert.ok(scenes[c.next], `${scene.id} → ${c.next}`)
      if (c.failNext) assert.ok(scenes[c.failNext], `${scene.id} → ${c.failNext}`)
    }
  }
})

test('시작 장면에서 모든 장면(엔딩 포함)에 도달할 수 있다', () => {
  const seen = new Set([START])
  const queue = [START]
  while (queue.length) {
    for (const c of scenes[queue.shift()!].choices) {
      for (const id of [c.next, c.failNext]) {
        if (id && !seen.has(id)) {
          seen.add(id)
          queue.push(id)
        }
      }
    }
  }
  assert.deepEqual(Object.keys(scenes).filter(id => !seen.has(id)), [])
})

test('공성 장면 진입 효과(공포 -1)가 적용되고, 악몽 난이도는 보정치 -1이 추가된다', () => {
  const s = newGame(scenes, START, START_STATS)
  const [normal, nightmare] = scenes[START].choices
  assert.equal(choose(s, normal, scenes).state.modifier, -1)
  const hard = choose(s, nightmare, scenes).state
  assert.equal(hard.modifier, -2)
  assert.ok(hard.flags.includes('nightmare'))
})

test('판정: 2d6 + 보정치가 목표 이상이면 성공 장면, 아니면 실패 장면', () => {
  const s = newGame(scenes, 'siege', START_STATS)
  const brave = scenes.siege.choices[0]

  const win = choose(s, brave, scenes, roll(SIX, SIX))
  assert.deepEqual(win.check, { dice: [6, 6], modifier: -1, total: 11, target: 6, success: true })
  assert.equal(win.state.sceneId, 'siege-hero')
  assert.ok(win.state.flags.includes('people-siege'))
  assert.equal(win.state.successes, 1)

  const lose = choose(s, brave, scenes, roll(ONE, ONE))
  assert.equal(lose.check?.success, false)
  assert.equal(lose.state.sceneId, 'siege-wounded')
  assert.ok(!lose.state.flags.includes('people-siege'))
})

test('상태치는 0~10 범위를 벗어나지 않는다', () => {
  const s: GameState = { ...newGame(scenes, START, START_STATS), stats: { hp: 1, mind: 10, hygiene: 0, money: 0 } }
  const next = choose(s, { text: '', next: 'siege-wounded', effects: { stats: { mind: 5 } } }, scenes).state
  assert.equal(next.stats.hp, 0)
  assert.equal(next.stats.mind, 9)
})

test('결단 장면 선택지는 xmind 분기대로 보유한 비밀·인카운터에 따라 달라진다', () => {
  const base = newGame(scenes, START, START_STATS, START_ITEMS)
  const go = (items: string[], flags: string[] = []) =>
    visibleChoices(scenes.decision, { ...base, items: [...base.items, ...items], flags }).map(c => c.next)

  assert.deepEqual(go([]), ['end-silence'])
  assert.deepEqual(go(['royal-doc']), ['end-royal-loyal', 'end-church-ally', 'end-silence'])
  assert.deepEqual(go(['church-secret']), ['end-church-ally', 'church-hunt', 'end-silence'])
  // 역병의사를 만난 적이 있어야 치료법 전달 분기가 열린다
  assert.ok(go(['church-secret'], ['met-doctor']).includes('doctor-chase-1'))

  const both = ['royal-doc', 'church-secret']
  assert.deepEqual(go(both), ['end-tyrant', 'end-anarchy', 'end-silence'])
  // 농민영웅: 백성 인카운터 2개 이상. 역병 구역 백성을 구했으면 진 개혁, 아니면 일반 개혁
  assert.ok(!go(both, ['people-siege']).some(id => id.includes('reform')))
  assert.ok(go(both, ['people-siege', 'people-granary']).includes('end-reform'))
  assert.ok(!go(both, ['people-siege', 'people-granary']).includes('end-true-reform'))
  assert.ok(go(both, ['people-siege', 'people-ward']).includes('end-true-reform'))
  assert.ok(!go(both, ['people-siege', 'people-ward']).includes('end-reform'))
})

test('악몽 난이도에서 왕실 비밀문서를 얻어야 고대 발굴현장이 열린다', () => {
  const base = newGame(scenes, START, START_STATS)
  const open = (items: string[], flags: string[]) =>
    visibleChoices(scenes.crossroads, { ...base, items, flags }).some(c => c.next === 'excavation')
  assert.ok(!open(['royal-doc'], []))
  assert.ok(!open([], ['nightmare']))
  assert.ok(open(['royal-doc'], ['nightmare']))
})
