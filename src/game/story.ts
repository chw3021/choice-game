import type { Item, Scene, Stats } from './engine.ts'

export const START = 'difficulty'

export const START_STATS: Stats = { hp: 8, mind: 8, hygiene: 6, money: 2 }

// 시작 소지품 이름·설명은 임시 초안이다. 기획 확정 시 교체한다.
export const START_ITEMS = ['rusty-sword', 'gambeson']

export const items: Record<string, Item> = {
  'rusty-sword': {
    name: '녹슨 장검',
    desc: '요새 병기고에서 받은 낡은 검. 날이 무디다. 체력 판정 +1',
    bonus: { stat: 'hp', value: 1 },
  },
  gambeson: { name: '누빈 갑옷', desc: '천을 겹겹이 누빈 경갑옷. 화살 한두 발은 버틴다.' },
  'royal-doc': { name: '왕실 비밀문서', desc: '왕실이 역병의 발생지를 숨기고 발굴을 계속했다는 증거.' },
  'church-secret': { name: '교회의 봉인된 기록', desc: '역병 이전에 작성된 치료제 제조법과 배합 비율.' },
}

// 백성 인카운터 성공 플래그. 2개 이상이면 [농민영웅] 개혁 엔딩 선택지가 열린다
const PEOPLE = ['people-siege', 'people-ward', 'people-granary']
const PEASANT_HERO = { of: PEOPLE, count: 2 }

// 엔딩 본문 중 왕실/교회/양쪽 비밀 분기는 기획 마인드맵(엔딩.xmind) 기준이다.
// 그 외 연결 장면 문구와 xmind에 본문이 없는 엔딩(외면, 역병의사의 치료제, 역병의 신비, 투기장의 제왕, 죽음)은
// 임시 초안이다. 기획 확정 시 교체한다.
const list: Scene[] = [
  {
    id: 'difficulty',
    blocks: [
      {
        kind: 'narration',
        text: '역병이 번지는 왕국. 이야기를 시작하기 전에 난이도를 선택하세요.',
        note: '악몽 난이도: 판정 보정치 -1, 숨겨진 인카운터 등장',
      },
    ],
    choices: [
      { text: '일반 난이도로 시작한다', next: 'siege' },
      { trait: '악몽', text: '악몽 난이도로 시작한다', next: 'siege', effects: { flags: ['nightmare'], mods: { '악몽 난이도': -1 } } },
    ],
  },
  {
    id: 'siege',
    image: 'battle',
    effects: { mods: { 공포: -1 } },
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
        stat: 'hp',
        next: 'siege-hero',
        failNext: 'siege-wounded',
        effects: { flags: ['people-siege'] },
      },
      {
        text: '남은 주민들과 성문을 몸으로 막는다',
        target: 2,
        stat: 'hp',
        next: 'siege-hold',
        failNext: 'siege-wounded',
        effects: { flags: ['people-siege'] },
      },
      { text: '주민들을 이끌고 지하 통로로 후퇴한다', next: 'tunnel', effects: { stats: { mind: -1 } } },
    ],
  },
  {
    id: 'siege-hero',
    effects: { stats: { hp: -2 }, mods: { 공포: 1 } },
    blocks: [
      {
        kind: 'narration',
        text: '홀로 성문 앞에 선 너를 보고 도망치던 주민들이 발걸음을 멈췄다. 적의 선봉이 무너지고, 사람들은 너를 농민의 영웅이라 부르기 시작했다.',
        note: '백성의 신뢰를 얻었다 · 공포 보정치 +1',
      },
    ],
    choices: [{ text: '요새를 수습한다', next: 'crossroads' }],
  },
  {
    id: 'siege-hold',
    effects: { stats: { hp: -1 } },
    blocks: [
      {
        kind: 'narration',
        text: '주민들과 함께 성문을 버텨냈다. 적은 물러났지만 요새는 반쯤 무너졌다.',
        note: '백성의 신뢰를 얻었다',
      },
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
      { text: '왕궁 기록보관소에 숨어든다', target: 7, stat: 'mind', next: 'royal-doc', failNext: 'caught', excludes: ['royal-doc'] },
      { text: '수도원 지하를 조사한다', target: 7, stat: 'mind', next: 'church-secret', failNext: 'caught', excludes: ['church-secret'] },
      { text: '역병 구역을 찾아간다', next: 'plague-ward', excludes: ['met-doctor'] },
      { text: '곡물 창고 앞 소란으로 향한다', next: 'granary', excludes: ['granary-done'] },
      { text: '투기장에 나간다', next: 'arena-1', excludes: ['arena-done'] },
      {
        trait: '악몽',
        text: '역병의 발생지, 고대 발굴현장으로 향한다',
        next: 'excavation',
        requires: ['nightmare', 'royal-doc'],
      },
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
    effects: { items: ['royal-doc'] },
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
    effects: { items: ['church-secret'] },
    blocks: [
      {
        kind: 'narration',
        text: '수도원 지하에서 봉인된 문서를 발견했다. 문서에는 역병 환자를 치료하는 약의 제조법과 배합 비율이 상세히 기록되어 있다. 문서의 작성 날짜는 역병이 처음 퍼지기 수년 전이었다. 교회는 치료제를 만들 수 있었지만, 그 지식을 독점해 왔다.',
        note: '교회의 봉인된 기록 획득',
      },
    ],
    choices: [{ text: '돌아간다', next: 'crossroads' }],
  },
  // 백성 인카운터: 역병 구역 (역병의사와의 만남 + 진 개혁 조건)
  {
    id: 'plague-ward',
    effects: { flags: ['met-doctor'] },
    blocks: [
      {
        kind: 'narration',
        text: '역병 구역은 봉쇄된 채 버려져 있었다. 신음 소리 사이로 새 부리 가면을 쓴 사람이 홀로 환자들을 돌보고 있다.',
      },
      {
        kind: 'line',
        speaker: '역병의사',
        tag: '가면 너머의 목소리',
        text: '"치료법만 있다면… 이 사람들을 살릴 수 있을 텐데."',
      },
    ],
    choices: [
      {
        text: '역병의사를 도와 환자들을 돌본다',
        target: 6,
        stat: 'hygiene',
        next: 'ward-saved',
        failNext: 'ward-failed',
        effects: { flags: ['people-ward'] },
      },
      { text: '자리를 뜬다', next: 'crossroads' },
    ],
  },
  {
    id: 'ward-saved',
    effects: { stats: { hygiene: -2 } },
    blocks: [
      {
        kind: 'narration',
        text: '밤새 환자들을 돌봤다. 몇몇은 고비를 넘겼고, 역병의사는 너를 기억하겠다고 했다.',
        note: '백성의 신뢰를 얻었다 · 역병 피해 지역의 백성을 구했다',
      },
    ],
    choices: [{ text: '돌아간다', next: 'crossroads' }],
  },
  {
    id: 'ward-failed',
    effects: { stats: { hygiene: -2, hp: -1 } },
    blocks: [{ kind: 'narration', text: '손쓸 틈도 없이 환자들이 숨을 거뒀다. 너도 밤새 열에 시달렸다.' }],
    choices: [{ text: '돌아간다', next: 'crossroads' }],
  },
  // 백성 인카운터: 곡물 창고
  {
    id: 'granary',
    effects: { flags: ['granary-done'] },
    blocks: [
      {
        kind: 'narration',
        text: '굶주린 백성들이 곡물 창고로 몰려들었다. 창고지기는 귀족의 명령이라며 문을 걸어 잠갔고, 경비병들이 창을 겨누고 있다.',
      },
    ],
    choices: [
      {
        trait: '설득',
        text: '양쪽 사이에 서서 곡물을 나누자고 설득한다',
        target: 7,
        stat: 'mind',
        next: 'granary-calm',
        failNext: 'granary-riot',
        effects: { flags: ['people-granary'] },
      },
      { text: '자리를 피한다', next: 'crossroads' },
    ],
  },
  {
    id: 'granary-calm',
    effects: { stats: { mind: 1 } },
    blocks: [
      {
        kind: 'narration',
        text: '창고 문이 열리고 곡물이 공평하게 나뉘었다. 백성들은 네 이름을 기억했다.',
        note: '백성의 신뢰를 얻었다',
      },
    ],
    choices: [{ text: '돌아간다', next: 'crossroads' }],
  },
  {
    id: 'granary-riot',
    effects: { stats: { hp: -2 } },
    blocks: [{ kind: 'narration', text: '설득은 실패했다. 창이 휘둘러지고, 너는 군중에 휩쓸려 다쳤다.' }],
    choices: [{ text: '돌아간다', next: 'crossroads' }],
  },
  // 투기장: 3연승하면 투기장의 제왕 엔딩, 한 번이라도 지면 다시 도전할 수 없다
  {
    id: 'arena-1',
    blocks: [
      {
        kind: 'narration',
        text: '수도 외곽의 투기장. 역병으로 일자리를 잃은 자들이 마지막 밑천으로 피를 판다. 세 번을 이기면 금화와 명성이 주어진다.',
      },
    ],
    choices: [
      { text: '첫 상대와 맞선다', target: 6, stat: 'hp', next: 'arena-2', failNext: 'arena-lost' },
      { text: '돌아간다', next: 'crossroads' },
    ],
  },
  {
    id: 'arena-2',
    effects: { stats: { hp: -1 } },
    blocks: [
      { kind: 'narration', text: '첫 상대가 쓰러졌다. 관중의 함성이 커진다. 다음 상대는 전직 용병이다.' },
    ],
    choices: [{ text: '용병과 맞선다', target: 8, stat: 'hp', next: 'arena-3', failNext: 'arena-lost' }],
  },
  {
    id: 'arena-3',
    effects: { stats: { hp: -1 } },
    blocks: [
      { kind: 'narration', text: '결승. 투기장의 현 챔피언이 모래 위로 걸어 나온다.' },
      {
        kind: 'line',
        speaker: '투기장 챔피언',
        tag: '결승전',
        text: '"여기까지 온 건 칭찬해 주지. 하지만 여기서 끝이다."',
      },
    ],
    choices: [{ trait: '용감함', text: '챔피언과 맞선다', target: 9, stat: 'hp', next: 'end-arena', failNext: 'arena-lost' }],
  },
  {
    id: 'arena-lost',
    effects: { flags: ['arena-done'], stats: { hp: -2, money: -1 } },
    blocks: [{ kind: 'narration', text: '모래 위에 쓰러졌다. 판돈을 잃고 겨우 투기장을 빠져나왔다.' }],
    choices: [{ text: '돌아간다', next: 'crossroads' }],
  },
  // 악몽 난이도 전용: 왕실 비밀문서에 적힌 발굴현장
  {
    id: 'excavation',
    blocks: [
      {
        kind: 'narration',
        text: '왕실 문서에 적힌 위치를 따라 도달한 미개척지. 발굴은 멈추지 않았다. 갱도 깊은 곳에서 역병의 근원이 숨 쉬고 있다.',
      },
    ],
    choices: [
      { trait: '용감함', text: '역병의 근원과 맞선다', target: 10, stat: 'mind', next: 'end-nightmare', failNext: 'end-dead' },
      { text: '물러난다', next: 'crossroads' },
    ],
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
      { text: '왕가에 보고한다', next: 'church-hunt', requires: ['church-secret'], excludes: ['royal-doc'] },
      {
        text: '이전에 만났던 역병의사에게 치료법을 알려준다',
        next: 'doctor-chase-1',
        requires: ['church-secret', 'met-doctor'],
        excludes: ['royal-doc'],
      },
      // 둘 다 보유
      { text: '왕좌에 앉는다', next: 'end-tyrant', requires: ['royal-doc', 'church-secret'] },
      { text: '모든 체제를 무너뜨린다', next: 'end-anarchy', requires: ['royal-doc', 'church-secret'] },
      // 개혁: 역병 피해 지역의 백성을 구했으면 진 개혁, 아니면 일반 개혁
      {
        trait: '농민영웅',
        text: '백성을 위한 개혁을 일으킨다',
        next: 'end-true-reform',
        requires: ['royal-doc', 'church-secret', 'people-ward'],
        minOf: PEASANT_HERO,
      },
      {
        trait: '농민영웅',
        text: '백성을 위한 개혁을 일으킨다',
        next: 'end-reform',
        requires: ['royal-doc', 'church-secret'],
        excludes: ['people-ward'],
        minOf: PEASANT_HERO,
      },
      { text: '못본척 지나간다', next: 'end-silence' },
    ],
  },
  // 왕가에 보고: 왕가의 보호가 닿기 전까지 교회의 추격에서 살아남아야 한다
  {
    id: 'church-hunt',
    blocks: [
      {
        kind: 'narration',
        text: '교회가 치료제 제작법을 숨기고 있다는 것을 왕가에 알렸다. 그날 밤부터 교회의 이단심문관들이 너를 쫓기 시작했다. 왕가의 보호가 닿기 전까지 살아남아야 한다.',
      },
    ],
    choices: [
      { text: '뒷골목으로 달아난다', target: 7, stat: 'hp', next: 'end-royal-power', failNext: 'end-dead' },
      { trait: '용감함', text: '추격자들을 기다렸다가 맞선다', target: 8, stat: 'hp', next: 'end-royal-power', failNext: 'end-dead' },
    ],
  },
  // 역병의사에게 치료법 전달: 왕국과 교회 양쪽의 추격을 두 번 연속 버텨야 한다
  {
    id: 'doctor-chase-1',
    effects: { stats: { hygiene: -2 } },
    blocks: [
      {
        kind: 'narration',
        text: '역병의사에게 치료법을 넘겼다. 이제 왕국과 교회 모두가 너를 쫓는다. 살아남아야 한다.',
      },
    ],
    choices: [{ text: '하수도로 숨어든다', target: 8, stat: 'hygiene', next: 'doctor-chase-2', failNext: 'end-dead' }],
  },
  {
    id: 'doctor-chase-2',
    blocks: [
      { kind: 'narration', text: '하수도를 빠져나오자 왕국 기사단과 교회 심문관이 양쪽에서 길을 막았다.' },
    ],
    choices: [{ trait: '용감함', text: '포위를 뚫는다', target: 9, stat: 'hp', next: 'end-doctor', failNext: 'end-dead' }],
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
        text: '교회는 축소되고 숙청당하며, 왕가는 엄청난 권력을 얻는다. 교회는 부패했지만, 지방의 치료소와 약초 공급망을 운영하던 조직이기도 했다. 왕가는 교회를 숙청하면서 치료사까지 처형하거나 추방하고, 각지에 흩어진 제조 기록과 재료 공급망도 파괴한다. 치료제는 왕가의 권력 유지 수단이 된다.',
      },
      {
        kind: 'narration',
        text: '왕가는 치료제 제작법을 확보하지만, 이를 백성에게 무료로 나눠 주지 않는다. 충성하는 영주와 군대에 먼저 공급하고, 백성에게는 무거운 세금이나 복종을 대가로 요구한다. 왕권은 이전보다 더욱 막강해졌고, 인류는 역병을 극복했다. 그럼에도 백성은 고통받는다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-doctor',
    ending: '역병의사의 치료제',
    blocks: [
      {
        kind: 'narration',
        text: '역병의사는 치료제를 만들어 신분을 가리지 않고 나눠 주었다. 왕국도 교회도 더는 치료법을 독점할 수 없었다. 너는 이름을 버리고 숨어 살아야 했지만, 역병은 조금씩 물러가기 시작했다.',
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
        text: '왕실의 비밀문서와 교회의 봉인된 기록을 확보한 플레이어는 역병 피해 지역의 백성을 구하고, 치료제 제조법을 복원하는 데 성공한다. 치료제는 더 이상 교회의 허가나 귀족의 재산에 따라 배급되지 않는다.',
      },
      {
        kind: 'narration',
        text: '진실이 공개되자 백성들은 개혁을 지지하고, 일부 귀족과 군 지휘관도 무력 충돌 대신 새로운 통치 체제에 동참한다. 왕실과 교회의 특권은 제한되고, 곡물과 세금의 흐름은 공개적으로 관리되기 시작한다.',
      },
      {
        kind: 'narration',
        text: '역병은 하루아침에 사라지지 않았지만, 더는 감춰진 재앙이 아니었다. 치료법과 정보가 사람들에게 공유되면서 피해는 서서히 줄어들었다.',
      },
      {
        kind: 'narration',
        text: '무너진 옛 질서의 폐허 위에 새로운 나라가 세워졌다. 그 나라가 영원히 정의로울지는 아무도 알 수 없었지만, 적어도 이제 백성들은 자신들의 운명을 결정할 권리를 갖게 되었다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-nightmare',
    ending: '역병의 신비',
    blocks: [
      {
        kind: 'narration',
        text: '역병의 근원이 무너져 내렸다. 발굴현장에 잠들어 있던 고대의 재앙은 다시 땅속 깊이 봉인되었다. 이 사실을 아는 사람은 아무도 없다. 오직 너만이 역병이 어디서 왔는지 기억한다.',
      },
    ],
    choices: [],
  },
  {
    id: 'end-arena',
    ending: '투기장의 제왕',
    blocks: [
      {
        kind: 'narration',
        text: '챔피언이 모래 위에 쓰러졌다. 관중이 네 이름을 연호한다. 왕실도 교회도 아닌, 피와 모래 위에서 너는 왕이 되었다.',
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
  {
    id: 'end-dead',
    ending: '죽음',
    blocks: [
      { kind: 'narration', text: '더는 버틸 수 없었다. 네가 쥐고 있던 진실도 함께 어둠 속에 묻혔다.' },
    ],
    choices: [],
  },
]

export const scenes: Record<string, Scene> = Object.fromEntries(list.map(s => [s.id, s]))
