import { test } from 'node:test'
import assert from 'node:assert/strict'
import { choose, newGame, visibleChoices, type GameState } from './engine.ts'
import { scenes, START, START_STATS } from './story.ts'

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

test('시작 장면 진입 효과(공포 -1)가 적용된다', () => {
  assert.equal(newGame(scenes, START, START_STATS).modifier, -1)
})

test('판정: 2d6 + 보정치가 목표 이상이면 성공 장면, 아니면 실패 장면', () => {
  const s = newGame(scenes, START, START_STATS)
  const brave = scenes[START].choices[0]

  const win = choose(s, brave, scenes, roll(SIX, SIX))
  assert.deepEqual(win.check, { dice: [6, 6], modifier: -1, total: 11, target: 6, success: true })
  assert.equal(win.state.sceneId, 'siege-hero')
  assert.ok(win.state.flags.includes('peasant-hero'))
  assert.equal(win.state.successes, 1)

  const lose = choose(s, brave, scenes, roll(ONE, ONE))
  assert.equal(lose.check?.success, false)
  assert.equal(lose.state.sceneId, 'siege-wounded')
  assert.ok(!lose.state.flags.includes('peasant-hero'))
})

test('상태치는 0~10 범위를 벗어나지 않는다', () => {
  const s: GameState = { ...newGame(scenes, START, START_STATS), stats: { hp: 1, mind: 10, hygiene: 0, money: 0 } }
  const next = choose(s, { text: '', next: 'siege-wounded', effects: { stats: { mind: 5 } } }, scenes).state
  assert.equal(next.stats.hp, 0)
  assert.equal(next.stats.mind, 9)
})

test('결단 장면 선택지는 보유한 비밀에 따라 달라진다', () => {
  const base = newGame(scenes, START, START_STATS)
  const texts = (flags: string[]) => visibleChoices(scenes.decision, { ...base, flags }).map(c => c.text)

  assert.deepEqual(texts([]), ['못본척 지나간다'])
  assert.ok(texts(['royal-doc']).includes('장부를 불태우고 왕실을 지지한다'))
  assert.ok(!texts(['royal-doc']).includes('왕좌에 앉는다'))
  assert.ok(texts(['church-secret']).includes('교회에 거래한다'))
  assert.ok(texts(['royal-doc', 'church-secret']).includes('왕좌에 앉는다'))
  assert.ok(!texts(['royal-doc', 'church-secret']).includes('백성을 위한 개혁을 일으킨다'))
  assert.ok(texts(['royal-doc', 'church-secret', 'peasant-hero']).includes('백성을 위한 개혁을 일으킨다'))
})
