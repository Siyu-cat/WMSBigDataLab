export interface NavItem {
  key: string;
  label: string;
  /** SPA 内路由跳转 */
  to?: string;
  /** 整页跳转（子应用/外部站点） */
  href?: string;
  /** 点击弹出建设中提示 */
  comingSoon?: boolean;
  /** 悬停展开的二级菜单 */
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    key: 'calendar',
    label: '日历',
    children: [
      { key: 'schedule', label: '排期', comingSoon: true },
      { key: 'timeline', label: '时间轴', comingSoon: true },
    ],
  },
  {
    key: 'story',
    label: '事件簿',
    to: '/mainstory',
    children: [
      { key: 'mainstory', label: '主线剧情', to: '/mainstory' },
      { key: 'pastevent', label: '往期活动剧情', to: '/pastevent' },
      { key: 'training', label: '进修副本', comingSoon: true },
      { key: 'event-dungeon', label: '活动副本', comingSoon: true },
    ],
  },
  {
    key: 'base',
    label: '基地',
    children: [
      { key: 'nxx-os', label: 'NXX-OS', comingSoon: true },
      { key: 'archive', label: '资料申请和资料室', comingSoon: true },
      { key: 'study', label: '研修室', comingSoon: true },
    ],
  },
  {
    key: 'moments',
    label: '恋念定格',
    children: [
      { key: 'personal-line', label: '个人线剧情', comingSoon: true },
      { key: 'mind-story', label: '思绪剧情', comingSoon: true },
      { key: 'limited-event', label: '限时活动', comingSoon: true },
    ],
  },
  {
    key: 'phone',
    label: '手机',
    children: [
      { key: 'bigdata', label: '大数据中心', href: '/bigdatalab/' },
      { key: 'between-us', label: '你我之间', comingSoon: true },
      { key: 'visit', label: '拜访', comingSoon: true },
      { key: 'message', label: '短消息', comingSoon: true },
      { key: 'call', label: '通话', comingSoon: true },
    ],
  },
  {
    key: 'agenda',
    label: '未名日程',
    children: [
      { key: 'fieldwork', label: '外勤', comingSoon: true },
      { key: 'city', label: '未名市', comingSoon: true },
    ],
  },
  {
    key: 'gallery',
    label: '图鉴',
    children: [
      { key: 'mind', label: '思绪', comingSoon: true },
      { key: 'illustration', label: '插画', comingSoon: true },
      { key: 'puzzle', label: '拼图', comingSoon: true },
      { key: 'costume', label: '服装', comingSoon: true },
      { key: 'invitation', label: '邀请函', comingSoon: true },
      { key: 'prop', label: '道具', comingSoon: true },
      { key: 'card', label: '名片', comingSoon: true },
      { key: 'badge', label: '徽章', comingSoon: true },
      { key: 'salon', label: '沙龙', comingSoon: true },
      { key: 'character', label: '角色', comingSoon: true },
      { key: 'achievement', label: '成就', comingSoon: true },
      { key: 'merch', label: '实体周边', comingSoon: true },
    ],
  },
  { key: 'dream', label: '逸梦', comingSoon: true },
];
