export interface StoryChapter {
  /** 大号序号：00、01…… */
  num: string;
  /** 标签：Prelude / Episode.N */
  tag: string;
  title: string;
  slug: string;
  stages: string[];
}

export interface StoryArc {
  key: string;
  name: string;
  chapters: StoryChapter[];
}

export interface PastEvent {
  title: string;
  date: string;
}

const makeStages = (num: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => `${num}-${String(i + 1).padStart(2, '0')}`);

export const mainArcs: StoryArc[] = [
  {
    key: 'haiosen',
    name: '海奥森篇',
    chapters: [
      { num: '00', tag: 'Prelude', title: '启迹·浓雾', slug: 'prelude', stages: makeStages('00', 2) },
      { num: '01', tag: 'Episode.1', title: '人情冷暖', slug: 'episode1', stages: makeStages('01', 17) },
      { num: '02', tag: 'Episode.2', title: '无法承受的爱', slug: 'episode2', stages: makeStages('02', 4) },
      { num: '03', tag: 'Episode.3', title: '心之天秤', slug: 'episode3', stages: makeStages('03', 3) },
      { num: '04', tag: 'Episode.4', title: '心火', slug: 'episode4', stages: makeStages('04', 3) },
      { num: '05', tag: 'Episode.5', title: '雪落有声', slug: 'episode5', stages: makeStages('05', 3) },
      { num: '06', tag: 'Episode.6', title: '伥鬼', slug: 'episode6', stages: makeStages('06', 3) },
      { num: '07', tag: 'Episode.7', title: '基督山之雨', slug: 'episode7', stages: makeStages('07', 3) },
      { num: '08', tag: 'Episode.8', title: '荼蘼', slug: 'episode8', stages: makeStages('08', 3) },
    ],
  },
  {
    key: 'jianlangu',
    name: '剑兰谷篇',
    chapters: [
      { num: '09', tag: 'Episode.9', title: '灰色交界', slug: 'episode9', stages: makeStages('09', 3) },
      { num: '10', tag: 'Episode.10', title: '无言的铿锵', slug: 'episode10', stages: makeStages('10', 3) },
      { num: '11', tag: 'Episode.11', title: '茧房', slug: 'episode11', stages: makeStages('11', 3) },
      { num: '12', tag: 'Episode.12', title: '燔祭', slug: 'episode12', stages: makeStages('12', 3) },
      { num: '13', tag: 'Episode.13', title: '厝火沉疴', slug: 'episode13', stages: makeStages('13', 3) },
      { num: '14', tag: 'Episode.14', title: '坍缩', slug: 'episode14', stages: makeStages('14', 3) },
      { num: '15', tag: 'Episode.15', title: '罪与罚', slug: 'episode15', stages: makeStages('15', 3) },
    ],
  },
  {
    key: 'yaning',
    name: '亚宁篇',
    chapters: [
      { num: '16', tag: 'Episode.16', title: '心业无明', slug: 'episode16', stages: makeStages('16', 3) },
      { num: '17', tag: 'Episode.17', title: '伊卡洛斯之羽', slug: 'episode17', stages: makeStages('17', 3) },
      { num: '18', tag: 'Episode.18', title: '行至黎明', slug: 'episode18', stages: makeStages('18', 3) },
      { num: '19', tag: 'Episode.19', title: '交叉点', slug: 'episode19', stages: makeStages('19', 3) },
    ],
  },
];

export const pastEvents: PastEvent[] = [
  { title: '消失的黄金', date: '2020.09.30' },
  { title: '清夏同游', date: '2020.08.19' },
  { title: '午夜华章', date: '2020.11.12' },
  { title: '缤纷乐游会', date: '2020.12.16' },
  { title: '致斯卡提的情诗', date: '2021.01.29' },
  { title: '异乡行歌', date: '2021.03.25' },
  { title: '燃动潮流夜', date: '2021.05.21' },
  { title: '绯色盛典', date: '2021.07.15' },
  { title: '狂沙的呼唤', date: '2021.09.29' },
  { title: '未名夜惊魂', date: '2024.10.25' },
  { title: '今愿良宵', date: '2024.12.19' },
  { title: '故城长燃的薪火', date: '2026.02.10' },
];
