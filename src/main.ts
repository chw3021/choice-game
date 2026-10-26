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
  type Scene,
} from './game/engine.ts'
import { START, START_ITEMS, START_STATS, items, scenes } from './game/story.ts'

const SAVE_KEY = 'choice-game:save'
const SETTINGS_KEY = 'choice-game:settings'
const images: Record<string, string> = { battle }
// 화면·장면 삽화. 파일 이름이 장면 id(또는 title, loading, menu, settings)와 같다
const art = import.meta.glob<string>('./assets/art/*.jpg', { eager: true, import: 'default' })
const artOf = (name: string) => art[`./assets/art/${name}.jpg`]
const sceneArt = (s: Scene) => (s.image ? images[s.image] : artOf(s.id))
const app = document.querySelector<HTMLDivElement>('#app')!

// 글자당 ms. 0이면 타이핑 없이 바로 보여준다
const SPEEDS: [string, number][] = [
  ['느림', 40],
  ['보통', 20],
  ['빠름', 10],
  ['즉시', 0],
]
interface Settings {
  speed: number
  diceMotion: boolean
}

let state = load() ?? newGame(scenes, START, START_STATS, START_ITEMS)
let settings: Settings = { speed: 20, diceMotion: true, ...loadSettings() }
let screen: 'loading' | 'title' | 'game' = 'loading'
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
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as (GameState & { modifier?: number }) | null
    // 스토리 수정으로 저장된 장면이 사라졌으면 새 게임으로 시작. 아이템 도입 전 저장은 빈 소지품으로,
    // 출처별 보정 도입 전 저장은 합계 보정치 하나로 이어간다
    if (!saved || !scenes[saved.sceneId]) return undefined
    const { modifier, ...rest } = saved
    return { ...rest, items: saved.items ?? [], mods: saved.mods ?? (modifier ? { 보정: modifier } : {}) }
  } catch {
    return undefined
  }
}

function loadSettings(): Partial<Settings> {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>
  } catch {
    return {}
  }
}

const ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
}
const LABELS = { menu: '메뉴', settings: '설정' }

function renderHud(kinds: (keyof typeof ICONS)[]): string {
  return `<nav class="hud">${kinds
    .map(
      k => `<button data-open="${k}" aria-label="${LABELS[k]}">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>
      </button>`,
    )
    .join('')}</nav>`
}

function renderLoading(): string {
  return `<div class="loading-screen">
    <img src="${artOf('loading')}" alt="">
    <p role="status">불러오는 중입니다</p>
    <span class="loading-bar"><i></i></span>
  </div>`
}

function renderTitle(): string {
  const saved = Boolean(load())
  return `<div class="title-screen">
    <img src="${artOf('title')}" alt="">
    <div class="title-text"><p>역병의 왕국</p><h1>거암세의 음모</h1></div>
    <div class="title-menu">
      ${saved ? choiceButton('data-continue', '이어하기', true) : ''}
      ${choiceButton('data-new', '새로 시작', !saved)}
    </div>
  </div>
  ${renderHud(['settings'])}`
}

function renderPanel(kind: keyof typeof ICONS): string {
  const body =
    kind === 'menu'
      ? [
          choiceButton('data-act="close"', '계속하기', true),
          choiceButton('data-open="settings"', '설정', false),
          choiceButton('data-act="title"', '메인 화면으로', false),
        ].join('')
      : `<div class="setting">텍스트 속도
          <div class="seg">${SPEEDS.map(
            ([label, ms]) => `<button data-speed="${ms}" aria-pressed="${settings.speed === ms}">${label}</button>`,
          ).join('')}</div>
        </div>
        <div class="setting">주사위 애니메이션
          <div class="seg">
            <button data-motion="1" aria-pressed="${settings.diceMotion}">켜기</button>
            <button data-motion="0" aria-pressed="${!settings.diceMotion}">끄기</button>
          </div>
        </div>
        ${choiceButton('data-act="reset"', '진행 초기화', false)}
        ${choiceButton('data-act="close"', '닫기', false)}`
  return `<div class="panel">
    <div class="panel-card" role="dialog" aria-modal="true" aria-label="${LABELS[kind]}" tabindex="-1">
      <img class="panel-art" src="${artOf(kind)}" alt="">
      <h2>${LABELS[kind]}</h2>
      ${body}
    </div>
  </div>`
}

// 패널은 화면을 다시 그리지 않고 위에 덧붙인다. 다시 그리면 진행 중인 타이핑·판정 연출이 처음부터 재생된다
function openPanel(kind?: keyof typeof ICONS) {
  app.querySelector('.panel')?.remove()
  if (!kind) return
  app.insertAdjacentHTML('beforeend', renderPanel(kind))
  app.querySelector<HTMLElement>('.panel-card')!.focus()
}

function saveSettings(next: Partial<Settings>) {
  settings = { ...settings, ...next }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  openPanel('settings')
}

// 폰트와 다음 화면 삽화를 받은 뒤 넘어간다. 금방 끝나도 깜빡이지 않게 최소 0.6초는 보여준다
function loadInto(next: typeof screen, urls: string[]) {
  screen = 'loading'
  render()
  const decode = (src: string) => {
    const img = new Image()
    img.src = src
    return img.decode().catch(() => undefined)
  }
  Promise.all([document.fonts.ready, ...urls.map(decode), new Promise(r => setTimeout(r, 600))]).then(() => {
    screen = next
    render()
  })
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
  return `<button class="dice-overlay${settings.diceMotion ? '' : ' still'}" data-dice aria-live="polite">
    <span class="dice-title">판정 · 목표 ${c.target}</span>
    <span class="dice">${c.dice.map(() => `<span class="die">${face(1)}</span>`).join('')}</span>
    <span class="breakdown">
      <span><span>주사위 굴림</span><b>${c.dice[0] + c.dice[1]}</b></span>
      ${c.parts
        .map(p => `<span><span>${p.label}</span><b class="${p.value > 0 ? 'up' : 'down'}">${p.value > 0 ? '+' : ''}${p.value}</b></span>`)
        .join('')}
      <span class="check ${c.success ? 'ok' : 'fail'}">판정 ${c.success ? '성공' : '실패'} ${c.total}!</span>
    </span>
    <span class="dice-hint">화면을 눌러 계속하기</span>
  </button>`
}

// 주사위를 잠시 무작위로 굴린 뒤 실제 판정 값으로 멈춘다
function rollDice(c: CheckResult) {
  const overlay = app.querySelector<HTMLElement>('.dice-overlay')!
  const dice = [...overlay.querySelectorAll<HTMLElement>('.die')]
  const reduce = !settings.diceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches
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
  if (!text || !settings.speed || !('highlights' in CSS) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
  }, settings.speed)
}

function render() {
  stopTyping()
  if (screen !== 'game') {
    app.innerHTML = screen === 'loading' ? renderLoading() : renderTitle()
    return
  }
  const scene = scenes[state.sceneId]
  const choices = visibleChoices(scene, state).map((c, i) =>
    choiceButton(
      `data-i="${i}"`,
      `${c.trait ? `<b>[${c.trait}] ${c.text}</b>` : c.text}${c.target ? ` (목표: ${c.target})` : ''}`,
      Boolean(c.trait),
    ),
  )
  if (scene.ending) choices.push(choiceButton('data-restart', '처음부터 다시 하기', false))

  const image = sceneArt(scene)
  app.innerHTML = `
    ${image ? `<div class="art"><img src="${image}" alt=""></div>` : ''}
    ${renderHud(['menu', 'settings'])}
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

function resetGame() {
  state = newGame(scenes, START, START_STATS, START_ITEMS)
  lastCheck = undefined
  diceOpen = false
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
  // 패널 바깥(어두운 배경)을 누르면 닫는다
  if ((e.target as HTMLElement).classList.contains('panel')) return openPanel()
  const btn = (e.target as HTMLElement).closest('button')
  if (!btn) return
  const { open, act, speed, motion } = btn.dataset
  if (open) return openPanel(open as keyof typeof ICONS)
  if (speed !== undefined) return saveSettings({ speed: Number(speed) })
  if (motion !== undefined) return saveSettings({ diceMotion: motion === '1' })
  if (act === 'close') return openPanel()
  if (act === 'title') {
    screen = 'title'
    return render()
  }
  if (act === 'reset') {
    if (!confirm('저장된 진행 상황이 모두 삭제됩니다. 계속하시겠습니까?')) return
    localStorage.removeItem(SAVE_KEY)
    resetGame()
    screen = 'title'
    return render()
  }
  if (btn.dataset.continue !== undefined) return loadInto('game', [sceneArt(scenes[state.sceneId])])
  if (btn.dataset.new !== undefined) {
    if (load() && !confirm('진행 중인 이야기가 삭제됩니다. 새로 시작하시겠습니까?')) return
    localStorage.removeItem(SAVE_KEY)
    resetGame()
    return loadInto('game', [sceneArt(scenes[START])])
  }
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
    resetGame()
  } else {
    const choice = visibleChoices(scenes[state.sceneId], state)[Number(btn.dataset.i)]
    const result = choose(state, choice, scenes, Math.random, items)
    state = result.state
    lastCheck = result.check
    diceOpen = Boolean(result.check)
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  render()
  window.scrollTo(0, 0)
})

document.addEventListener('keydown', e => e.key === 'Escape' && openPanel())

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

loadInto('title', [artOf('title')])
