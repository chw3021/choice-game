import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/700.css'
import '@fontsource/noto-serif-kr/500.css'
import './style.css'
import battle from './assets/battle.png'
import chevron from './assets/chevron.svg'
import chevronActive from './assets/chevron-active.svg'
import tabIndicator from './assets/tab-indicator.svg'
import {
  STAT_KEYS,
  STAT_MAX,
  STAT_NAMES,
  choose,
  newGame,
  statLabel,
  visibleChoices,
  type Block,
  type CheckResult,
  type GameState,
} from './game/engine.ts'
import { START, START_STATS, scenes } from './game/story.ts'

const SAVE_KEY = 'choice-game:save'
const images: Record<string, string> = { battle }
const app = document.querySelector<HTMLDivElement>('#app')!

let state = load() ?? newGame(scenes, START, START_STATS)
let lastCheck: CheckResult | undefined
let statsOpen = false

function load(): GameState | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as GameState | null
    // 스토리 수정으로 저장된 장면이 사라졌으면 새 게임으로 시작
    return saved && scenes[saved.sceneId] ? saved : undefined
  } catch {
    return undefined
  }
}

function renderBlock(b: Block): string {
  if (b.kind === 'line') {
    return `<div class="line">
      <div class="speaker"><i></i><b>${b.speaker}</b>${b.tag ? `<span>${b.tag}</span>` : ''}</div>
      <p>${b.text}</p>
    </div>`
  }
  return `<p class="narration">${b.text}${b.note ? `<br><b class="note">${b.note}</b>` : ''}</p>`
}

function renderCheck(c: CheckResult): string {
  const mod = c.modifier ? ` ${c.modifier > 0 ? '+' : '-'} ${Math.abs(c.modifier)}` : ''
  return `<p class="check ${c.success ? 'ok' : 'fail'}">
    판정 ${c.success ? '성공' : '실패'} · ${c.dice.join(' + ')}${mod} = ${c.total} (목표 ${c.target})
  </p>`
}

function choiceButton(attr: string, label: string, highlight: boolean): string {
  return `<button class="choice${highlight ? ' trait' : ''}" ${attr}>
    <span>${label}</span><img src="${highlight ? chevronActive : chevron}" width="14" height="14" alt="">
  </button>`
}

function render() {
  const scene = scenes[state.sceneId]
  const choices = visibleChoices(scene, state).map((c, i) =>
    choiceButton(
      `data-i="${i}"`,
      `${c.trait ? `<b>[${c.trait}] ${c.text}</b>` : c.text}${c.target ? ` (목표: ${c.target})` : ''}`,
      Boolean(c.trait),
    ),
  )
  if (scene.ending) choices.push(choiceButton('data-restart', '처음부터 다시 하기', false))

  app.innerHTML = `
    ${scene.image ? `<div class="art"><img src="${images[scene.image]}" alt=""></div>` : ''}
    <main class="story">
      ${lastCheck ? renderCheck(lastCheck) : ''}
      ${scene.ending ? `<h1 class="ending">엔딩 · ${scene.ending}</h1>` : ''}
      ${scene.blocks.map(renderBlock).join('')}
      <div class="choices">${choices.join('')}</div>
    </main>
    <button class="status${statsOpen ? ' open' : ''}" data-status aria-expanded="${statsOpen}" aria-label="상태 상세 보기">
      <img class="handle" src="${tabIndicator}" width="69" height="3" alt="">
      ${STAT_KEYS.map(
        k => `<span class="${k === state.lastStat ? 'active' : ''}">
          ${statLabel(k, state.stats[k])}<small>${STAT_NAMES[k]} ${state.stats[k]}/${STAT_MAX}</small>
        </span>`,
      ).join('')}
    </button>`
}

app.addEventListener('click', e => {
  const btn = (e.target as HTMLElement).closest('button')
  if (!btn) return
  if (btn.dataset.status !== undefined) {
    statsOpen = !statsOpen
    render()
    return
  }
  if (btn.dataset.restart !== undefined) {
    state = newGame(scenes, START, START_STATS)
    lastCheck = undefined
  } else {
    const choice = visibleChoices(scenes[state.sceneId], state)[Number(btn.dataset.i)]
    const result = choose(state, choice, scenes)
    state = result.state
    lastCheck = result.check
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  render()
  window.scrollTo(0, 0)
})

render()
