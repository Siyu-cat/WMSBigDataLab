import { CategoryTreeNode } from './types';

export const mockCategoryTree: CategoryTreeNode[] = [
  {
    id: '1',
    name: '人物',
    parentId: null,
    children: [
      {
        id: '1-1',
        name: '当代人物',
        parentId: '1',
        entries: [
          { id: 'e1', name: '薇拉' },
          { id: 'e2', name: '瑞恩·杰斯' },
          { id: 'e3', name: '知更鸟' },
          { id: 'e4', name: '朱蔓' },
          { id: 'e5', name: '曾春桥' },
          { id: 'e6', name: '安华' },
          { id: 'e7', name: '左临川' },
          { id: 'e8', name: '爱德华·尼温' },
          { id: 'e9', name: '向晚' },
          { id: 'e10', name: '钟离' },
          { id: 'e11', name: '约翰尼' },
        ],
      },
      {
        id: '1-2',
        name: '历史人物',
        parentId: '1',
        entries: [
          { id: 'e12', name: '亚历山大' },
          { id: 'e13', name: '拿破仑' },
          { id: 'e14', name: '成吉思汗' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: '音乐',
    parentId: null,
    children: [
      {
        id: '2-1',
        name: '古典音乐',
        parentId: '2',
        entries: [
          { id: 'e15', name: '《铃兰时节》' },
          { id: 'e16', name: '《bist du bei mir》' },
          { id: 'e17', name: '《我的太阳》' },
          { id: 'e18', name: '《Wouldn\'t It Be Nice》' },
          { id: 'e19', name: '爱的罗曼史' },
          { id: 'e20', name: '《爱之梦》' },
          { id: 'e21', name: '《All I ask of you》' },
          { id: 'e22', name: '《爱若迷梦》' },
          { id: 'e23', name: '《24首随想曲》' },
          { id: 'e24', name: '《黎明之风》' },
        ],
      },
      {
        id: '2-2',
        name: '流行音乐',
        parentId: '2',
        entries: [
          { id: 'e25', name: '《夜曲》' },
          { id: 'e26', name: '《晴天》' },
          { id: 'e27', name: '《七里香》' },
        ],
      },
    ],
  },
  {
    id: '3',
    name: '文学',
    parentId: null,
    children: [
      {
        id: '3-1',
        name: '小说',
        parentId: '3',
        entries: [
          { id: 'e28', name: '《百年孤独》' },
          { id: 'e29', name: '《1984》' },
          { id: 'e30', name: '《追风筝的人》' },
        ],
      },
      {
        id: '3-2',
        name: '诗歌',
        parentId: '3',
        entries: [
          { id: 'e31', name: '《静夜思》' },
          { id: 'e32', name: '《春江花月夜》' },
          { id: 'e33', name: '《再别康桥》' },
        ],
      },
    ],
  },
  {
    id: '4',
    name: '影视',
    parentId: null,
    children: [
      {
        id: '4-1',
        name: '电影',
        parentId: '4',
        entries: [
          { id: 'e34', name: '《肖申克的救赎》' },
          { id: 'e35', name: '《霸王别姬》' },
          { id: 'e36', name: '《千与千寻》' },
        ],
      },
      {
        id: '4-2',
        name: '电视剧',
        parentId: '4',
        entries: [
          { id: 'e37', name: '《权力的游戏》' },
          { id: 'e38', name: '《绝命毒师》' },
          { id: 'e39', name: '《琅琊榜》' },
        ],
      },
    ],
  },
  {
    id: '5',
    name: '游戏',
    parentId: null,
    children: [
      {
        id: '5-1',
        name: '角色扮演',
        parentId: '5',
        entries: [
          { id: 'e40', name: '《原神》' },
          { id: 'e41', name: '《最终幻想》' },
          { id: 'e42', name: '《巫师3》' },
        ],
      },
      {
        id: '5-2',
        name: '策略',
        parentId: '5',
        entries: [
          { id: 'e43', name: '《文明》' },
          { id: 'e44', name: '《三国志》' },
          { id: 'e45', name: '《星际争霸》' },
        ],
      },
    ],
  },
  {
    id: '6',
    name: '科学',
    parentId: null,
    children: [
      {
        id: '6-1',
        name: '物理',
        parentId: '6',
        entries: [
          { id: 'e46', name: '量子力学' },
          { id: 'e47', name: '相对论' },
          { id: 'e48', name: '弦理论' },
        ],
      },
      {
        id: '6-2',
        name: '生物',
        parentId: '6',
        entries: [
          { id: 'e49', name: 'DNA复制' },
          { id: 'e50', name: '细胞分裂' },
          { id: 'e51', name: '基因编辑' },
        ],
      },
    ],
  },
];

export const mockEntryDetail: Record<string, { title: string; content: string }> = {
  e1: { title: '薇拉', content: '薇拉，28岁，知名设计师，毕业于巴黎美术学院。她的作品以独特的色彩运用和构图闻名，曾多次在国际展览中获奖。薇拉性格独立，喜欢独处，对艺术有着近乎偏执的追求。' },
  e2: { title: '瑞恩·杰斯', content: '瑞恩·杰斯，35岁，美国籍，著名企业家。他创办的科技公司在人工智能领域取得了突破性进展，被评为年度最具创新力企业。瑞恩热衷于慈善事业，设立了多个教育基金会。' },
  e3: { title: '知更鸟', content: '知更鸟，本名不详，是一位神秘的音乐人。她的音乐风格独特，融合了古典与现代元素，被誉为"音乐界的诗人"。' },
  e4: { title: '朱蔓', content: '朱蔓，42岁，著名中医师。她出生于中医世家，从小跟随祖父学习中医，对疑难杂症有着丰富的临床经验。' },
  e5: { title: '曾春桥', content: '曾春桥，55岁，建筑师。他的设计理念强调人与自然的和谐，代表作品包括多座获得国际大奖的绿色建筑。' },
  e6: { title: '安华', content: '安华，31岁，天文学家。他在黑洞研究方面取得了重要突破，发表了多篇具有影响力的学术论文。' },
  e7: { title: '左临川', content: '左临川，48岁，作家。他的小说以细腻的笔触和深刻的社会洞察力著称，曾获得多个文学奖项。' },
  e8: { title: '爱德华·尼温', content: '爱德华·尼温，60岁，英国籍，著名历史学家。他对中世纪欧洲历史有深入研究，著有多部学术专著。' },
  e9: { title: '向晚', content: '向晚，26岁，新生代演员。她凭借出色的演技和独特的气质迅速走红，被誉为"最具潜力的年轻演员"。' },
  e10: { title: '钟离', content: '钟离，38岁，武术家。他精通多种传统武术，曾多次在国际武术比赛中获得金牌。' },
  e11: { title: '约翰尼', content: '约翰尼，45岁，美国籍，著名厨师。他的餐厅连续多年获得米其林三星评级，被誉为"烹饪界的艺术家"。' },
  default: { title: '', content: '该词条内容正在编辑中，敬请期待...' },
};
