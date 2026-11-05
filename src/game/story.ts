import { josa, type Block, type Choice, type Enemy, type Item, type Scene, type Stats } from './engine.ts'

export const START = 'difficulty'

export const START_STATS: Stats = { hp: 80, mind: 80, hygiene: 60, money: 2 }

// 시작 소지품은 알현실 궤짝에서 고른다
export const START_ITEMS: string[] = []

export const items: Record<string, Item> = {
  'tarnished-key': {
    name: '변색된 열쇠',
    desc: '검게 변색되었지만 장인의 솜씨로 새겨진 정교한 은세공품이다. 어딘가의 오래된 자물쇠에 맞을 것 같다.',
  },
  'sharp-sword': {
    name: '날카로운 칼',
    desc: '보기만 해도 날카로운 강철검이다. 칼날에 비친 모습만 봐도 섬뜩하다. 공격 +3',
    attack: 3,
  },
  'steel-shield': {
    name: '강철 방패',
    desc: '투박해 보이지만 오래된 전투의 흔적이 전 주인을 충실히 지켰음을 증명해 준다. 적의 공격을 40% 확률로 막지만, 막으면 손이 저려 그 전투 동안 공격 -4',
    block: { chance: 0.4, penalty: { label: '손 저림', value: -4 } },
  },
  'faded-gem': { name: '빛바랜 보석', desc: '어린아이들이 좋아할 것 같은 희미한 색의 돌이다. 어두운 곳에서는 보석처럼 보이기도 한다.' },
  'shabby-cloak': { name: '허름한 망토', desc: '군데군데 기운 자국이 있는 양모 망토이다. 오래 입어 낡았지만 온기가 느껴진다.' },
  'dull-sword': {
    name: '무딘 칼',
    desc: '오랜 사용으로 날이 무뎌진 강철검이다. 제대로 벼리기만 한다면 다시 전장에 나갈 수 있다. 공격 +2',
    attack: 2,
  },
  'wooden-shield': {
    name: '나무 방패',
    desc: '군데군데 못이 빠져나간 조악한 나무 방패다. 이것에 목숨을 맡길 일이 없으면 좋겠다. 적의 공격을 10% 확률로 막고, 못 막으면 부서진다',
    block: { chance: 0.1, breaks: true },
  },
  shovel: { name: '삽', desc: '손잡이가 닳아 반질거리는 삽이다.' },
  rope: { name: '밧줄', desc: '오래된 창고 냄새가 배어 있는 밧줄이다.' },
  pepper: {
    name: '후추통',
    desc: '찌그러진 왕실 문장이 음각된 철제 후추통이다. 왕실에 납품한 물건인 만큼 품질은 보장되어 있다. 전투에서 적의 눈에 뿌리면 한 번 공격을 막는다',
    blind: '후추통을 상대의 눈에 뿌린다',
  },
  'night-pass': {
    name: '야간 통행증',
    desc: '"본 증서를 소지한 자의 통행을 보장하고, 어떠한 부당한 제지나 위해도 가하지 말지어다." - 왕실 서기관청',
  },
  parasol: {
    name: '양산',
    desc: '한때는 귀부인들 사이에서 유행했겠지만, 빛이 바래 본래의 색조차 알기 어려운 촌스러운 양산이다. 공격 +1',
    attack: 1,
  },
  'bone-dice': { name: '뼈 주사위', desc: '알 수 없는 동물의 뼈로 만든 주사위다. 많은 손을 타서 눈금이 닳았고 기름기가 반질반질하다.' },
  'royal-doc': { name: '왕실 비밀문서', desc: '왕실이 역병의 발생지를 숨기고 발굴을 계속했다는 증거.' },
  'church-secret': { name: '교회의 봉인된 기록', desc: '역병 이전에 작성된 치료제 제조법과 배합 비율.' },
}

// 궤짝 아이템. 조사에 성공해야 귀한 물건이 섞여 나온다
const RARE = ['tarnished-key', 'sharp-sword', 'steel-shield']
const COMMON = ['faded-gem', 'shabby-cloak', 'dull-sword', 'wooden-shield', 'shovel', 'rope', 'pepper', 'night-pass', 'parasol', 'bone-dice']

// 시작 출신. 알현 장면에서 무작위 3개가 제시되고, 고르면 job-id 플래그와 기술(skill:이름) 플래그를 얻는다
const JOBS = [
  {
    id: 'urchin',
    name: '부랑아',
    skills: ['은신', '손재주'],
    desc: '불우한 어린 시절을 보내며 시궁창에서 살아남는 법을 터득했습니다. 소매치기와 담 넘기, 경비병의 순찰 시간을 외우는 일은 당신에게 숨 쉬는 것만큼 자연스럽습니다. 거리에서 터득한 지식을 활용하면 이 여정에서도 살아남을 수 있을 것입니다.',
    line: '이 나라엔 인재가 없단 말인가...',
  },
  {
    id: 'jester',
    name: '궁정광대',
    skills: ['공연', '곡예'],
    desc: '왕과 귀족의 유희를 위해서 살아가는 존재입니다. 웃음 뒤에 숨은 귀족들의 비밀을 누구보다 많이 들어 왔지만, 아무도 광대의 귀를 신경 쓰지 않았습니다. 누군가에겐 불행인 이 여정이 당신에게는 만인에게 기쁨을 줄 기회입니다.',
    line: '나만의 공연의 시작이다!',
  },
  {
    id: 'stranger',
    name: '이방인',
    skills: ['동물조련', '생존'],
    desc: '문명의 독에 의존하지 않고도 거친 야생에서 살아남는 법을 배웠습니다. 짐승의 발자국과 바람의 냄새가 당신에게는 어떤 지도보다 정확합니다. 야생의 예상치 못한 위험도 당신에게는 요람과 자장가입니다.',
    line: '새로운 사냥의 시작이군.',
  },
  {
    id: 'swindler',
    name: '사기꾼',
    skills: ['기만', '손재주'],
    desc: '허풍으로 왕궁에 입성한 속임수의 대가입니다. 가짜 작위와 가짜 공훈으로 쌓아 올린 지위는 한 번의 실수로도 무너질 수 있습니다. 왕궁에서의 지위를 지키기 위해 어쩔 수 없이 이 여정을 받아들입니다.',
    line: '거짓말과 도둑의 신이 함께하길!',
  },
  {
    id: 'noble',
    name: '몰락귀족',
    skills: ['협박', '화술'],
    desc: '지금은 권력 싸움에 밀려 몰락했지만, 과거 명문가에서 자랐기에 사람을 부리는 것에 능숙합니다. 가문의 영지는 정적의 손에 넘어갔고, 남은 것은 이름과 빛바랜 휘장뿐입니다. 이 여정으로 가문의 빛나는 재기를 꿈꿉니다.',
    line: '가문의 영광을 위해...',
  },
  {
    id: 'mercenary',
    name: '용병대장',
    skills: ['운동', '협박'],
    desc: '각종 전장에서 다져진 강골입니다. 특히 북부 산맥 확장 전쟁에서 선봉에 서서 활약한 경험이 있습니다. 왕실 발굴단의 호위를 맡았던 적도 있지만, 그때의 일은 떠올리고 싶지 않습니다. 이번 여정 또한 또 다른 전투일 뿐입니다.',
    line: '공짜 술은 조심해야 해...',
  },
  {
    id: 'scout',
    name: '정찰병',
    skills: ['조사', '운동'],
    desc: '험난한 산길과 깊은 숲을 누비며 위험 요소를 미리 파악하는 법을 익혔습니다. 동기들이 승진할 때도 당신은 늘 최전방의 숲속에 있었습니다. 왕께서 당신만이 할 수 있는 임무를 친히 내려 주신 것 같습니다. 아마도요.',
    line: '내겐 결정권이 없어.',
  },
  {
    id: 'priest',
    name: '사제',
    skills: ['역사', '종교'],
    desc: '평생을 교회에 봉사하며 신에게 헌신하며 살았습니다. 오래된 경전과 왕국의 연대기를 누구보다 깊이 읽어 왔습니다. 이 여정도 분명히 위대한 그분의 의도겠지요?',
    line: '위대한 그분의 뜻대로.',
  },
]

// 백성 인카운터 성공 플래그. 2개 이상이면 [농민영웅] 개혁 엔딩 선택지가 열린다
const PEOPLE = ['people-ward', 'people-granary', 'people-well']
const PEASANT_HERO = { of: PEOPLE, count: 2 }

const GUARD: Enemy = { name: '경비병', hp: 2, defense: 11, attack: 3, damage: 15 }
const GUARDS: Enemy = { name: '경비병 두 명', hp: 3, defense: 10, attack: 5, damage: 15 }

// 프롤로그·알현·궤짝·직업 인카운터·왕성 잠입·엔딩 본문은 기획 마인드맵(엔딩.pdf) 기준이다.
// 마인드맵에 '하위 주제'로 비어 있던 결과, 직업·아이템 추가 선택지, 빈민가 우물, 투기장 내기, 고문 엔딩 등은
// 임시 초안이다. 기획 확정 시 교체한다.

// 분기 내보내기(scripts/export-xmind.ts)용 플래그 표시 이름. 아이템 이름은 items에서 가져온다
export const FLAG_NAMES: Record<string, string> = {
  nightmare: '악몽 난이도',
  'chest-talked': '궤짝 화술 실패',
  stolen: '궤짝 물건 빼돌림',
  expelled: '왕궁에서 쫓겨남',
  'met-doctor': '역병의사 만남',
  'granary-done': '곡물 창고 방문',
  'well-done': '빈민가 우물 방문',
  'arena-done': '투기장 참전',
  'dice-done': '투기장 내기',
  'people-ward': '백성 인카운터 성공(역병 구역)',
  'people-granary': '백성 인카운터 성공(곡물 창고)',
  'people-well': '백성 인카운터 성공(빈민가 우물)',
  ...Object.fromEntries(JOBS.map(j => [`job-${j.id}`, `출신: ${j.name}`])),
}

const n = (text: string, note?: string): Block => (note ? { kind: 'narration', text, note } : { kind: 'narration', text })
const say = (speaker: string, text: string, tag?: string): Block =>
  tag ? { kind: 'line', speaker, tag, text } : { kind: 'line', speaker, text }

const KING = '황금왕'
const GUARD_NAME = '왕성 경비병'

const pickItems = (ids: string[], group: string, next: string, trait?: string): Choice[] =>
  ids.map(id => ({
    text: `${josa(items[id].name, '을', '를')} 챙긴다`,
    trait,
    group,
    next,
    excludes: [id],
    effects: { items: [id] },
  }))

const search: Choice = { skill: '조사', target: 10, text: '물건들을 뒤져본다', next: 'chest-search-ok', failNext: 'chest-search-fail' }
const toDepart: Choice = { text: '해야 할 일은 변하지 않는다', next: 'depart' }
const leave: Choice = { text: '돌아간다', next: 'crossroads' }
const fightOne: Choice = { text: '전투: 경비병과 싸운다', next: 'palace-fight-1' }

const list: Scene[] = [
  {
    id: 'difficulty',
    blocks: [
      n('역병이 번지는 왕국. 이야기를 시작하기 전에 난이도를 선택하세요.', '악몽 난이도: 판정 보정치 -2, 숨겨진 인카운터 등장'),
    ],
    choices: [
      { text: '일반 난이도로 시작한다', next: 'prologue-1' },
      { trait: '악몽', text: '악몽 난이도로 시작한다', next: 'prologue-1', effects: { flags: ['nightmare'], mods: { '악몽 난이도': -2 } } },
    ],
  },
  // 프롤로그: 영웅왕의 연대기
  {
    id: 'prologue-1',
    blocks: [
      n('날카로운 산봉우리들이 하늘을 찌르는 아르켄 산맥. 그 남쪽 기슭에는 오랫동안 역사의 변방에 머물러 있던 작은 나라, 벨카르 공국이 자리하고 있었다.'),
      n('한때 벨카르는 주변의 여러 공국과 후국들 사이에서 명맥만을 유지하던 보잘것없는 소국에 불과했다. 그러나 한 인물의 등장으로 모든 것이 바뀌었다. 훗날 역사에 영웅왕이라 기록될 인물, 카이론 벨카르 공작.'),
      n('그는 탁월한 통치력과 군사적 재능, 그리고 누구도 예상하지 못한 결단력으로 벨카르 공국을 변모시켰다. 변변찮던 군대는 대륙 남부에서도 손꼽히는 정예군으로 거듭났으며, 침체되었던 경제는 주변 국가들이 경계할 만큼 빠르게 성장했다.'),
      n('하지만 사람들은 한 가지 의문을 품었다. 대체 어떻게 하면 한 인간이 보잘것없는 영지를 그토록 빠르게 번영시킬 수 있는가. 일부는 그의 천재적인 통찰력을 칭송했지만, 일부는 그가 인간의 힘만으로는 얻을 수 없는 무언가를 손에 넣었다고 의심했다.'),
      n('카이론은 이웃 공국과 후국들을 차례로 압박하고, 때로는 협상으로, 때로는 무력으로 굴복시켰다. 그리고 마침내 영웅왕력 원년, 복속한 영지와 세력들을 하나로 묶어 새로운 국가의 탄생을 선포했다. 벨카르 왕국의 성립이었다.'),
    ],
    choices: [{ text: '책장을 넘긴다', next: 'prologue-2' }],
  },
  {
    id: 'prologue-2',
    blocks: [
      n('그의 통치 아래 왕국은 전례 없는 번영을 누렸다. 사람들은 그를 영웅이라 불렀으며, 후대의 역사가들은 그의 치세를 왕국의 황금기라 기록했다. 그러나 영광은 오래가지 못했다.'),
      n('왕국 성립 이후 불과 몇 년, 영웅왕 카이론은 돌연 자취를 감추었다. 그의 실종을 둘러싼 수많은 추측이 난무했으나, 끝내 진실을 밝혀낸 자는 없었다.'),
      n('굳건하던 왕권은 서서히 쇠퇴했고, 왕실은 권력 다툼과 사치에 빠져들었다. 외부에서는 새로운 강대국들이 세력을 확장했고, 내부에서는 교회가 신앙이라는 이름 아래 왕국의 정치와 민심에 깊숙이 뿌리를 내렸다.'),
      n('설상가상으로 검은 죽음이라 불리는 정체불명의 역병까지 창궐했다. 마을은 텅 비었고, 도시는 시체와 비명으로 가득 찼다. 굶주린 백성들은 왕실과 귀족들에게 등을 돌리기 시작했다. 그렇게 영웅왕의 시대가 저물고, 몰락의 시대가 찾아왔다.'),
    ],
    choices: [{ text: '책장을 넘긴다', next: 'prologue-3' }],
  },
  {
    id: 'prologue-3',
    blocks: [
      n('부름에 답하라.'),
      n('영웅왕력 142년 4월. 벨카르 왕국의 제4대 국왕, 황금왕이 그대를 왕도로 소환한다.'),
      n('왕국은 위태롭고, 권력은 갈라졌으며, 죽음은 국경과 신분을 가리지 않는다. 영웅왕이 남긴 유산은 아직 이 땅에 남아 있다. 그러나 그것을 지킬 자가 있는가?'),
      n('이제 그대의 이야기가 시작된다.'),
    ],
    choices: [{ text: '왕도로 향한다', next: 'audience' }],
  },
  // 알현: 무작위 3개 출신 중 하나를 고른다
  {
    id: 'audience',
    portrait: 'king',
    blocks: [
      n('왕좌에 앉은 국왕은 예전보다 훨씬 늙고 지쳐 보였다. 황금왕이라는 이명과 달리, 그의 얼굴에는 쇠락해 가는 왕국의 무게와 오랜 근심이 짙게 드리워져 있었다.'),
      n('그의 뒤편에 걸린 거대한 왕국 지도에는 이미 검은색으로 물든 영토가 절반을 넘어가고 있었다. 왕은 한참 동안 당신을 바라보다가 입을 열었다.'),
      say(KING, '"그대는 누구인가? 병마로 고통받는 왕국을 구할 수 있겠는가?"', '몰락해 가는 왕국의 왕'),
      n('당신은 누구입니까?'),
    ],
    pick: { job: 3 },
    choices: JOBS.map(j => ({
      text: `${j.name} (${j.skills.join(', ')})`,
      group: 'job',
      next: `job-${j.id}`,
      effects: { flags: [`job-${j.id}`, ...j.skills.map(s => `skill:${s}`)] },
    })),
  },
  ...JOBS.map(
    (j): Scene => ({
      id: `job-${j.id}`,
      portrait: `job-${j.id}`,
      blocks: [n(j.desc, `${j.name} · 숙련 기술: ${j.skills.join(', ')}`)],
      choices: [{ text: j.line, next: 'chest' }],
    }),
  ),
  // 궤짝: 시작 소지품 고르기
  {
    id: 'chest',
    blocks: [
      n('국왕은 당신이 누구인지, 어떤 사연을 품고 이곳에 왔는지에는 별다른 관심이 없는 듯했다. 그는 귀찮다는 듯 손짓으로 당신을 가리켰다. 이전에도 수많은 도전자들이 당찬 포부를 안고 국왕 앞에 섰지만, 대부분은 끝내 돌아오지 못했을 테니 말이다.'),
      n('신하들이 낡고 허름한 궤짝 하나를 당신 앞에 내려놓았다. 삐걱거리는 소리와 함께 뚜껑이 열리자, 녹슨 도구와 빛바랜 장신구, 용도를 짐작하기 어려운 잡동사니들이 어지럽게 뒤섞여 있었다.'),
      say(KING, '"그중 하나를 골라 북쪽... 북쪽으로 가라."'),
    ],
    choices: [
      search,
      { skill: '화술', target: 10, text: '하나 더 고를 순 없겠습니까?', next: 'chest-talk-ok', failNext: 'chest-talk-fail', excludes: ['chest-talked'] },
      { skill: '손재주', target: 10, text: '물건을 빼돌린다', next: 'steal-ok', failNext: 'steal-fail' },
      { text: '그런 잡동사니들은 필요 없습니다.', next: 'chest-refuse' },
    ],
  },
  {
    id: 'chest-search-ok',
    image: 'chest',
    blocks: [
      n('당신은 궤짝 앞에 무릎을 꿇고 안에 든 물건들을 하나씩 살펴보았다. 처음에는 그저 낡고 쓸모없는 잡동사니처럼 보였지만, 자세히 들여다보니 조금씩 다른 점들이 눈에 들어오기 시작했다.'),
    ],
    pick: { rare: 1, common: 3 },
    choices: [...pickItems(RARE, 'rare', 'leave-audience', '귀한 물건'), ...pickItems(COMMON, 'common', 'leave-audience')],
  },
  {
    id: 'chest-search-fail',
    image: 'chest',
    blocks: [
      n('당신은 궤짝 안을 이리저리 뒤적이며 물건들을 살펴보았다. 하지만 아무리 들여다보아도 무엇이 쓸모 있는 물건인지 알 수 없었다. 오히려 이것저것 만지작거리다 보니 물건들이 뒤엉켜 처음보다 더 엉망이 되어 버렸다.'),
      n('결국 당신의 눈에 들어오는 것은 녹슨 쇳조각과 정체 모를 도구 뭉치뿐이었다.'),
    ],
    pick: { common: 4 },
    choices: pickItems(COMMON, 'common', 'leave-audience'),
  },
  {
    id: 'chest-talk-ok',
    image: 'chest',
    blocks: [
      n('당신의 언변은 제법 효과적이었다. 왕은 어차피 창고의 잡동사니 몇 개쯤 사라진다 한들 관심조차 없을 것이다. 귀찮다는 듯 손을 내저으며 고개를 끄덕인 왕은 재촉하듯 말했다.'),
      say(KING, '"좋다, 좋으니 그만 떠들고 어서 골라 가거라."'),
      n('뜻밖의 허락에 당신은 황급히 눈앞의 물건들을 살폈다.'),
    ],
    pick: { common: 4 },
    choices: pickItems(COMMON, 'common', 'chest-pick'),
  },
  {
    id: 'chest-pick',
    image: 'chest',
    blocks: [n('하나를 챙겼다. 이제 궤짝 깊숙한 곳까지 살펴볼 차례다.')],
    choices: [search],
  },
  {
    id: 'chest-talk-fail',
    image: 'chest',
    effects: { stats: { mind: -20 }, flags: ['chest-talked'] },
    blocks: [
      n('당신의 말에 왕은 시큰둥한 표정으로 당신을 내려다본다. 왕의 눈치를 살피던 신하들이 대신 목소리를 높인다.'),
      say('신하', '"어느 안전이라고 감히 더 많은 것을 요구하는가! 과욕은 화를 부르는 법일세!"'),
      n('목숨을 건 여정에 잡동사니 하나를 더 부탁했다가 호되게 꾸지람만 듣고 말았다. 왕실의 냉담한 태도에 여정에 대한 의지가 꺾인다.', '정신력 -20'),
    ],
    choices: [{ text: '궤짝 앞으로 돌아간다', next: 'chest' }],
  },
  {
    id: 'steal-ok',
    image: 'chest',
    effects: { flags: ['stolen'], randomItem: { pool: [...RARE, ...COMMON], hidden: true } },
    blocks: [
      n('당신은 순진한 표정을 지으며 궤짝 안을 뒤적이기 시작했다. 일부러 엉뚱한 물건을 집어 들고 질문을 던지자, 신하 하나가 다가와 설명을 시작했다.'),
      n('그 순간이었다. 국왕이 신하에게 시선을 돌린 틈을 타, 당신은 손에 쥐고 있던 물건 하나를 소매 속으로 감쪽같이 밀어 넣었다. 아무도 눈치채지 못한 듯했다.', '무언가를 빼돌렸다'),
    ],
    choices: [
      { skill: '손재주', target: 15, text: '한 번 더 빼돌린다', next: 'steal-ok-2', failNext: 'steal-fail' },
      search,
    ],
  },
  {
    id: 'steal-ok-2',
    image: 'chest',
    effects: { stats: { mind: 20 }, randomItem: { pool: [...RARE, ...COMMON], hidden: true } },
    blocks: [
      n('이미 한 번 손을 뻗었던 당신은 자신감이 붙었다. 이번에는 신하가 옷매무새를 정리하는 순간을 노렸다. 자연스럽게 몸을 숙이며 물건을 살펴보는 척하고, 손끝으로 작은 물건 하나를 집어 들었다. 이번에도 감쪽같았다.'),
      say(KING, '"시간... 없어... 어서 물건을 가지고 떠나라!"'),
      n('황급히 물건을 뒤지며 고개를 숙인다. 입가에는 물건에 대한 기쁨보다 당신의 화려한 솜씨가 죽지 않았다는 기쁨이 가득하다.', '정신력 +20'),
    ],
    choices: [search],
  },
  {
    id: 'steal-fail',
    effects: { stats: { hp: -20, money: -100 }, loseItems: true, flags: ['expelled'] },
    blocks: [
      n('날이 추웠던 탓이었을까? 손놀림은 둔했고, 몰래 소매로 숨기려던 물건을 그만 떨어뜨리고 말았다.'),
      say('신하', '"이런 도둑놈 같으니!"'),
      n('수상한 행동은 결국 왕실의 눈을 피하지 못했다. 경비병들에게 제압당한 당신은 소지품을 모조리 압수당한 채 왕궁 밖으로 내쫓긴다. 이제 당신에게 남은 건 왕명이라는 무거운 책임뿐이다.', '체력 -20 · 모든 소지품과 돈을 잃었다'),
    ],
    choices: [{ text: '몸을 일으킨다', next: 'depart' }],
  },
  {
    id: 'chest-refuse',
    portrait: 'king',
    effects: { stats: { mind: 20 } },
    blocks: [
      n('당신은 궤짝 안을 한 번 훑어본 뒤 고개를 저었다. 순간 주변의 공기가 무겁게 가라앉았다.'),
      say(KING, '"그대의 선택은 존중하지. 하지만 오만이라는 칼날에 스스로 베이지 않도록 조심하게."'),
      n('당신은 왕의 호의를 뒤로한 채 궤짝을 떠났다. 인간의 정점에 선 왕의 제안마저 거절했다. 자신의 선택에 묘한 자신감이 차오르는 것을 느낀다.', '정신력 +20'),
    ],
    choices: [{ text: '알현실을 나선다', next: 'leave-audience' }],
  },
  // 알현실을 나서면 출신별 인카운터
  {
    id: 'leave-audience',
    image: 'hall',
    blocks: [n('알현실의 문이 등 뒤에서 무겁게 닫혔다. 왕궁의 긴 복도가 눈앞에 펼쳐진다.')],
    choices: [
      { text: '복도로 나선다', next: 'enc-noble', requires: ['job-noble'] },
      { text: '복도로 나선다', next: 'enc-jester', requires: ['job-jester'] },
      { text: '복도로 나선다', next: 'enc-scout', requires: ['job-scout'] },
      { text: '복도로 나선다', next: 'enc-mercenary', requires: ['job-mercenary'] },
      ...['urchin', 'stranger', 'swindler', 'priest'].map(id => ({ text: '복도로 나선다', next: 'enc-other', requires: [`job-${id}`] })),
    ],
  },
  {
    id: 'enc-noble',
    portrait: 'count',
    effects: { stats: { mind: -20 } },
    blocks: [
      n('복도를 걷던 중, 마주 걸어오던 한 백작과 시선이 마주쳤다. 그는 권력 다툼에서 밀려난 당신 가문의 영지를 차지한 인물이었다. 그는 당신을 알아보자 입가에 비릿한 미소를 띠었다.'),
      say('백작', '"아아, 자네였군. 몰락한 가문을 다시 일으켜 세우겠다고 그토록 대단한 임무를 자처했다지? 왕께서 차도살인을 하시려나 보군. 확실한 죽음의 늪에서 자네의 충성심과 용기가 얼마나 대단한지 증명해 보란 말일세."', '가문의 영지를 차지한 자'),
      n('그는 조롱 섞인 미소를 남긴 채 당신의 곁을 지나쳐 갔다. 그의 지독한 향수 냄새에 메스꺼움이 올라온다.', '정신력 -20'),
    ],
    choices: [
      { skill: '협박', target: 15, text: '진실을 말해라, 백작.', next: 'noble-threat-ok', failNext: 'noble-threat-fail' },
      { skill: '화술', target: 10, text: '조금의 정보라도 구걸한다', next: 'noble-beg-ok', failNext: 'noble-beg-fail' },
      toDepart,
    ],
  },
  {
    id: 'noble-threat-ok',
    portrait: 'count',
    blocks: [
      n('백작은 당신의 위협적인 태도에 잠시 흥미롭다는 듯 눈썹을 치켜올렸다. 이내 만족스러운 미소를 지으며 낮은 소리로 입을 열었다.'),
      say('백작', '"……좋아. 한 가지는 알려 주지. 왕실은 역병의 치료법을 찾는 데 혈안이 되어 있네. 하지만 정작 역병이 어디서 시작되었는지, 그 근원에 관한 이야기는 철저히 감추고 있지."'),
      say('백작', '"자네가 무엇을 발견하든, 누구에게 보고해야 하는지 신중하게 생각하게. 앞으로 고생할 텐데 노잣돈으로 쓰게나. 자네 가문 영지의 후임자로서 건네는 선의일세."'),
      n('백작이 품을 뒤져 동전 꾸러미를 내민다.'),
    ],
    choices: [
      { text: '받는다', next: 'depart', effects: { stats: { money: 3 } } },
      { text: '받지 않는다', next: 'depart', effects: { stats: { mind: 10 } } },
      { text: '동전 꾸러미를 백작의 발치에 내던진다', next: 'noble-scorn' },
    ],
  },
  {
    id: 'noble-scorn',
    portrait: 'count',
    effects: { stats: { hp: -10, mind: 20 } },
    blocks: [
      n('동전이 대리석 바닥 위로 요란하게 흩어졌다. 백작의 얼굴이 일그러지고, 그의 호위들이 당신을 벽으로 밀어붙였다. 몇 대를 얻어맞았지만, 가슴 한구석이 시원하다.', '체력 -10 · 정신력 +20'),
    ],
    choices: [toDepart],
  },
  {
    id: 'noble-threat-fail',
    portrait: 'count',
    effects: { stats: { hp: -10, mind: -10 } },
    blocks: [
      n('백작은 당신의 태도를 보고도 눈 하나 깜빡하지 않았다. 오히려 우습다는 듯 웃으며 고개를 저었다.'),
      say('백작', '"감히 내게 협박을 하는 건가? 몰락한 가문의 후계자 주제에? 자네가 어디까지 발버둥 치는지 지켜보도록 하지. 부디 오래 살아남게나."'),
      n('그는 유유히 자리를 떠났다. 뒤따라오던 호위들은 당신의 발을 걸어 넘어뜨리고 낄낄대며 떠났다. 수많은 궁중 사용인들이 보는 앞에서 추하게 넘어졌다. 몸과 마음이 아프다.', '체력 -10 · 정신력 -10'),
    ],
    choices: [toDepart],
  },
  {
    id: 'noble-beg-ok',
    portrait: 'count',
    effects: { stats: { mind: -20 } },
    blocks: [
      n('백작은 당신의 간절한 부탁을 듣더니 만족스러운 듯 입꼬리를 비틀었다.'),
      say('백작', '"허, 이제 와서 내게 도움을 청하는 건가? 가문의 명예를 되찾겠다던 기개는 어디 갔는지 모르겠군. 뭐, 한 가지 조언 정도는 해 주지. 이번 임무에서 너무 많은 것을 알려고 들지 말게."'),
      n('그는 비릿한 미소를 지으며 동전 꾸러미를 당신의 발치에 내던지고, 여유로운 발걸음으로 자리를 떠났다. 가문의 모든 것을 빼앗은 남자에게 정보를 구걸한 자신이 비참하게 느껴진다. 고개를 푹 숙인 와중에 그가 던지고 간 돈주머니가 보인다.', '정신력 -20'),
    ],
    choices: [
      { text: '동전 꾸러미를 챙긴다', next: 'depart', effects: { stats: { money: 3 } } },
      { text: '그대로 두고 떠난다', next: 'depart', effects: { stats: { mind: 10 } } },
    ],
  },
  {
    id: 'noble-beg-fail',
    portrait: 'count',
    effects: { stats: { mind: -20 } },
    blocks: [
      n('백작은 당신의 부탁을 듣고는 어이없다는 듯 웃음을 터뜨렸다.'),
      say('백작', '"쯧, 가문의 이름까지 팔아 가며 목숨을 구걸하는 건가? 시체에게 말할 것이 무엇이겠느냐."'),
      n('그는 비웃음을 남긴 채 자리를 떠났다. 가문의 모든 것을 빼앗은 남자에게 정보를 구걸한 자신이 비참하게 느껴진다.', '정신력 -20'),
    ],
    choices: [toDepart],
  },
  {
    id: 'enc-jester',
    portrait: 'servant',
    blocks: [
      n('복도를 걷던 중 사용인들이 당신을 발견하자 조심스레 주변을 살피더니 가까이 다가왔다.'),
      say('궁중 사용인', '"저…… 이번 임무에 가신다고 들었습니다. 사실 저희가 우연히 들은 이야기가 있습니다. 이번 임무에서 아무도 돌아오지 못한 건 단순히 임무가 위험해서가 아닙니다. 왕의 집행자들이 북부 지대의 기밀에 접근하면 누구든 가차 없이 죽인다고 합니다."'),
      say('궁중 사용인', '"그러니 부디 조심하세요. 평소 저희를 즐겁게 해 주셨던 분이 그런 곳에 들어가시는 건…… 원치 않습니다."'),
      n('그들의 표정에는 당신을 향한 진심 어린 염려가 담겨 있었다.'),
    ],
    choices: [
      { skill: '곡예', target: 10, text: '안심시키듯 사과로 저글링을 한다', next: 'jester-juggle-ok', failNext: 'jester-juggle-fail' },
      { skill: '공연', target: 15, text: '칼을 삼키는 묘기를 한다', next: 'jester-sword-ok', failNext: 'jester-sword-fail' },
      toDepart,
    ],
  },
  {
    id: 'jester-juggle-ok',
    portrait: 'servant',
    effects: { stats: { mind: 10 } },
    blocks: [
      n('사과 세 알이 허공에서 춤을 추자 굳어 있던 사용인들의 얼굴에 웃음이 번졌다. 마지막 사과를 한 입 베어 물고 인사하자, 한 사용인이 앞치마에서 무언가를 꺼내 당신의 손에 쥐여 주었다.'),
      say('궁중 사용인', '"얼마 안 되지만 가시는 길에 보태세요. 꼭 살아 돌아오셔야 해요."'),
      n('따뜻한 마음에 어깨가 조금 가벼워진다.', '정신력 +10'),
    ],
    choices: [
      { text: '고맙게 받는다', next: 'depart', effects: { stats: { money: 2 } } },
      { text: '마음만 받겠다며 돌려준다', next: 'depart', effects: { stats: { mind: 10 } } },
    ],
  },
  {
    id: 'jester-juggle-fail',
    portrait: 'servant',
    effects: { stats: { mind: -10 } },
    blocks: [
      n('손이 떨렸다. 사과가 하나둘 바닥으로 굴러떨어지고, 사용인들은 어색하게 웃으며 사과를 주워 주었다. 그들의 눈에 걱정이 더 짙어졌다.', '정신력 -10'),
    ],
    choices: [toDepart],
  },
  {
    id: 'jester-sword-ok',
    portrait: 'servant',
    effects: { stats: { mind: 20 } },
    blocks: [
      n('칼날이 목구멍 깊숙이 사라졌다가 다시 나타나자 사용인들이 숨을 삼키더니 이내 박수를 쳤다. 흥분한 한 사용인이 목소리를 낮춰 덧붙였다.'),
      say('궁중 사용인', '"집행자들은 검은 망토에 왕실 문장을 달고 다닌대요. 혹시 마주치시면 절대 등을 보이지 마세요."'),
      n('박수 소리가 귓가에 오래 남았다.', '정신력 +20'),
    ],
    choices: [toDepart],
  },
  {
    id: 'jester-sword-fail',
    portrait: 'servant',
    effects: { stats: { hp: -20 } },
    blocks: [
      n('칼끝이 목구멍을 긁었다. 피를 토하며 주저앉은 당신을 사용인들이 비명을 지르며 부축했다. 여정을 떠나기도 전에 몸이 상하고 말았다.', '체력 -20'),
    ],
    choices: [toDepart],
  },
  {
    id: 'enc-scout',
    portrait: 'scout-friend',
    blocks: [
      n('복도를 걷던 중, 거듭된 고속 승진 끝에 왕실 근위병으로 발탁된 얄미운 정찰대 동기와 마주쳤다. 그는 당신을 발견하자 잠시 걸음을 멈추더니, 이내 낮은 목소리로 입을 열었다.'),
      say('정찰대 동기', '"도망쳐. 지금이라도 도망가라고. 그 임무는…… 아무도 살아 돌아오지 못했어. 네가 베테랑이라고 해도 이번만큼은 달라."', '왕실 근위병'),
      n('평소의 빈정거림과는 사뭇 다른 어조였다. 당신의 어깨를 붙잡은 손에는 힘이 들어가 있었고, 잠시 입술을 달싹이던 그는 끝내 입을 다물었다. 과연 사실일까?'),
    ],
    choices: [
      { skill: '조사', target: 10, text: '표정과 말투를 관찰한다', next: 'scout-observe-ok', failNext: 'scout-observe-fail' },
      { skill: '협박', target: 10, text: '진실을 말해라.', next: 'scout-threat-ok', failNext: 'scout-threat-fail' },
      { text: '임무는 변하지 않는다.', next: 'depart' },
    ],
  },
  {
    id: 'scout-observe-ok',
    portrait: 'scout-friend',
    blocks: [
      n('그의 경고에는 거짓이나 과장된 기색이 느껴지지 않았다. 주변을 살피는 행동은 비밀을 이야기한다는 조심성보다는, 누군가에게 이 대화가 들키는 것을 두려워하는 듯했다.'),
      n('적어도 그는 당신을 함정에 빠뜨리려는 것은 아닌 듯하다. 다만, 아직 말하지 않은 무언가가 있는 것 같다.'),
    ],
    choices: [
      { skill: '협박', target: 10, text: '진실을 말해라.', next: 'scout-threat-ok', failNext: 'scout-threat-fail' },
      { text: '임무는 변하지 않는다.', next: 'depart' },
    ],
  },
  {
    id: 'scout-observe-fail',
    portrait: 'scout-friend',
    blocks: [
      n('그의 표정과 말투를 살펴보았지만, 특별히 눈에 띄는 점은 발견하지 못했다. 평소와 다른 태도라는 것 정도는 알 수 있었지만, 그것이 진심 어린 걱정인지 다른 의도가 있는 행동인지는 판단하기 어려웠다.'),
    ],
    choices: [{ text: '임무는 변하지 않는다.', next: 'depart' }],
  },
  {
    id: 'scout-threat-ok',
    portrait: 'scout-friend',
    effects: { stats: { money: 2 } },
    blocks: [
      n('당신의 압박에 동기는 잠시 시선을 피했다. 이내 짧은 한숨을 내쉬더니, 주변을 다시 한번 살폈다.'),
      say('정찰대 동기', '"……젠장. 그래, 더는 숨길 수 없겠군. 그 임무는 단순한 정보 수집이 아니야. 애초에 돌아올 수 있도록 계획된 임무가 아닐지도 몰라. 왕실 상층부에서 무언가 꾸미고 있다는 소문이 있어."'),
      say('정찰대 동기', '"이 돈으로 남쪽으로 도망쳐. 그쪽은 안전할 거야. 그동안 고마웠다."'),
      n('그는 은화 몇 닢을 건네고는 슬픈 눈으로 투구를 푹 눌러쓴 채 당신을 지나쳐 갔다.', '돈 +2'),
    ],
    choices: [{ text: '임무는 변하지 않는다.', next: 'depart' }],
  },
  {
    id: 'scout-threat-fail',
    portrait: 'scout-friend',
    blocks: [
      n('동기는 당신의 압박에도 물러서지 않았다. 오히려 당신의 손을 뿌리치고는 굳은 표정으로 한 걸음 물러섰다.'),
      say('정찰대 동기', '"……그만해. 내가 말할 수 있는 건 여기까지야. 믿든 말든 마음대로 해. 하지만 이번 임무에 관해서는 더 이상 묻지 않는 게 좋을 거야."'),
      n('그는 투구를 푹 눌러쓰고 당신을 지나쳐 갔다.'),
    ],
    choices: [{ text: '임무는 변하지 않는다.', next: 'depart' }],
  },
  {
    id: 'enc-mercenary',
    effects: { stats: { hygiene: -20 } },
    blocks: [
      n('알현실을 나와 생각에 잠긴다. 생각에 열중한 나머지 경비병들과 사용인들의 시선과 속삭임도 느껴지지 않는다. 북쪽으로 가라... 이게 무슨 말일까.'),
      n('북쪽 국경 너머, 왕실 발굴단의 소요를 진압하던 때를 떠올려 본다. 유적은 의문의 시체들로 가득했다. 혹시 그게 역병과 연관이 있을까? 그때의 지독한 시체 냄새가 떠오른다. 갑자기 메스꺼움이 올라온다.', '위생 -20'),
    ],
    choices: [{ text: '게워 낸다.', next: 'depart' }],
  },
  {
    id: 'enc-other',
    image: 'hall',
    effects: { stats: { hygiene: -20 } },
    blocks: [
      n('알현실에서 나온 순간부터 경비병들과 사용인들이 당신을 딱하다는 듯 쳐다본다.'),
      n('"돌아오지 않... 한 명도... 집행자들..." 그들의 속삭이는 소리가 들린다. 역시 의심스럽기 그지없는 임무다. 갑자기 메스꺼움이 올라온다.', '위생 -20'),
    ],
    choices: [{ text: '게워 낸다.', next: 'depart' }],
  },
  {
    id: 'depart',
    blocks: [
      n('왕궁의 문을 나서자 역병에 잠식된 수도가 눈앞에 펼쳐졌다. 북쪽으로 가라는 왕명은 막연하기만 하다. 왕실도 교회도 무언가를 숨기고 있다. 먼저 이 도시에서 진실의 실마리를 찾아야 한다.'),
    ],
    choices: [
      { text: '품속에서 낯선 감촉이 느껴진다', next: 'depart-pocket', requires: ['stolen'], excludes: ['expelled'] },
      { text: '수도로 향한다', next: 'crossroads', excludes: ['stolen'] },
      { text: '수도로 향한다', next: 'crossroads', requires: ['stolen', 'expelled'] },
    ],
  },
  {
    id: 'depart-pocket',
    image: 'depart',
    effects: { reveal: true },
    blocks: [
      n('왕궁을 벗어나 한참을 걸었을 무렵, 문득 품속에서 낯선 감촉을 느꼈다. 꺼내 보니 왕의 궤짝에서 슬쩍했던 물건이었다. 다행히 아무도 눈치채지 못한 모양이다.', '빼돌린 물건을 소지품에 넣었다'),
    ],
    choices: [{ text: '수도로 향한다', next: 'crossroads' }],
  },
  {
    id: 'crossroads',
    blocks: [
      n('역병이 번지는 수도. 왕실도 교회도 무언가를 숨기고 있다. 어디부터 파고들까.'),
    ],
    choices: [
      { text: '왕성으로 향한다', next: 'palace-gate', excludes: ['royal-doc'] },
      { skill: '조사', target: 12, stat: 'mind', text: '수도원 지하를 조사한다', next: 'church-secret', failNext: 'caught', excludes: ['church-secret'] },
      {
        skill: '종교',
        target: 10,
        text: '사제의 신분으로 수도원 기록실 출입을 청한다',
        next: 'church-secret',
        failNext: 'caught',
        requires: ['job-priest'],
        excludes: ['church-secret'],
      },
      { text: '변색된 열쇠로 수도원 지하의 봉인된 문을 연다', next: 'church-secret', requires: ['tarnished-key'], excludes: ['church-secret'] },
      { text: '역병 구역을 찾아간다', next: 'plague-ward', excludes: ['met-doctor'] },
      { text: '곡물 창고 앞 소란으로 향한다', next: 'granary', excludes: ['granary-done'] },
      { text: '빈민가의 우물로 향한다', next: 'well', excludes: ['well-done'] },
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
    effects: { stats: { hp: -20, money: -1 } },
    blocks: [n('경비에게 들켜 겨우 도망쳤다. 뇌물로 입을 막느라 주머니가 가벼워졌다.', '체력 -20 · 돈 -1')],
    choices: [leave],
  },
  // 왕성 잠입: 왕실 비밀문서를 얻는 길
  {
    id: 'palace-gate',
    blocks: [n('드디어 왕성의 입구가 보인다. 창을 든 경비병 두 명이 창을 올리며 멈춰 세운다.')],
    choices: [
      { text: '왕의 임무를 수행 중이다!', next: 'palace-mission-high', when: { stat: 'hygiene', min: 71 } },
      { text: '왕의 임무를 수행 중이다!', next: 'palace-mission-low', when: { stat: 'hygiene', min: 41, max: 70 } },
      { text: '왕의 임무를 수행 중이다!', next: 'palace-mission-filthy', when: { stat: 'hygiene', max: 40 } },
      { text: '달려간다', next: 'palace-rush', when: { stat: 'hygiene', min: 21 } },
      { text: '달려간다', next: 'palace-rush-filthy', when: { stat: 'hygiene', max: 20 } },
      { text: '야간 통행증을 내민다', next: 'palace-pass', requires: ['night-pass'] },
      {
        skill: '공연',
        target: 10,
        text: '왕의 연회에 불려 온 광대라며 재주를 부린다',
        next: 'palace-inside',
        failNext: 'palace-beaten',
        requires: ['job-jester'],
      },
      { skill: '운동', target: 12, stat: 'hp', text: '밧줄을 걸어 성벽을 타고 넘는다', next: 'palace-inside', failNext: 'palace-beaten', requires: ['rope'] },
      leave,
    ],
  },
  {
    id: 'palace-mission-high',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"혹시 무슨 일인지 알 수 있겠습니까?"')],
    choices: [{ text: '네놈이 알 일이 아니다.', next: 'palace-escort' }],
  },
  {
    id: 'palace-escort',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"하하, 그렇습니까? 왕궁으로 인도하겠습니다."')],
    choices: [
      { text: '가문의 휘장을 내보인다: 네놈 따위가 따라올 곳이 아니다.', next: 'palace-inside', requires: ['job-noble'] },
      { skill: '화술', target: 10, text: '혼자 가겠다.', next: 'palace-inside', failNext: 'palace-parlor' },
      { text: '알았다, 안내해라.', next: 'palace-parlor' },
    ],
  },
  {
    id: 'palace-parlor',
    blocks: [
      n('경비병을 따라 응접실로 안내되었다. "이곳에서 기다리십시오." 문밖에서는 경비병이 자리를 지키고 있다.'),
    ],
    choices: [
      { skill: '은신', target: 12, text: '창문으로 빠져나가 기록보관소로 향한다', next: 'palace-inside', failNext: 'caught' },
      { skill: '기만', target: 10, text: '볼일이 급하다며 자리를 비운다', next: 'palace-inside', failNext: 'caught' },
      { text: '얌전히 기다린다', next: 'palace-wait' },
    ],
  },
  {
    id: 'palace-wait',
    image: 'palace-parlor',
    blocks: [n('한참을 기다렸지만 아무도 오지 않았다. 해가 기울 무렵, 경비병은 정중하게 당신을 성문 밖으로 돌려보냈다.')],
    choices: [leave],
  },
  {
    id: 'palace-pass',
    portrait: 'guard',
    blocks: [
      n('경비병이 통행증을 받아 들고 서기관청의 직인을 확인하더니 황급히 창을 거뒀다.'),
      say(GUARD_NAME, '"실례했습니다. 들어가시지요."'),
    ],
    choices: [{ text: '성문을 지난다', next: 'palace-inside' }],
  },
  {
    id: 'palace-mission-low',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"뭐라는 거야, 평민. 너는 왕궁에 들어갈 자격이 없다."')],
    choices: [
      { skill: '기만', target: 12, text: '불사의 비약을 발견했다!', next: 'palace-escort', failNext: 'palace-beaten' },
      { skill: '기만', target: 15, text: '부활의 비약을 찾아냈다!', next: 'palace-inside', failNext: 'palace-beaten' },
      leave,
    ],
  },
  {
    id: 'palace-mission-filthy',
    portrait: 'guard',
    effects: { stats: { hp: -10 } },
    blocks: [say(GUARD_NAME, '"더러운 천민이 어딜!"'), n('창대가 정강이를 후려쳤다.', '체력 -10')],
    choices: [fightOne, leave],
  },
  {
    id: 'palace-beaten',
    image: 'palace-gate',
    effects: { stats: { hp: -10 } },
    blocks: [n('경비병의 창대가 날아들었다. 바닥을 구른 당신을 향해 창끝이 겨눠진다.', '체력 -10')],
    choices: [fightOne, leave],
  },
  {
    id: 'palace-rush-filthy',
    image: 'palace-gate',
    blocks: [
      n('피와 오물을 뒤집어쓴 채 달려드는 당신을 역병 환자로 착각한 경비병들이 비명을 지르며 창을 겨눴다.'),
      say(GUARD_NAME, '"역병 환자다! 가까이 오지 마!"'),
    ],
    choices: [{ text: '전투: 경비병 두 명과 싸운다', next: 'palace-fight-2' }, leave],
  },
  {
    id: 'palace-rush',
    image: 'palace-gate',
    blocks: [n('성문을 향해 달려가자 창을 든 경비병 두 명이 창을 올리며 앞을 막아섰다.')],
    choices: [
      { skill: '기만', target: 10, text: '성난 농민들이 황궁 앞에 당도했다!!', next: 'palace-alarm', failNext: 'palace-alarm-fail' },
      {
        skill: '운동',
        target: 20,
        stat: 'hp',
        text: '그대로 성문을 향해 돌진한다',
        next: 'palace-charge',
        failNext: 'palace-fight-2',
      },
      leave,
    ],
  },
  {
    id: 'palace-charge',
    image: 'palace-fight',
    blocks: [
      n('경비병들 사이를 몸으로 뚫고 성문 안으로 뛰어들었다. 등 뒤로 고함이 쏟아진다.'),
      say(GUARD_NAME, '"야야야야, 저놈 잡아!!"'),
    ],
    choices: [{ text: '기록보관소로 내달린다', next: 'palace-inside' }],
  },
  {
    id: 'palace-alarm',
    portrait: 'guard',
    blocks: [
      say(GUARD_NAME, '"뭐야, 어디냐? 이봐, 빨리 경비대장님께 보고해!"'),
      n('경비병 한 명이 성문 안으로 뛰어갔다. 남은 경비병은 한 명뿐이다.'),
    ],
    choices: [
      fightOne,
      { text: '기만: 중요한 정보가 있어서 직접 들어가고 싶습니다', next: 'palace-info-high', when: { stat: 'hygiene', min: 71 } },
      { text: '기만: 중요한 정보가 있어서 직접 들어가고 싶습니다', next: 'palace-info-low', when: { stat: 'hygiene', max: 70 } },
      { text: '아부: 정말 고생이 많으십니다', next: 'palace-flatter-high', when: { stat: 'hygiene', min: 71 } },
      { text: '아부: 정말 고생이 많으십니다', next: 'palace-flatter-mid', when: { stat: 'hygiene', min: 41, max: 70 } },
      { text: '아부: 정말 고생이 많으십니다', next: 'palace-flatter-low', when: { stat: 'hygiene', max: 40 } },
    ],
  },
  {
    id: 'palace-info-high',
    portrait: 'guard',
    effects: { stats: { mind: -10 } },
    blocks: [
      n('경비병은 당신을 위아래로 훑어보고는 이내 결심을 한 듯 말했다.'),
      say(GUARD_NAME, '"그 정보, 확실한 거 맞는 거지요? 만약에 잘못된 정보라면 저는 외부인을 잘못 들인 죄로 큰 벌을 받습니다. 어쩌면 저희 가족까지 위험할지도 모르죠. 솔직하게 말해 주십쇼. 지금 왕도를 위협하는 반란군에 대한 정보를 가져온 게 확실하죠?"'),
      n('경비병의 불안해 보이는 눈이 당신의 양심을 자극한다.', '정신력 -10'),
    ],
    choices: [
      { text: '거짓말: 확실하다, 믿어라.', next: 'palace-opened' },
      { text: '미안하다, 거짓말이었다.', next: 'palace-betrayed' },
    ],
  },
  {
    id: 'palace-opened',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"알겠습니다. 믿고 성문을 열겠습니다. 경비대장실은 성문을 열고 들어가서 성벽을 따라 오른쪽 별채에 있습니다."')],
    choices: [{ text: '알겠습니다.', next: 'palace-inside' }],
  },
  {
    id: 'palace-betrayed',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"이놈이 날 기만해?"')],
    choices: [fightOne],
  },
  {
    id: 'palace-info-low',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"미안하지만 규정상 외부인은 출입이 불가하다. 나에게 말하면 내가 대신 전달하지."')],
    choices: [
      { text: '거짓말: 급한 일이라 그럴 시간이 없습니다.', odds: { stat: 'hygiene' }, next: 'palace-allowed', failNext: 'palace-rule' },
      { skill: '기만', target: 10, text: '빛바랜 보석을 경비병의 손에 슬쩍 쥐여 준다', next: 'palace-allowed', failNext: 'palace-beaten', requires: ['faded-gem'] },
      { text: '아닙니다, 돌아가겠습니다.', next: 'crossroads' },
    ],
  },
  {
    id: 'palace-allowed',
    portrait: 'guard',
    blocks: [
      say(GUARD_NAME, '"어쩔 수 없군. 들어오시오. 경비대장실은 성문을 열고 들어가서 성벽을 따라 오른쪽 별채에 있소. 그리고 명심하시오. 절대 다른 곳에는 얼씬거리지 마시오. 절대로."'),
    ],
    choices: [{ text: '알겠습니다.', next: 'palace-inside' }],
  },
  {
    id: 'palace-rule',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"규칙은 규칙이라네. 돌아가든가 나에게 말하든가 하시오."')],
    choices: [{ trait: '용기', text: '어쩔 수 없군, 비켜라.', next: 'palace-fight-1' }, leave],
  },
  {
    id: 'palace-flatter-high',
    portrait: 'guard',
    effects: { stats: { mind: 8 } },
    blocks: [
      say(GUARD_NAME, '"아이고, 높으신 분께서. 아닙니다, 아닙니다. 이 천한 것이 뭘 했다고."'),
      n('경비병이 황송하다는 듯 연신 허리를 굽힌다.', '정신력 +8'),
    ],
    choices: [
      { text: '거짓말: 중요한 정보가 있어서 직접 들어가겠다.', odds: { stat: 'hygiene', plus: 20 }, next: 'palace-flatter-sure', failNext: 'palace-flatter-rule' },
    ],
  },
  {
    id: 'palace-flatter-sure',
    portrait: 'guard',
    blocks: [
      say(GUARD_NAME, '"그 정보, 확실한 거 맞는 거지요? 만약에 잘못된 정보라면 저는 외부인을 잘못 들인 죄로 큰 벌을 받습니다. 지금 왕도에 쳐들어온 적군에 대한 중요한 정보를 가지고 계신 게 확실하지요?"'),
    ],
    choices: [
      { text: '거짓말: 확실하다, 믿어라.', next: 'palace-opened' },
      { text: '미안하다, 거짓말이었다.', next: 'palace-flatter-angry' },
    ],
  },
  {
    id: 'palace-flatter-angry',
    portrait: 'guard',
    effects: { stats: { mind: -10 } },
    blocks: [
      say(GUARD_NAME, '"이 자식이 귀티 나게 생겨서 혹시나 했더니만. 아오, 저리 안 꺼져? 왜 항상 내가 근무할 때만 이런 놈들이 꼬이나?"'),
      n('경비병의 얼굴이 시뻘겋게 달아올랐다.', '정신력 -10'),
    ],
    choices: [fightOne, leave],
  },
  {
    id: 'palace-flatter-rule',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"죄송하지만 규정상 외부인은 출입이 불가합니다. 죄송합니다."')],
    choices: [
      { text: '야, 내가 누군지 알아? 문 안 열어?', odds: { stat: 'hygiene', plus: -30 }, next: 'palace-flatter-yield', failNext: 'palace-flatter-firm' },
      leave,
    ],
  },
  {
    id: 'palace-flatter-yield',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"흐어, 알겠습니다!"')],
    choices: [{ text: '성문을 지난다', next: 'palace-inside' }],
  },
  {
    id: 'palace-flatter-firm',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"아무리 높은 분이라도 규정은 규정입니다."')],
    choices: [fightOne, leave],
  },
  {
    id: 'palace-flatter-mid',
    portrait: 'guard',
    effects: { stats: { mind: -1 } },
    blocks: [
      say(GUARD_NAME, '"내 노고를 알아주는 사람은 오랜만이네. 정말 내가 말이야, 불철주야 어? 아무리 추운 날에도 더운 날에도 어? 듣고 있지? 말도 마라. 정말 내가 여기 가만히 서서 아무것도 안 하는 거 같지만 어? 딱 봐 봐, 여기 서 있어야 감시가 되는 거라니까? 듣고 있지?"'),
      n('끝없는 하소연에 슬슬 기운이 빠진다.', '정신력 -1'),
    ],
    choices: [
      { text: '듣고 있습니다.', next: 'palace-whine-bored' },
      { text: '계속 말해 주세요.', next: 'palace-whine-friend' },
    ],
  },
  {
    id: 'palace-whine-bored',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"됐네, 됐어. 자네도 다른 놈들이랑 똑같구먼."'), n('경비병은 시큰둥하게 고개를 돌려 버렸다.')],
    choices: [leave],
  },
  {
    id: 'palace-whine-friend',
    portrait: 'guard',
    effects: { stats: { mind: -5 } },
    blocks: [
      n('경비병은 한참 동안 신세 한탄을 늘어놓더니, 당신의 어깨를 두드렸다.'),
      say(GUARD_NAME, '"자네 같은 사람이 경비대장이 돼야 하는데 말이야. 잠깐이면 되지? 얼른 다녀오게. 나는 아무것도 못 본 걸세."'),
      n('귀가 얼얼하지만, 문이 열렸다.', '정신력 -5'),
    ],
    choices: [{ text: '성문을 지난다', next: 'palace-inside' }],
  },
  {
    id: 'palace-flatter-low',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"할 말 없으면 꺼져라, 더러운 평민."')],
    choices: [fightOne, leave],
  },
  {
    id: 'palace-alarm-fail',
    portrait: 'guard',
    blocks: [say(GUARD_NAME, '"거짓말 치지 마라. 너 같은 애들이 한두 명인 줄 아나? 좋은 말 할 때 저리 비켜라."')],
    choices: [
      { skill: '기만', target: 12, text: '거짓말: 정말입니다, 한 번만 확인해 보세요.', next: 'palace-scout-sent', failNext: 'palace-liar' },
      { text: '전투: 들었나?', next: 'palace-fight-2' },
    ],
  },
  {
    id: 'palace-scout-sent',
    portrait: 'guard',
    blocks: [
      say(GUARD_NAME, '"아니기만 하면 넌 맞아 죽을 준비 해라. 에이씨, 야! 너 저기 마을 한번 확인하고 와라."'),
      n('경비병 한 명이 투덜거리며 자리를 떴다. 남은 경비병이 당신을 노려보고 있다.'),
    ],
    choices: [
      { skill: '은신', target: 12, text: '남은 경비병이 한눈파는 틈에 성문 안으로 숨어든다', next: 'palace-inside', failNext: 'palace-fight-1' },
      fightOne,
    ],
  },
  {
    id: 'palace-liar',
    portrait: 'guard',
    effects: { stats: { hp: -10 } },
    blocks: [say(GUARD_NAME, '"아니, 이 녀석이 아직도 그러네? 저리 안 꺼져?"'), n('창대가 옆구리를 파고들었다.', '체력 -10')],
    choices: [fightOne, leave],
  },
  {
    id: 'palace-fight-1',
    image: 'palace-fight',
    blocks: [n('창을 고쳐 쥔 경비병이 달려든다. 오래 끌면 경비병들이 몰려올 것이다.', '3턴 안에 이기지 못하면 경비병들이 몰려듭니다')],
    combat: { enemy: GUARD, turns: 3, win: 'palace-inside', lose: 'end-dead', timeout: 'end-torture' },
    choices: [],
  },
  {
    id: 'palace-fight-2',
    image: 'palace-fight',
    blocks: [
      n('두 경비병이 동시에 창을 겨눴다. 한 명의 허리춤에 매달린 나팔이 눈에 들어온다. 나팔이 울리기 전에 끝내야 한다.', '3턴 안에 이기지 못하면 나팔 소리에 경비병들이 몰려듭니다'),
    ],
    combat: { enemy: GUARDS, turns: 3, win: 'palace-inside', lose: 'end-dead', timeout: 'end-torture' },
    choices: [],
  },
  {
    id: 'palace-inside',
    blocks: [
      n('마침내 왕궁 안으로 들어섰다. 경비대장실이 있다는 별채를 지나, 인적이 끊긴 회랑 끝의 기록보관소로 숨어든다.'),
    ],
    choices: [{ text: '서고를 뒤진다', next: 'royal-doc' }],
  },
  {
    id: 'royal-doc',
    effects: { items: ['royal-doc'] },
    blocks: [
      n(
        '왕실의 비밀문서를 입수했다. 왕실이 역병의 발생지를 숨기고 발굴작업을 계속 지속시켰다는 증거가 적혀 있다. 이 사실을 공개하면 왕실은 크게 약해질 것이다. 하지만 왕실이 무너지면 국경 방어와 중앙 행정에도 차질이 생길 수 있다.',
        '왕실 비밀문서 획득',
      ),
    ],
    choices: [leave],
  },
  {
    id: 'church-secret',
    effects: { items: ['church-secret'] },
    blocks: [
      n(
        '수도원 지하에서 봉인된 문서를 발견했다. 문서에는 역병 환자를 치료하는 약의 제조법과 배합 비율이 상세히 기록되어 있다. 문서의 작성 날짜는 역병이 처음 퍼지기 수년 전이었다. 교회는 치료제를 만들 수 있었지만, 그 지식을 독점해 왔다.',
        '교회의 봉인된 기록 획득',
      ),
    ],
    choices: [leave],
  },
  // 백성 인카운터: 역병 구역 (역병의사와의 만남 + 진 개혁 조건)
  {
    id: 'plague-ward',
    effects: { flags: ['met-doctor'] },
    blocks: [
      n('역병 구역은 봉쇄된 채 버려져 있었다. 신음 소리 사이로 새 부리 가면을 쓴 사람이 홀로 환자들을 돌보고 있다.'),
      say('역병의사', '"치료법만 있다면… 이 사람들을 살릴 수 있을 텐데."', '가면 너머의 목소리'),
    ],
    choices: [
      { text: '역병의사를 도와 환자들을 돌본다', target: 10, stat: 'hygiene', next: 'ward-saved', failNext: 'ward-failed', effects: { flags: ['people-ward'] } },
      {
        skill: '종교',
        target: 10,
        text: '죽어 가는 이들을 위해 기도하며 곁을 지킨다',
        next: 'ward-saved',
        failNext: 'ward-failed',
        requires: ['job-priest'],
        effects: { flags: ['people-ward'] },
      },
      { text: '자리를 뜬다', next: 'crossroads' },
    ],
  },
  {
    id: 'ward-saved',
    effects: { stats: { hygiene: -20 } },
    blocks: [
      n('밤새 환자들을 돌봤다. 몇몇은 고비를 넘겼고, 역병의사는 너를 기억하겠다고 했다.', '백성의 신뢰를 얻었다 · 역병 피해 지역의 백성을 구했다 · 위생 -20'),
    ],
    choices: [leave],
  },
  {
    id: 'ward-failed',
    effects: { stats: { hygiene: -20, hp: -10 } },
    blocks: [n('손쓸 틈도 없이 환자들이 숨을 거뒀다. 너도 밤새 열에 시달렸다.', '위생 -20 · 체력 -10')],
    choices: [leave],
  },
  // 백성 인카운터: 곡물 창고
  {
    id: 'granary',
    effects: { flags: ['granary-done'] },
    blocks: [
      n('굶주린 백성들이 곡물 창고로 몰려들었다. 창고지기는 귀족의 명령이라며 문을 걸어 잠갔고, 경비병들이 창을 겨누고 있다.'),
    ],
    choices: [
      { skill: '화술', target: 12, stat: 'mind', text: '양쪽 사이에 서서 곡물을 나누자고 설득한다', next: 'granary-calm', failNext: 'granary-riot', effects: { flags: ['people-granary'] } },
      { skill: '협박', target: 12, text: '창고지기의 멱살을 잡고 문을 열라고 위협한다', next: 'granary-calm', failNext: 'granary-riot', effects: { flags: ['people-granary'] } },
      {
        skill: '공연',
        target: 12,
        text: '우스꽝스러운 공연으로 성난 군중의 분노를 누그러뜨린다',
        next: 'granary-calm',
        failNext: 'granary-riot',
        requires: ['job-jester'],
        effects: { flags: ['people-granary'] },
      },
      { text: '자리를 피한다', next: 'crossroads' },
    ],
  },
  {
    id: 'granary-calm',
    effects: { stats: { mind: 10 } },
    blocks: [n('창고 문이 열리고 곡물이 공평하게 나뉘었다. 백성들은 네 이름을 기억했다.', '백성의 신뢰를 얻었다 · 정신력 +10')],
    choices: [leave],
  },
  {
    id: 'granary-riot',
    effects: { stats: { hp: -20 } },
    blocks: [n('설득은 실패했다. 창이 휘둘러지고, 너는 군중에 휩쓸려 다쳤다.', '체력 -20')],
    choices: [leave],
  },
  // 백성 인카운터: 빈민가 우물
  {
    id: 'well',
    effects: { flags: ['well-done'] },
    blocks: [
      n('빈민가 한가운데의 우물. 역병으로 죽은 이의 시신이 우물 바닥에 가라앉은 채 방치되어 있다. 갈 곳 없는 사람들은 그 물을 길어 마실 수밖에 없다.'),
    ],
    choices: [
      { skill: '운동', target: 12, stat: 'hp', text: '우물로 내려가 시신을 끌어올린다', next: 'well-saved', failNext: 'well-failed', effects: { flags: ['people-well'] } },
      { text: '밧줄을 내려 시신을 끌어올린다', next: 'well-saved', requires: ['rope'], effects: { flags: ['people-well'] } },
      { skill: '생존', target: 10, text: '숯과 모래로 물을 거르는 법을 알려 준다', next: 'well-saved', failNext: 'well-failed', effects: { flags: ['people-well'] } },
      { text: '자리를 뜬다', next: 'crossroads' },
    ],
  },
  {
    id: 'well-saved',
    effects: { stats: { hygiene: -20 } },
    blocks: [n('물이 다시 맑아지기 시작했다. 빈민가 사람들이 하나둘 고개를 숙여 고마움을 전했다.', '백성의 신뢰를 얻었다 · 위생 -20')],
    choices: [leave],
  },
  {
    id: 'well-failed',
    effects: { stats: { hygiene: -30, hp: -10 } },
    blocks: [n('썩은 물을 뒤집어쓴 채 우물 밖으로 기어 나왔다. 사람들의 눈빛에는 실망만 남았다.', '위생 -30 · 체력 -10')],
    choices: [leave],
  },
  // 투기장: 3연승하면 투기장의 제왕 엔딩, 한 번이라도 지면 다시 도전할 수 없다
  {
    id: 'arena-1',
    blocks: [
      n('수도 외곽의 투기장. 역병으로 일자리를 잃은 자들이 마지막 밑천으로 피를 판다. 세 번을 이기면 금화와 명성이 주어진다.'),
    ],
    choices: [
      { text: '첫 상대와 맞선다', next: 'arena-fight-1' },
      { skill: '기만', target: 12, text: '닳은 뼈 주사위로 관중과 내기를 건다', next: 'arena-dice-win', failNext: 'arena-dice-lose', requires: ['bone-dice'], excludes: ['dice-done'] },
      leave,
    ],
  },
  {
    id: 'arena-dice-win',
    image: 'arena-1',
    effects: { flags: ['dice-done'], stats: { money: 3 } },
    blocks: [n('손에 익은 뼈 주사위는 원하는 눈을 보여 주었다. 관중들의 동전이 당신의 주머니로 쏟아진다.', '돈 +3')],
    choices: [{ text: '모래판으로 향한다', next: 'arena-1' }],
  },
  {
    id: 'arena-dice-lose',
    image: 'arena-1',
    effects: { flags: ['dice-done'], stats: { money: -2 } },
    blocks: [n('주사위는 끝내 배신했다. 관중들은 낄낄대며 당신의 동전을 쓸어 갔다.', '돈 -2')],
    choices: [{ text: '모래판으로 향한다', next: 'arena-1' }],
  },
  {
    id: 'arena-fight-1',
    image: 'arena-1',
    blocks: [n('첫 상대가 모래를 박차고 달려든다.')],
    combat: { enemy: { name: '첫 상대', hp: 2, defense: 9, attack: 1, damage: 10 }, win: 'arena-2', lose: 'arena-lost' },
    choices: [],
  },
  {
    id: 'arena-2',
    blocks: [n('첫 상대가 쓰러졌다. 관중의 함성이 커진다. 다음 상대는 전직 용병이다.')],
    choices: [{ text: '용병과 맞선다', next: 'arena-fight-2' }],
  },
  {
    id: 'arena-fight-2',
    image: 'arena-2',
    blocks: [n('용병이 무심한 얼굴로 검을 뽑아 든다.')],
    combat: { enemy: { name: '용병', hp: 3, defense: 11, attack: 3, damage: 15 }, win: 'arena-3', lose: 'arena-lost' },
    choices: [],
  },
  {
    id: 'arena-3',
    blocks: [
      n('결승. 투기장의 현 챔피언이 모래 위로 걸어 나온다.'),
      say('투기장 챔피언', '"여기까지 온 건 칭찬해 주지. 하지만 여기서 끝이다."', '결승전'),
    ],
    choices: [{ trait: '용감함', text: '챔피언과 맞선다', next: 'arena-fight-3' }],
  },
  {
    id: 'arena-fight-3',
    image: 'arena-3',
    blocks: [n('챔피언의 거대한 도끼가 모래를 가르며 다가온다.')],
    combat: { enemy: { name: '투기장 챔피언', hp: 4, defense: 13, attack: 5, damage: 20 }, win: 'end-arena', lose: 'arena-lost' },
    choices: [],
  },
  {
    id: 'arena-lost',
    effects: { flags: ['arena-done'], stats: { hp: 20, money: -1 } },
    blocks: [n('모래 위에 쓰러졌다. 판돈을 잃고, 투기장 의원의 손에 겨우 목숨만 건져 빠져나왔다.', '체력 +20 · 돈 -1')],
    choices: [leave],
  },
  // 악몽 난이도 전용: 왕실 비밀문서에 적힌 발굴현장
  {
    id: 'excavation',
    blocks: [
      n('왕실 문서에 적힌 위치를 따라 도달한 미개척지. 발굴은 멈추지 않았다. 갱도 깊은 곳에서 역병의 근원이 숨 쉬고 있다.'),
    ],
    choices: [
      { trait: '용감함', text: '역병의 근원과 맞선다', target: 18, stat: 'mind', next: 'end-nightmare', failNext: 'end-dead' },
      { skill: '역사', target: 14, stat: 'mind', text: '벽면의 고대 문자를 해독해 봉인 의식을 되살린다', next: 'end-nightmare', failNext: 'end-dead' },
      { text: '삽으로 무너진 갱도를 파고 근원의 뒤편으로 돌아 들어간다', target: 14, stat: 'hp', next: 'end-nightmare', failNext: 'end-dead', requires: ['shovel'] },
      { text: '물러난다', next: 'crossroads' },
    ],
  },
  {
    id: 'decision',
    blocks: [n('손에 쥔 진실을 어떻게 쓸 것인가.')],
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
      n('교회가 치료제 제작법을 숨기고 있다는 것을 왕가에 알렸다. 그날 밤부터 교회의 이단심문관들이 너를 쫓기 시작했다. 왕가의 보호가 닿기 전까지 살아남아야 한다.'),
    ],
    choices: [
      { skill: '운동', target: 12, stat: 'hp', text: '뒷골목으로 달아난다', next: 'end-royal-power', failNext: 'end-dead' },
      { skill: '은신', target: 12, text: '뒷골목의 그림자에 몸을 숨긴다', next: 'end-royal-power', failNext: 'end-dead' },
      { skill: '동물조련', target: 12, text: '심문관들의 사냥개를 달래 추격을 따돌린다', next: 'end-royal-power', failNext: 'end-dead' },
      { trait: '용감함', text: '추격자들을 기다렸다가 맞선다', next: 'church-hunt-fight' },
    ],
  },
  {
    id: 'church-hunt-fight',
    image: 'church-hunt',
    blocks: [n('골목 끝에서 횃불을 든 이단심문관이 모습을 드러냈다.')],
    combat: { enemy: { name: '이단심문관', hp: 3, defense: 12, attack: 5, damage: 20 }, win: 'end-royal-power', lose: 'end-dead' },
    choices: [],
  },
  // 역병의사에게 치료법 전달: 왕국과 교회 양쪽의 추격을 두 번 연속 버텨야 한다
  {
    id: 'doctor-chase-1',
    effects: { stats: { hygiene: -20 } },
    blocks: [n('역병의사에게 치료법을 넘겼다. 이제 왕국과 교회 모두가 너를 쫓는다. 살아남아야 한다.', '위생 -20')],
    choices: [
      { text: '하수도로 숨어든다', target: 14, stat: 'hygiene', next: 'doctor-chase-2', failNext: 'end-dead' },
      { text: '허름한 망토를 뒤집어쓰고 부랑자들 틈에 섞여든다', next: 'doctor-chase-2', requires: ['shabby-cloak'] },
    ],
  },
  {
    id: 'doctor-chase-2',
    blocks: [n('하수도를 빠져나오자 왕국 기사단과 교회 심문관이 양쪽에서 길을 막았다.')],
    choices: [{ trait: '용감함', text: '포위를 뚫는다', next: 'doctor-chase-fight' }],
  },
  {
    id: 'doctor-chase-fight',
    image: 'doctor-chase-2',
    blocks: [n('포위가 좁혀 온다. 길이 완전히 막히기 전에 뚫고 나가야 한다.', '4턴 안에 포위를 뚫지 못하면 붙잡힙니다')],
    combat: { enemy: { name: '추격대', hp: 3, defense: 12, attack: 5, damage: 20 }, turns: 4, win: 'end-doctor', lose: 'end-dead', timeout: 'end-dead' },
    choices: [],
  },
  {
    id: 'end-royal-loyal',
    ending: '왕실의 수호자',
    blocks: [
      n('플레이어는 왕실의 부패를 알게 된 뒤에도 왕가를 지지한다. 왕실의 정통성을 지키고, 반란을 진압하며, 교회와 귀족들의 독립적인 세력 확대를 견제한다. 왕국은 일단 통합된 상태를 유지하지만, 왕실의 부패는 계속된다. 왕국을 지키기 위해 왕을 지켰지만, 왕국이 무엇을 위해 존재하는지는 잊었다. 역병의 문제는 해결했지만 부조리와 착취는 계속된다.'),
    ],
    choices: [],
  },
  {
    id: 'end-church-ally',
    ending: '이단재판소장',
    blocks: [
      n('플레이어는 왕실을 불신하고 교회와 손을 잡는다. 교회는 역병의 비밀과 치료제를 독점한 대가로 플레이어에게 정통성과 지원을 약속한다. 플레이어는 이단재판소장으로서 엄청난 권력을 누린다. 교회의 영향력으로 질서를 유지하고, 역병에 대한 정보와 치료 자원을 통제한다. 하지만 진실을 공개하면 교회가 무너질 수 있기 때문에 은폐에 협조하게 된다.'),
    ],
    choices: [],
  },
  {
    id: 'end-royal-power',
    ending: '왕권의 치료제',
    blocks: [
      n('교회는 축소되고 숙청당하며, 왕가는 엄청난 권력을 얻는다. 교회는 부패했지만, 지방의 치료소와 약초 공급망을 운영하던 조직이기도 했다. 왕가는 교회를 숙청하면서 치료사까지 처형하거나 추방하고, 각지에 흩어진 제조 기록과 재료 공급망도 파괴한다. 치료제는 왕가의 권력 유지 수단이 된다.'),
      n('왕가는 치료제 제작법을 확보하지만, 이를 백성에게 무료로 나눠 주지 않는다. 충성하는 영주와 군대에 먼저 공급하고, 백성에게는 무거운 세금이나 복종을 대가로 요구한다. 왕권은 이전보다 더욱 막강해졌고, 인류는 역병을 극복했다. 그럼에도 백성은 고통받는다.'),
    ],
    choices: [],
  },
  {
    id: 'end-doctor',
    ending: '역병의사의 치료제',
    blocks: [
      n('역병의사는 치료제를 만들어 신분을 가리지 않고 나눠 주었다. 왕국도 교회도 더는 치료법을 독점할 수 없었다. 너는 이름을 버리고 숨어 살아야 했지만, 역병은 조금씩 물러가기 시작했다.'),
    ],
    choices: [],
  },
  {
    id: 'end-tyrant',
    ending: '왕좌',
    blocks: [
      n('플레이어는 왕실도, 교회도, 귀족도 믿지 않는다. 모든 세력이 자신의 이익만을 추구한다는 사실을 깨닫고, 그들 모두를 제거하거나 굴복시키기로 한다. 왕실의 약점을 이용해 왕위를 빼앗고, 교회의 정보망을 장악하며, 반항하는 귀족들의 군대를 흡수한다. 견제하는 세력이 없는 완전한 독재를 이룬다.'),
    ],
    choices: [],
  },
  {
    id: 'end-anarchy',
    ending: '아나키즘',
    blocks: [n('모든 체제가 파괴되었다. 한동안 혼란이 지속된다.')],
    choices: [],
  },
  {
    id: 'end-reform',
    ending: '개혁',
    blocks: [
      n('플레이어는 왕실과 교회, 귀족들의 특권을 제한하고 백성을 위한 개혁을 추진한다. 곡물과 세금의 흐름을 바로잡고, 부패한 관리들을 처벌하며, 역병의 정보를 공개한다. 개혁이 성공하면 백성의 권리가 보장되는 새로운 질서가 시작된다. 다만 역병은 완전히 사라지지 않았고, 새 체제가 살아남을 수 있을지는 아직 알 수 없다.'),
    ],
    choices: [],
  },
  {
    id: 'end-true-reform',
    ending: '진 개혁',
    blocks: [
      n('왕실의 비밀문서와 교회의 봉인된 기록을 확보한 플레이어는 역병 피해 지역의 백성을 구하고, 치료제 제조법을 복원하는 데 성공한다. 치료제는 더 이상 교회의 허가나 귀족의 재산에 따라 배급되지 않는다.'),
      n('진실이 공개되자 백성들은 개혁을 지지하고, 일부 귀족과 군 지휘관도 무력 충돌 대신 새로운 통치 체제에 동참한다. 왕실과 교회의 특권은 제한되고, 곡물과 세금의 흐름은 공개적으로 관리되기 시작한다.'),
      n('역병은 하루아침에 사라지지 않았지만, 더는 감춰진 재앙이 아니었다. 치료법과 정보가 사람들에게 공유되면서 피해는 서서히 줄어들었다.'),
      n('무너진 옛 질서의 폐허 위에 새로운 나라가 세워졌다. 그 나라가 영원히 정의로울지는 아무도 알 수 없었지만, 적어도 이제 백성들은 자신들의 운명을 결정할 권리를 갖게 되었다.'),
    ],
    choices: [],
  },
  {
    id: 'end-nightmare',
    ending: '역병의 신비',
    blocks: [
      n('역병의 근원이 무너져 내렸다. 발굴현장에 잠들어 있던 고대의 재앙은 다시 땅속 깊이 봉인되었다. 이 사실을 아는 사람은 아무도 없다. 오직 너만이 역병이 어디서 왔는지 기억한다.'),
    ],
    choices: [],
  },
  {
    id: 'end-arena',
    ending: '투기장의 제왕',
    blocks: [
      n('챔피언이 모래 위에 쓰러졌다. 관중이 네 이름을 연호한다. 왕실도 교회도 아닌, 피와 모래 위에서 너는 왕이 되었다.'),
    ],
    choices: [],
  },
  {
    id: 'end-silence',
    ending: '외면',
    blocks: [n('너는 아무것도 보지 못한 척 고개를 돌렸다. 역병은 계속 퍼지고, 진실은 다시 어둠 속에 묻혔다.')],
    choices: [],
  },
  {
    id: 'end-torture',
    ending: '고문',
    blocks: [
      n('사방에서 경비병들이 몰려들었다. 쇠사슬에 묶여 지하 감옥으로 끌려간 당신은 혹독한 고문 끝에 숨을 거뒀다. 당신이 무엇을 알아내려 했는지는 아무도 묻지 않았다.'),
    ],
    choices: [],
  },
  {
    id: 'end-dead',
    ending: '죽음',
    blocks: [n('더는 버틸 수 없었다. 네가 쥐고 있던 진실도 함께 어둠 속에 묻혔다.')],
    choices: [],
  },
]

export const scenes: Record<string, Scene> = Object.fromEntries(list.map(s => [s.id, s]))
