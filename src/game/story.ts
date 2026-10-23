import type { Scene, Stats } from './engine.ts'

export const START = 'siege'

export const START_STATS: Stats = { hp: 8, mind: 8, hygiene: 6, money: 2 }

// 연결 장면 문구(siege-* / tunnel / crossroads / decision / end-silence / end-fugitive)는 임시 초안이다.
// 기획 확정 시 교체한다. 엔딩 본문은 기획 마인드맵(엔딩.xmind) 기준이다.
const list: Scene[] = [
  {
    id: 'siege',
    image: 'battle',
    effects: { modifier: -1 },
    blocks: [
      {
        kind: 'narration',
        text: '성문 너머에서 비명이 그쳤다. 거대한 암흑 세력의 군대가 마침내 요새 외벽을 뚫었다. 병사들은 흩어지고, 너는 홀로 피로 물든 성벽 위에 남겨졌다. 차현욱이 외쳤다.',
      },
      {
        kind: 'line',
        speaker: '기사단장 차현욱',
        tag: '전장의 외침',
        text: '"이놈들을 막아라! 너희가 버티지 않으면 이 요새는 오늘 밤 재가 된다!"',
      },
      {
        kind: 'narration',
        text: '외침이 끝남과 동시에 거암세 병사의 화살이 파공성을 흩뿌리며 날아와 차현욱은 목에 화살을 맞고 성벽 밑으로 떨어졌다. 그 모습을 목격한 주민들은 공포에 질려 혼비백산해서 도망가기 시작한다.',
        note: '공포 보정치 -1',
      },
    ],
    choices: [
      {
        trait: '용감함',
        text: '성문을 열고 홀로 군대와 맞선다',
        target: 6,
        next: 'siege-hero',
        failNext: 'siege-wounded',
        effects: { flags: ['peasant-hero'] },
      },
      { text: '남은 주민들과 성문을 몸으로 막는다', target: 2, next: 'siege-hold', failNext: 'siege-wounded' },
      { text: '주민들을 이끌고 지하 통로로 후퇴한다', next: 'tunnel', effects: { stats: { mind: -1 } } },
    ],
  },
  {
    id: 'siege-hero',
    effects: { stats: { hp: -2 }, modifier: 1 },
    blocks: [
      {
        kind: 'narration',
        text: '홀로 성문 앞에 선 너를 보고 도망치던 주민들이 발걸음을 멈췄다. 적의 선봉이 무너지고, 사람들은 너를 농민의 영웅이라 부르기 시작했다.',
        note: '칭호 획득: 농민영웅 · 공포 보정치 +1',
      },
    ],
    choices: [{ text: '요새를 수습한다', next: 'crossroads' }],
  },
  {
    id: 'siege-hold',
    effects: { stats: { hp: -1 } },
    blocks: [
      { kind: 'narration', text: '주민들과 함께 성문을 버텨냈다. 적은 물러났지만 요새는 반쯤 무너졌다.' },
    ],
    choices: [{ text: '요새를 수습한다', next: 'crossroads' }],
  },
  {
    id: 'siege-wounded',
    effects: { stats: { hp: -3, mind: -1 } },
    blocks: [
      { kind: 'narration', text: '버티지 못했다. 정신을 차렸을 때 너는 잔해 아래에 깔려 있었다.' },
    ],
    choices: [{ text: '몸을 일으킨다', next: 'crossroads' }],
  },
  {
    id: 'tunnel',
    effects: { stats: { hygiene: -2 } },
    blocks: [
      { kind: 'narration', text: '오물이 고인 지하 통로를 지나 주민들과 함께 수도로 빠져나왔다.' },
    ],
    choices: [{ text: '수도를 둘러본다', next: 'crossroads' }],
  },
  {
    id: 'crossroads',
    blocks: [
      {
        kind: 'narration',
        text: '역병이 번지는 수도. 왕실도 교회도 무언가를 숨기고 있다. 어디부터 파고들까.',
      },
    ],
    choices: [
      { text: '왕궁 기록보관소에 숨어든다', target: 7, next: 'royal-doc', failNext: 'caught', excludes: ['royal-doc'] },
      { text: '수도원 지하를 조사한다', target: 7, next: 'church-secret', failNext: 'caught', excludes: ['church-secret'] },
      { text: '결단을 내린다', next: 'decision' },
    ],
  },
  {
    id: 'caught',
    effects: { stats: { hp: -2, money: -1 } },
    blocks: [{ kind: 'narration', text: '경비에게 들켜 겨우 도망쳤다. 뇌물로 입을 막느라 주머니가 가벼워졌다.' }],
    choices: [{ text: '돌아간다', next: 'crossroads' }],
  },
  {
    id: 'royal-doc',
    effects: { flags: ['royal-doc'] },
    blocks: [
      {
        kind: 'narration',
        text: '왕실의 비밀문서를 입수했다. 왕실이 역병의 발생지를 숨기고 발굴작업을 계속 지속시켰다는 증거가 적혀있다. 이 사실을 공개하면 왕실은 크게 약해질 것이다. 하지만 왕실이 무너지면 국경 방어와 중앙 행정에도 차질이 생길 수 있다.',
        note: '왕실 비밀문서 획득',
      },
    ],
    choices: [{ text: '돌아간다', next: 'crossroads' }],
  },
  {
    id: 'church-secret',
    effects: { flags: ['church-secret'] },
    blocks: [
      {
        kind: 'narration',
        text: '수도원 지하에서 봉인된 문서를 발견했다. 문서에는 역병 환자를 치료하는 약의 제조법과 배합 비율이 상세히 기록되어 있다. 문서의 작성 날짜는 역병이 처음 퍼지기 수년 전이었다. 교회는 치료제를 만들 수 있었지만, 그 지식을 독점해 왔다.',
        note: '교회의 비밀 획득',
      },
    ],
    choices: [{ text: '돌아간다', next: 'crossroads' }],
  },
  {
    id: 'decision',
    blocks: [{ kind: 'narration', text: '손에 쥔 진실을 어떻게 쓸 것인가.' }],
    choices: [
      // 왕실 비밀문서만 보유
      { text: '장부를 불태우고 왕실을 지지한다', next: 'end-royal-loyal', requires: ['royal-doc'], excludes: ['church-secret'] },
      { text: '장부를 교회에게 넘긴다', next: 'end-church-ally', requires: ['royal-doc'], excludes: ['church-secret'] },
      // 교회의 비밀만 보유
      { text: '교회에 거래한다', next: 'end-church-ally', requires: ['church-secret'], excludes: ['royal-doc'] },
      { text: '왕가에 보고한다', next: 'end-royal-power', requires: ['church-secret'], excludes: ['royal-doc'] },
      { text: '이전에 만났던 역병의사에게 치료법을 알려준다', next: 'end-fugitive', requires: ['church-secret'], excludes: ['royal-doc'] },
      // 둘 다 보유
      { text: '왕좌에 앉는다', next: 'end-tyrant', requires: ['royal-doc', 'church-secret'] },
      { text: '모든 체제를 무너뜨린다', next: 'end-anarchy', requires: ['royal-doc', 'church-secret'] },
      {
        trait: '농민영웅',
        text: '백성을 위한 개혁을 일으킨다',
        target: 7,
        next: 'end-true-reform',
        failNext: 'end-reform',
        requires: ['royal-doc', 'church-secret', 'peasant-hero'],
      },
      { text: '못본척 지나간다', next: 'end-silence' },
    ],
  },
  {
    id: 'end-royal-loyal',
    ending: '왕실의 수호자',
    blocks: [
      {
        kind: 'narration',
        text: '플레이어는 왕실의 부패를 알게 된 뒤에도 왕가를 지지한다. 왕실의 정통성을 지키고, 반란을 진압하며, 교회와 귀족들의 독립적인 세력 확대를 견제한다. 왕국은 일단 통합된 상태를 유지하지만, 왕실의 부패는 계속된다. 왕국을 지키기 위해 왕을 지켰지만, 왕국이 무엇을 위해 존재하는지는 잊었다. 역병의 문제는 해결했지만 부조리와 착취는 계속된다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-church-ally',
    ending: '이단재판소장',
    blocks: [
      {
        kind: 'narration',
        text: '플레이어는 왕실을 불신하고 교회와 손을 잡는다. 교회는 역병의 비밀과 치료제를 독점한 대가로 플레이어에게 정통성과 지원을 약속한다. 플레이어는 이단재판소장으로서 엄청난 권력을 누린다. 교회의 영향력으로 질서를 유지하고, 역병에 대한 정보와 치료 자원을 통제한다. 하지만 진실을 공개하면 교회가 무너질 수 있기 때문에 은폐에 협조하게 된다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-royal-power',
    ending: '왕권의 치료제',
    blocks: [
      {
        kind: 'narration',
        text: '교회가 치료제 제작법을 숨기고 있다는 것을 왕가에 알린다. 교회는 축소되고 숙청당하며, 왕가는 엄청난 권력을 얻는다. 왕가는 교회를 숙청하면서 치료사까지 처형하거나 추방하고, 각지에 흩어진 제조 기록과 재료 공급망도 파괴한다. 치료제는 왕가의 권력 유지 수단이 된다. 충성하는 영주와 군대에 먼저 공급하고, 백성에게는 무거운 세금이나 복종을 대가로 요구한다. 인류는 역병을 극복했다. 그럼에도 백성은 고통받는다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-fugitive',
    ending: '쫓기는 자',
    blocks: [
      {
        kind: 'narration',
        text: '역병의사에게 치료법을 넘겼다. 이제 왕국과 교회 모두가 너를 쫓는다. 살아남아야 한다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-tyrant',
    ending: '왕좌',
    blocks: [
      {
        kind: 'narration',
        text: '플레이어는 왕실도, 교회도, 귀족도 믿지 않는다. 모든 세력이 자신의 이익만을 추구한다는 사실을 깨닫고, 그들 모두를 제거하거나 굴복시키기로 한다. 왕실의 약점을 이용해 왕위를 빼앗고, 교회의 정보망을 장악하며, 반항하는 귀족들의 군대를 흡수한다. 견제하는 세력이 없는 완전한 독재를 이룬다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-anarchy',
    ending: '아나키즘',
    blocks: [{ kind: 'narration', text: '모든 체제가 파괴되었다. 한동안 혼란이 지속된다.' }],
    choices: [],
  },
  {
    id: 'end-reform',
    ending: '개혁',
    blocks: [
      {
        kind: 'narration',
        text: '플레이어는 왕실과 교회, 귀족들의 특권을 제한하고 백성을 위한 개혁을 추진한다. 곡물과 세금의 흐름을 바로잡고, 부패한 관리들을 처벌하며, 역병의 정보를 공개한다. 개혁이 성공하면 백성의 권리가 보장되는 새로운 질서가 시작된다. 다만 역병은 완전히 사라지지 않았고, 새 체제가 살아남을 수 있을지는 아직 알 수 없다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-true-reform',
    ending: '진 개혁',
    blocks: [
      {
        kind: 'narration',
        text: '왕실의 비밀문서와 교회의 봉인된 기록을 확보한 플레이어는 역병 피해 지역의 백성을 구하고, 치료제 제조법을 복원하는 데 성공한다. 치료제는 더 이상 교회의 허가나 귀족의 재산에 따라 배급되지 않는다. 진실이 공개되자 백성들은 개혁을 지지하고, 일부 귀족과 군 지휘관도 무력 충돌 대신 새로운 통치 체제에 동참한다.',
      },
      {
        kind: 'narration',
        text: '무너진 옛 질서의 폐허 위에 새로운 나라가 세워졌다. 그 나라가 영원히 정의로울지는 아무도 알 수 없었지만, 적어도 이제 백성들은 자신들의 운명을 결정할 권리를 갖게 되었다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-silence',
    ending: '외면',
    blocks: [
      { kind: 'narration', text: '너는 아무것도 보지 못한 척 고개를 돌렸다. 역병은 계속 퍼지고, 진실은 다시 어둠 속에 묻혔다.' },
    ],
    choices: [],
  },
]

export const scenes: Record<string, Scene> = Object.fromEntries(list.map(s => [s.id, s]))
