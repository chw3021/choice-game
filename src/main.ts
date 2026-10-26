import '@fontsource/noto-sans-kr/300.css'
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/500.css'
import '@fontsource/noto-sans-kr/600.css'
import '@fontsource/noto-sans-kr/700.css'
import '@fontsource/noto-sans-kr/800.css'
import '@fontsource/noto-sans-kr/900.css'
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
import { START, START_ITEMS, START_STATS, items, scenes } from './game/story.ts'

const SAVE_KEY = 'choice-game:save'
const images: Record<string, string> = { battle }
const app = document.querySelector<HTMLDivElement>('#app')!

let state = load() ?? newGame(scenes, START, START_STATS, START_ITEMS)
let lastCheck: CheckResult | undefined
let statsOpen = false
let sheetDragged = false
let diceOpen = false
let typing: ReturnType<typeof setInterval> | undefined

// 주사위 눈 위치 (3x3 격자 인덱스)
const PIPS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]]
const face = (n: number) =>
  Array.from({ length: 9 }, (_, i) => `<i${PIPS[n].includes(i) ? ' class="on"' : ''}></i>`).join('')

function load(): GameState | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as GameState | null
    // 스토리 수정으로 저장된 장면이 사라졌으면 새 게임으로 시작. 아이템 도입 전 저장은 빈 소지품으로 이어간다
    return saved && scenes[saved.sceneId] ? { ...saved, items: saved.items ?? [] } : undefined
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

function renderDice(c: CheckResult): string {
  return `<button class="dice-overlay" data-dice aria-live="polite">
    <span class="dice-title">판정 · 목표 ${c.target}</span>
    <span class="dice">${c.dice.map(() => `<span class="die">${face(1)}</span>`).join('')}</span>
    ${renderCheck(c)}
    <span class="dice-hint">화면을 눌러 계속하기</span>
  </button>`
}

// 주사위를 잠시 무작위로 굴린 뒤 실제 판정 값으로 멈춘다
function rollDice(c: CheckResult) {
  const overlay = app.querySelector<HTMLElement>('.dice-overlay')!
  const dice = [...overlay.querySelectorAll<HTMLElement>('.die')]
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const end = Date.now() + (reduce ? 0 : 900)
  const timer = setInterval(() => {
    const done = Date.now() >= end
    dice.forEach((d, i) => (d.innerHTML = face(done ? c.dice[i] : 1 + Math.floor(Math.random() * 6))))
    if (done) {
      clearInterval(timer)
      overlay.classList.add('done')
    }
  }, 80)
}

function choiceButton(attr: string, label: string, highlight: boolean): string {
  return `<button class="choice${highlight ? ' trait' : ''}" ${attr}>
    <span>${label}</span><img src="${highlight ? chevronActive : chevron}" width="14" height="14" alt="">
  </button>`
}

// 상태치 0~10을 굵기 300~900에 비례시킨다 (Noto Sans KR 300~900 로드됨)
const statWeight = (v: number) => 300 + Math.round((v / STAT_MAX) * 6) * 100

function renderSheet(): string {
  const entry = (id: string) => `<b>${items[id].name}</b><small>${items[id].desc}</small>`
  const owned = state.items.filter(id => items[id])
  return `<section class="sheet${statsOpen ? ' open' : ''}">
    <div class="sheet-panel">
      <button class="status" data-status aria-expanded="${statsOpen}" aria-label="상태와 소지품 보기">
        <img class="handle" src="${tabIndicator}" width="69" height="3" alt="">
        ${STAT_KEYS.map(
          k => `<span class="${k === state.lastStat ? 'active' : ''}" style="font-weight: ${statWeight(state.stats[k])}">
            ${statLabel(k, state.stats[k])}<small>${STAT_NAMES[k]} ${state.stats[k]}/${STAT_MAX}</small>
          </span>`,
        ).join('')}
      </button>
      <div class="sheet-body">
        <ul class="bag">
          ${owned.length ? owned.map(id => `<li>${entry(id)}</li>`).join('') : '<li><em>소지품이 없습니다.</em></li>'}
        </ul>
      </div>
    </div>
  </section>`
}

// 다시 그리지 않고 클래스만 바꿔야 올라가고 내려가는 전환 애니메이션이 재생된다
function setSheet(open: boolean) {
  statsOpen = open
  const sheet = app.querySelector<HTMLElement>('.sheet')!
  sheet.classList.toggle('open', open)
  sheet.querySelector('.status')!.setAttribute('aria-expanded', String(open))
}

function stopTyping() {
  clearInterval(typing)
  typing = undefined
  CSS.highlights?.delete('untyped')
  const choices = app.querySelector('.choices')
  if (choices?.classList.contains('pending')) {
    choices.classList.replace('pending', 'revealing')
    setTimeout(() => choices.classList.remove('revealing'), 300)
  }
}

// 본문 글자를 하나씩 드러낸다. 글자는 미리 배치해 두고 아직 안 나온 부분만 투명하게 칠하므로(::highlight)
// 타이핑 중에도 레이아웃이 움직이지 않는다. 다 나올 때까지 선택지는 숨긴다
function typeText() {
  const text = app.querySelector<HTMLElement>('.text')
  if (!text || !('highlights' in CSS) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const nodes: Text[] = []
  const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) if (walker.currentNode.nodeValue!.trim()) nodes.push(walker.currentNode as Text)
  if (!nodes.length) return
  const last = nodes[nodes.length - 1]
  const hidden = new Range()
  hidden.setEnd(last, last.length)
  hidden.setStart(nodes[0], 0)
  CSS.highlights.set('untyped', new Highlight(hidden))
  app.querySelector('.choices')!.classList.add('pending')
  let n = 0
  let off = 0
  typing = setInterval(() => {
    if (off >= nodes[n].length) {
      n++
      off = 0
    }
    if (n >= nodes.length) return stopTyping()
    off++
    hidden.setStart(nodes[n], off)
    // 방금 나온 글자가 페이드 영역(32px) 아래로 내려가면 따라 스크롤한다
    const ch = new Range()
    ch.setStart(nodes[n], off - 1)
    ch.setEnd(nodes[n], off)
    const over = ch.getBoundingClientRect().bottom - (text.getBoundingClientRect().bottom - 32)
    if (over > 0) text.scrollTop += over
  }, 20)
}

function render() {
  stopTyping()
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
      <div class="text">
        ${lastCheck ? renderCheck(lastCheck) : ''}
        ${scene.ending ? `<h1 class="ending">엔딩 · ${scene.ending}</h1>` : ''}
        ${scene.blocks.map(renderBlock).join('')}
      </div>
      <div class="choices">${choices.join('')}</div>
    </main>
    ${renderSheet()}
    ${diceOpen && lastCheck ? renderDice(lastCheck) : ''}`
  updateFade()
  // 판정 오버레이가 덮고 있는 동안에는 타이핑을 미루고, 오버레이를 닫을 때 다시 그리면서 시작한다
  if (diceOpen && lastCheck) rollDice(lastCheck)
  else typeText()
}

function updateFade() {
  const text = app.querySelector<HTMLElement>('.text')
  if (!text) return
  text.classList.toggle('fade-top', text.scrollTop > 0)
  text.classList.toggle('fade-bottom', text.scrollTop + text.clientHeight < text.scrollHeight - 1)
}

app.addEventListener('click', e => {
  // 타이핑 중 본문(숨겨진 선택지 자리 포함)을 누르면 남은 글을 한 번에 보여준다
  if (typing !== undefined && (e.target as HTMLElement).closest('.story')) {
    stopTyping()
    return
  }
  const btn = (e.target as HTMLElement).closest('button')
  if (!btn) return
  if (btn.dataset.dice !== undefined) {
    if (!btn.classList.contains('done')) return
    diceOpen = false
    render()
    return
  }
  if (btn.dataset.status !== undefined) {
    if (!sheetDragged) setSheet(!statsOpen)
    sheetDragged = false
    return
  }
  if (btn.dataset.restart !== undefined) {
    state = newGame(scenes, START, START_STATS, START_ITEMS)
    lastCheck = undefined
  } else {
    const choice = visibleChoices(scenes[state.sceneId], state)[Number(btn.dataset.i)]
    const result = choose(state, choice, scenes)
    state = result.state
    lastCheck = result.check
    diceOpen = Boolean(result.check)
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  render()
  window.scrollTo(0, 0)
})

// scroll 이벤트는 버블링되지 않으므로 캡처 단계에서 받는다
app.addEventListener('scroll', updateFade, true)
window.addEventListener('resize', updateFade)
document.fonts.ready.then(updateFade)

// 터치는 브라우저 기본 스크롤을 쓰고, 마우스는 드래그로 설명문 영역을 스크롤한다
app.addEventListener('pointerdown', e => {
  const text = (e.target as HTMLElement).closest<HTMLElement>('.text')
  if (!text || e.pointerType !== 'mouse') return
  const startY = e.clientY
  const startTop = text.scrollTop
  const move = (ev: PointerEvent) => (text.scrollTop = startTop - (ev.clientY - startY))
  const up = () => {
    text.removeEventListener('pointermove', move)
    text.removeEventListener('lostpointercapture', up)
  }
  text.setPointerCapture(e.pointerId)
  text.addEventListener('pointermove', move)
  text.addEventListener('lostpointercapture', up)
})

// 하단 바를 끌어 시트를 여닫는다. 5px 미만 이동은 드래그가 아니라 클릭(토글)으로 처리한다
app.addEventListener('pointerdown', e => {
  const bar = (e.target as HTMLElement).closest<HTMLElement>('.status')
  if (!bar) return
  const panel = bar.parentElement!
  // CSS의 열린 위치(calc(-100% + 시트 자리 높이))와 같은 기준. 열리면 바에 수치가 붙어 바 높이가 달라진다
  const range = panel.offsetHeight - panel.parentElement!.offsetHeight
  const base = statsOpen ? -range : 0
  const startY = e.clientY
  let dy = 0
  sheetDragged = false
  const move = (ev: PointerEvent) => {
    dy = ev.clientY - startY
    if (Math.abs(dy) > 5) sheetDragged = true
    if (!sheetDragged) return
    panel.style.transition = 'none'
    panel.style.transform = `translateY(${Math.min(0, Math.max(-range, base + dy))}px)`
  }
  const up = () => {
    bar.removeEventListener('pointermove', move)
    bar.removeEventListener('lostpointercapture', up)
    if (!sheetDragged) return
    panel.style.transition = ''
    panel.style.transform = ''
    // 40px 넘게 끌었으면 끈 방향으로, 아니면 원래 상태로 되돌린다
    setSheet(Math.abs(dy) > 40 ? dy < 0 : statsOpen)
  }
  bar.setPointerCapture(e.pointerId)
  bar.addEventListener('pointermove', move)
  bar.addEventListener('lostpointercapture', up)
})

render()
