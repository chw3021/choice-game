// story.ts의 분기 구조를 Xmind 파일(export/story.xmind)로 내보낸다.
// 장면 그래프에는 순환·합류가 있으므로, 이미 펼친 장면은 끝 노드 + 점선 관계선으로 원래 장면에 연결한다.
import { mkdirSync, writeFileSync } from 'node:fs'
import { crc32 } from 'node:zlib'
import { STAT_KEYS, STAT_NAMES, type Choice, type Effects, type Scene } from '../src/game/engine.ts'
import { FLAG_NAMES, START, items, scenes } from '../src/game/story.ts'

interface Topic {
  id: string
  class: 'topic'
  title: string
  structureClass?: string
  labels?: string[]
  notes?: { plain: { content: string } }
  style?: { id: string; properties: Record<string, string> }
  children?: { attached: Topic[] }
}

const COLORS = {
  ending: { 'svg:fill': '#E5484D', 'fo:color': '#FFFFFF' },
  trait: { 'svg:fill': '#C8A84B', 'fo:color': '#1C150D' },
  success: { 'svg:fill': '#D3F2E2', 'fo:color': '#1B5E3B' },
  fail: { 'svg:fill': '#F9DADA', 'fo:color': '#8A1F1F' },
  ref: { 'svg:fill': '#EEEEEE', 'fo:color': '#777777' },
}

let seq = 0
const newId = () => `cg-${++seq}`
const relationships: { id: string; end1Id: string; end2Id: string }[] = []
const sceneTopicIds = new Map<string, string>()

function topic(title: string, extra: Partial<Topic> = {}, color?: keyof typeof COLORS): Topic {
  const t: Topic = { id: newId(), class: 'topic', title, ...extra }
  if (color) t.style = { id: newId(), properties: COLORS[color] }
  return t
}

// requires/excludes에는 플래그와 아이템 id가 섞여 있다
const flagName = (f: string) => items[f]?.name ?? FLAG_NAMES[f] ?? f

function sceneTitle(scene: Scene): string {
  if (scene.ending) return `엔딩 · ${scene.ending}`
  const first = scene.blocks[0]?.text.split(/(?<=[.!?])\s/)[0] ?? scene.id
  return first.length > 40 ? `${first.slice(0, 40)}…` : first
}

function effectLabels(e: Effects | undefined): string[] {
  if (!e) return []
  const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`)
  return [
    ...STAT_KEYS.filter(k => e.stats?.[k]).map(k => `${STAT_NAMES[k]} ${sign(e.stats![k]!)}`),
    ...Object.entries(e.mods ?? {}).map(([name, v]) => `보정치(${name}) ${sign(v)}`),
    ...(e.flags ?? []).map(f => `획득: ${flagName(f)}`),
    ...(e.items ?? []).map(i => `아이템: ${flagName(i)}`),
  ]
}

function sceneTopic(id: string): Topic {
  const scene = scenes[id]
  const seenId = sceneTopicIds.get(id)
  if (seenId) {
    const ref = topic(`↪ ${sceneTitle(scene)}`, {}, 'ref')
    relationships.push({ id: newId(), end1Id: ref.id, end2Id: seenId })
    return ref
  }
  const notes = scene.blocks
    .map(b => (b.kind === 'line' ? `${b.speaker}: ${b.text}` : b.note ? `${b.text}\n${b.note}` : b.text))
    .join('\n\n')
  const t = topic(sceneTitle(scene), { notes: { plain: { content: notes } } }, scene.ending ? 'ending' : undefined)
  sceneTopicIds.set(id, t.id)
  const labels = effectLabels(scene.effects)
  if (labels.length) t.labels = labels
  const kids = scene.choices.map(choiceTopic)
  if (kids.length) t.children = { attached: kids }
  return t
}

function choiceTopic(c: Choice): Topic {
  const check = c.target ? ` (${c.stat ? `${STAT_NAMES[c.stat]} 판정, ` : ''}목표 ${c.target})` : ''
  const title = `${c.trait ? `[${c.trait}] ` : ''}${c.text}${check}`
  const labels = [
    ...(c.requires ?? []).map(f => `필요: ${flagName(f)}`),
    ...(c.minOf ? [`필요: ${c.minOf.of.map(flagName).join(', ')} 중 ${c.minOf.count}개 이상`] : []),
    ...(c.excludes ?? []).map(f => `없어야 함: ${flagName(f)}`),
    ...effectLabels(c.effects),
  ]
  const t = topic(title, labels.length ? { labels } : {}, c.trait ? 'trait' : undefined)
  // 판정 선택지는 성공/실패 두 갈래로 펼친다
  const kids =
    c.target === undefined
      ? [sceneTopic(c.next)]
      : [
          topic('성공', { children: { attached: [sceneTopic(c.next)] } }, 'success'),
          topic('실패', { children: { attached: [sceneTopic(c.failNext ?? c.next)] } }, 'fail'),
        ]
  t.children = { attached: kids }
  return t
}

// 무압축(stored) ZIP. 파일명은 UTF-8 플래그로 기록
function zip(files: Record<string, string>): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  const DOS_DATE_1980_01_01 = 33
  for (const [name, text] of Object.entries(files)) {
    const data = Buffer.from(text, 'utf8')
    const nameBuf = Buffer.from(name, 'utf8')
    const crc = crc32(data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(DOS_DATE_1980_01_01, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(DOS_DATE_1980_01_01, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt32LE(offset, 42)

    locals.push(local, nameBuf, data)
    centrals.push(central, nameBuf)
    offset += local.length + nameBuf.length + data.length
  }
  const centralDir = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(files).length, 8)
  end.writeUInt16LE(Object.keys(files).length, 10)
  end.writeUInt32LE(centralDir.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, centralDir, end])
}

const root = topic('선택지 게임 스토리 (story.ts 자동 생성)', {
  structureClass: 'org.xmind.ui.logic.right',
  children: { attached: [sceneTopic(START)] },
})

const unreachable = Object.keys(scenes).filter(id => !sceneTopicIds.has(id))
if (unreachable.length) {
  root.children!.attached.push(topic('도달 불가 장면', { children: { attached: unreachable.map(sceneTopic) } }))
}

const content = [{ id: newId(), class: 'sheet', title: '스토리 분기', rootTopic: root, relationships }]
const out = zip({
  'content.json': JSON.stringify(content),
  'metadata.json': JSON.stringify({ creator: { name: 'choice-game', version: '1.0.0' } }),
  'manifest.json': JSON.stringify({ 'file-entries': { 'content.json': {}, 'metadata.json': {} } }),
})

mkdirSync('export', { recursive: true })
writeFileSync('export/story.xmind', out)
console.log(`export/story.xmind 생성 완료 (장면 ${sceneTopicIds.size}개, 관계선 ${relationships.length}개, 도달 불가 ${unreachable.length}개)`)
