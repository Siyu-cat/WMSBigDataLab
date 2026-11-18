import { useState, useEffect, useLayoutEffect, useRef, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import type { StoryChapter } from '../data/story';
import type { ScriptLine, EvidenceItem, ClueItem } from '../data/story/episode1';
import { getStoryChapters, getStoryChapter, groupChaptersByArc, getEntryByTitle } from '../services/storyService';
import type { StoryChapterMeta, StoryEntryDetail } from '../services/storyService';

interface ChapterStoryData {
  stages: Record<string, ScriptLine[]>;
  evidence: EvidenceItem[];
  clues: ClueItem[];
}

const SearchIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

const ChevronIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#757575"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
      transition: 'transform 0.15s',
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ResizeGripIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10">
    <line x1="9" y1="1" x2="1" y2="9" stroke="#C4C4C4" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="5" x2="5" y2="9" stroke="#C4C4C4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 思绪 CG 浮动插图：在行右侧（底边贴行底、向上展开，白色小三角朝左指向思绪行）；随文章滚动
const CgFloatingImage = ({
  src,
  alt,
  width,
  raised,
  onRaise,
}: {
  src: string;
  alt: string;
  width: number | string;
  raised?: boolean;
  onRaise?: () => void;
}) => {
  const [error, setError] = useState(false);
  return (
    <div
      style={{
        position: 'absolute',
        left: 'calc(100% + 24px)',
        bottom: 0,
        zIndex: raised ? 6 : 5,
        pointerEvents: 'auto',
      }}
      onPointerDown={onRaise}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -12,
          bottom: 10,
          width: 0,
          height: 0,
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderRight: '12px solid #FFFFFF',
        }}
      />
      <div
        style={{
          position: 'relative',
          width,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
          background: '#FFFFFF',
        }}
      >
        {error ? (
          <div style={{ padding: '32px 12px', textAlign: 'center', fontSize: 13, color: '#9E9E9E' }}>
            图片加载失败
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            draggable={false}
            onError={() => setError(true)}
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        )}
      </div>
    </div>
  );
};

// 大数据中心词条页同款定位图标
const EntryPinIcon = () => (
  <svg width={22} height={22} viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M801.28 424.96c0-151.04-122.88-273.92-273.92-273.92-151.04 0-273.92 122.88-273.92 273.92 0 56.32 15.36 107.52 43.52 151.04l204.8 327.68c5.12 10.24 12.8 15.36 25.6 15.36 10.24 0 20.48-5.12 25.6-15.36l204.8-327.68c28.16-46.08 43.52-97.28 43.52-151.04m-273.92-125.44c69.12 0 125.44 56.32 125.44 125.44s-56.32 125.44-125.44 125.44-125.44-56.32-125.44-125.44 56.32-125.44 125.44-125.44m0 0z"
      fill="#fff"
    />
  </svg>
);

// 词条气泡：桌面在行右侧（顶边贴行顶、向下展开，白色小三角指向词条行），移动端居中悬浮；随文章滚动；
// 背景沿用大数据中心词条页图片（bg.png + 底部 skyline.png）
const EntryBubble = ({
  title,
  width,
  maxHeight,
  side,
  raised,
  onRaise,
}: {
  title: string;
  width: number | string;
  maxHeight: number | string;
  side: boolean;
  raised?: boolean;
  onRaise?: () => void;
}) => {
  const [entry, setEntry] = useState<StoryEntryDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');
  const wrapRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  // 移动端：气泡水平居中对齐屏幕（而非左对齐的行容器），三角同步修正仍指向名字中心
  useLayoutEffect(() => {
    if (side) return;
    const measure = () => {
      const row = wrapRef.current?.parentElement;
      if (!row) return;
      const rect = row.getBoundingClientRect();
      setShift(window.innerWidth / 2 - (rect.left + rect.width / 2));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [side]);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setEntry(null);
    getEntryByTitle(title)
      .then((e) => {
        if (!alive) return;
        if (e) {
          setEntry(e);
          setStatus('ready');
        } else {
          setStatus('notfound');
        }
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [title]);

  const hintStyle = { padding: '40px 24px', textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.7)' } as const;

  // 双击词条气泡跳转大数据中心词条详情页（wiki 深链接会自动展开目录并滚到词条）
  const isMobileEntry = useIsMobile();
  const goEntry = () => {
    if (!entry?.slug) return;
    const url = `/bigdatalab/entry/${entry.slug}`;
    if (isMobileEntry) {
      window.location.href = url; // 手机：当前页直接跳大数据中心
    } else {
      window.open(url, '_blank'); // 桌面：新标签打开并自动切换
    }
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        ...(side
          ? { left: 'calc(100% + 24px)', top: 0 }
          : {
              left: `calc(50% ${shift >= 0 ? '+' : '-'} ${Math.abs(shift)}px)`,
              transform: 'translateX(-50%)',
              top: 'calc(100% + 2px)',
            }),
        zIndex: raised ? 6 : 5,
        pointerEvents: 'auto',
      }}
      onPointerDown={onRaise}
      onDoubleClick={goEntry}
    >
      {side ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -12,
            top: 10,
            width: 0,
            height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: '12px solid #FFFFFF',
          }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -5,
            left: `calc(50% ${40 - shift >= 0 ? '+' : '-'} ${Math.abs(40 - shift)}px)`,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderBottom: '5px solid #FFFFFF',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          width,
          maxHeight,
          overflow: 'hidden',
          borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0,0,0,0.32)',
          background: '#14141f url(/bigdatalab/bg.png) center / cover no-repeat',
          color: '#fff',
          fontStyle: 'normal',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '70%',
            background: 'url(/bigdatalab/skyline.png) center bottom / cover no-repeat',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxHeight: 'inherit',
            overflowY: 'auto',
            // 百科同款半透明滚动条
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.3) transparent',
          }}
        >
          {status === 'loading' && <div style={hintStyle}>加载中...</div>}
          {status === 'notfound' && <div style={hintStyle}>大数据中心暂无此词条</div>}
          {status === 'error' && <div style={hintStyle}>词条加载失败</div>}
          {status === 'ready' && entry && (
            <div style={{ position: 'relative', zIndex: 2, padding: '24px 24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <EntryPinIcon />
                <span style={{ fontSize: 20, fontWeight: 350, lineHeight: 1.3 }}>{entry.title}</span>
              </div>
              <div
                style={{ fontSize: 15, fontWeight: 350, lineHeight: 1.75, color: '#fff' }}
                onClick={(e) => {
                  // 词条正文中的链接不跳转，保持停留在故事页
                  const a = (e.target as HTMLElement).closest('a');
                  if (a) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                dangerouslySetInnerHTML={{ __html: entry.content || '<p>暂无内容</p>' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const STATUS_TEXTS = new Set([
  '获得关键调查点', '开始询问', '关键信息已获得', '完成询问',
  '开始观察', '完成观察', '开始调查', '完成调查',
  '开始分析', '完成分析', '发现关联！', '线索之间似乎没有关联……',
  '胜诉', '辩护成功', '败诉', '辩护失败',
]);

const isStatusLine = (t: string) => STATUS_TEXTS.has(t) || t.startsWith('更新证物记录：');

// 行内标红渲染：支持单个或多个高亮词（单对象/数组两种形式）
const renderHighlightedText = (
  text: string,
  highlight?: { text: string; color: string } | { text: string; color: string }[]
) => {
  if (!highlight) return text;
  const arr = (Array.isArray(highlight) ? highlight : [highlight]).filter((h) => h && h.text && text.includes(h.text));
  if (arr.length === 0) return text;
  const escaped = arr.map((h) => h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = text.split(new RegExp(`(${escaped})`, 'g'));
  return parts.map((seg, i) => {
    const hit = arr.find((h) => h.text === seg);
    return hit ? <span key={i} style={{ color: hit.color }}>{seg}</span> : <Fragment key={i}>{seg}</Fragment>;
  });
};

// 辩论属性标签颜色（仅行首标签上色，正文保持原色）
const ATTRIBUTE_COLORS: Record<string, string> = {
  '【共情】': '#F36789',
  '【直觉】': '#59CF9D',
  '【逻辑】': '#4082FF',
};

const renderAttributeTags = (text: string) => {
  const parts = text.split(/(【(?:共情|直觉|逻辑)】)/g);
  if (parts.length <= 1) return text;
  return (
    <>
      {parts.map((seg, i) => {
        const color = ATTRIBUTE_COLORS[seg];
        return color
          ? <span key={i} style={{ color }}>{seg}</span>
          : <Fragment key={i}>{seg}</Fragment>;
      })}
    </>
  );
};

// 证物详细说明（与搜证记录证物栏展开态一致）
const EvidenceDetailsBody = ({ item, showInferences = true }: { item: EvidenceItem; showInferences?: boolean }) => (
  <>
    {item.details.map((d, i) => (
      <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: '#1E1E1E', margin: '0 0 8px' }}>{d}</p>
    ))}
    {item.inspections?.map((ins) => (
      <div key={ins.target} style={{ margin: '8px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#757575' }}>【点击{ins.target}】</div>
        {ins.result.map((r, i) => (
          <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: '#1E1E1E', margin: '4px 0 8px' }}>{r}</p>
        ))}
      </div>
    ))}
    {showInferences && item.inferences?.map((inf, i) => (
      <div key={i} style={{
        padding: '8px 10px',
        background: '#F5F5F5',
        borderLeft: '2px solid #B8C6D6',
        borderRadius: 4,
        fontSize: 13,
        lineHeight: 1.8,
        color: '#1E1E1E',
        margin: '8px 0',
      }}>
        <span style={{ fontWeight: 600 }}>推论{i + 1}：</span>{inf}
      </div>
    ))}
  </>
);

// 搜证记录气泡：线索/证物内容，在文字行下方展开（顶边贴行底），白底卡片；
// 小三角长在气泡顶边朝上、顶点对准可点名字下划线正中间
// （电脑端气泡左对齐文字行；移动端与词条气泡一样屏幕居中）
const RecordBubble = ({
  item,
  kind,
  showInferences,
  width,
  maxHeight,
  isMobile,
  triOffset,
  raised,
  onRaise,
}: {
  item: EvidenceItem | ClueItem | null;
  kind: 'evidence' | 'clue';
  showInferences: boolean;
  width: number | string;
  maxHeight: number | string;
  isMobile: boolean;
  triOffset: number;
  raised?: boolean;
  onRaise?: () => void;
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [anchorHalf, setAnchorHalf] = useState(0);
  const [shift, setShift] = useState(0);

  // 测量锚点：电脑端三角定位用半宽；移动端屏幕居中用 shift
  useLayoutEffect(() => {
    const measure = () => {
      const anchor = hostRef.current?.parentElement;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setAnchorHalf(rect.width / 2);
      setShift(window.innerWidth / 2 - (rect.left + rect.width / 2));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const triLeft = isMobile
    ? `calc(50% ${triOffset - shift >= 0 ? '+' : '-'} ${Math.abs(triOffset - shift)}px)`
    : `${anchorHalf + triOffset}px`;

  return (
    <div
      ref={hostRef}
      style={{
        position: 'absolute',
        ...(isMobile
          ? {
              left: `calc(50% ${shift >= 0 ? '+' : '-'} ${Math.abs(shift)}px)`,
              transform: 'translateX(-50%)',
            }
          : { left: 0 }),
        top: 'calc(100% + 2px)',
        zIndex: raised ? 6 : 5,
        pointerEvents: 'auto',
      }}
      onPointerDown={onRaise}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -5,
          left: triLeft,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderBottom: '5px solid #FFFFFF',
        }}
      />
    <div style={{
      position: 'relative',
      width,
      maxHeight,
      overflow: 'hidden',
      borderRadius: 12,
      boxShadow: '0 8px 28px rgba(0,0,0,0.32)',
      background: '#FFFFFF',
      color: '#1E1E1E',
      textAlign: 'left',
    }}>
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxHeight: 'inherit',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,0,0,0.25) transparent',
        padding: '16px 20px',
      }}>
        {!item ? (
          <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 14, color: '#9E9E9E' }}>搜证记录暂无此条目</div>
        ) : kind === 'clue' ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1E1E1E', marginBottom: 6 }}>{item.name}</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: '#757575' }}>{(item as ClueItem).description}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1E1E1E', marginBottom: 8 }}>{item.name}</div>
            <EvidenceDetailsBody item={item as EvidenceItem} showInferences={showInferences} />
          </>
        )}
      </div>
    </div>
    </div>
  );
};

const collectThinks = (lines: ScriptLine[]) => {
  const out: Extract<ScriptLine, { type: 'think' }>[] = [];
  const walk = (ls: ScriptLine[]) => {
    for (const l of ls) {
      if (l.type === 'think') out.push(l);
      else if (l.type === 'expand') walk(l.lines);
      else if (l.type === 'choice') l.options.forEach((o) => walk(o.lines));
    }
  };
  walk(lines);
  return out;
};

const SidebarIcon = ({ expand }: { expand?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <line x1="9.5" y1="4" x2="9.5" y2="20" />
    {expand ? (
      <polyline points="13.5 9.5 16.5 12 13.5 14.5" />
    ) : (
      <polyline points="16.5 9.5 13.5 12 16.5 14.5" />
    )}
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const speakerNameColor = (speaker: string) => {
  switch (speaker) {
    case '我':
      return '#C2737D';
    case '左然':
      return '#C25B53';
    case '夏彦':
      return '#C38752';
    case '莫弈':
      return '#689A90';
    case '陆景和':
      return '#756C9F';
    default:
      return '#373447';
  }
};

const testParagraphs = [
  '【测试占位文本】以下内容基于公开剧情梗概整理，仅用于页面排版验证，正式剧情将后续替换。',
  '未名市，四月。雨停了，空气里还浮着一层洗不净的潮气。',
  '忒弥斯律师事务所的会议室里，薛欣然把一份委托合同轻轻推到我面前。',
  '「青萍私房菜的方爷爷，被起诉了。」她的声音压得很低，「那家小馆子开了二十多年，街坊都说他是最和气的人——我不信他会做坏事。」',
  '我翻开卷宗。原告方出具的检测报告上，「海奥森冲剂」几个字被加粗标红。一位靠小馆子撑起晚年的老人，一位坚持替他奔走的委托人，还有一份来路不明的体检记录——线索在桌面上摊开，却没有任何一条直指真相。',
  '「方爷爷，请问您最近服用过什么保健品吗？」我把问题轻轻放在桌上。',
  '老人愣了一下，从抽屉深处摸出几袋冲剂：「就这个啊。喝了小半年，晚上睡得踏实多了。」',
  '窗外，城市的数据流照常奔涌。而在这些看似平常的证词背后，有什么东西正在悄悄失衡。',
];

const iconBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: 4,
  margin: 0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const floatBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  margin: 0,
  width: 36,
  height: 36,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const MIN_WIN_W = 280;
const MIN_WIN_H = 240;

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const StoryChapterPage: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { chapterSlug } = useParams<{ chapterSlug: string }>();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 顶部导航栏是否折成两行（影响左上角浮动按钮的 top）
  const [headerTwoRow, setHeaderTwoRow] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [evidenceTab, setEvidenceTab] = useState<'evidence' | 'clue'>('evidence');
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(new Set());
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, number | string | string[]>>({});
  const [winPos, setWinPos] = useState<{ left: number; top: number } | null>(null);
  const [winSize, setWinSize] = useState<{ width: number; height: number } | null>(null);
  const pendingStageRef = useRef<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number; w: number; h: number } | null>(null);
  const scaleRef = useRef<{ dir: ResizeDir; startX: number; startY: number; startW: number; startH: number; left: number; top: number } | null>(null);
  const winSizeRef = useRef<{ width: number; height: number } | null>(null);

  const [chapterList, setChapterList] = useState<StoryChapterMeta[]>([]);
  const [chapterData, setChapterData] = useState<ChapterStoryData | null>(null);
  const [chapterCgs, setChapterCgs] = useState<{ name: string; imageUrl: string; instance?: string }[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  // 思绪 CG 浮动插图（key=思绪名，同章节内唯一；可同时打开多张）
  const [cgOpen, setCgOpen] = useState<Record<string, boolean>>({});
  // 词条气泡（key=词条名，可与思绪图同时打开）
  const [entryOpen, setEntryOpen] = useState<Record<string, boolean>>({});
  // 搜证记录气泡（key=行 id，同名条目的获得行与更新行各自独立开合）
  const [recordOpen, setRecordOpen] = useState<Record<string, boolean>>({});
  const [topBubble, setTopBubble] = useState<string | null>(null);

  const arcs = groupChaptersByArc(chapterList);
  const currentMeta = chapterList.find((c) => c.slug === chapterSlug);
  const currentChapter: StoryChapter | null = currentMeta
    ? {
        num: currentMeta.num,
        tag: currentMeta.tag,
        title: currentMeta.title,
        slug: currentMeta.slug,
        stages: chapterData ? Object.keys(chapterData.stages) : currentMeta.stageKeys ?? [],
      }
    : null;

  useEffect(() => {
    let alive = true;
    getStoryChapters()
      .then((list) => {
        if (alive) setChapterList(list);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!chapterSlug) return;
    let alive = true;
    setDataLoading(true);
    setChapterData(null);
    setChapterCgs([]);
    setCgOpen({});
    setEntryOpen({});
    setRecordOpen({});
    setDataError('');
    getStoryChapter(chapterSlug)
      .then((d) => {
        if (!alive) return;
        const parsed = JSON.parse(d.data) as ChapterStoryData;
        setChapterData(parsed);
        setChapterCgs(d.cgs ?? []);
        const keys = Object.keys(parsed.stages);
        const pending = pendingStageRef.current;
        pendingStageRef.current = null;
        setSelectedStage(pending ?? keys[0] ?? null);
        setExpanded((prev) => new Set(prev).add(d.slug));
        setDrawerOpen(false);
        mainRef.current?.scrollTo({ top: 0 });
      })
      .catch((err) => {
        if (alive) setDataError(err instanceof Error ? err.message : '章节加载失败');
      })
      .finally(() => {
        if (alive) setDataLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [chapterSlug]);

  useEffect(() => {
    winSizeRef.current = winSize;
  }, [winSize]);

  useEffect(() => {
    const onResize = () => {
      setWinPos((prev) => {
        if (!prev) return prev;
        const size = winSizeRef.current ?? defaultWin().size;
        return {
          left: Math.min(Math.max(0, prev.left), Math.max(0, window.innerWidth - size.width)),
          top: Math.min(Math.max(0, prev.top), Math.max(0, window.innerHeight - size.height)),
        };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!searchOpen && !recordsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setRecordsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, recordsOpen]);

  useEffect(() => {
    if (!recordsOpen) return;
    const onMove = (e: PointerEvent) => {
      if (dragRef.current) {
        const d = dragRef.current;
        const left = Math.min(Math.max(0, d.startLeft + e.clientX - d.startX), Math.max(0, window.innerWidth - d.w));
        const top = Math.min(Math.max(0, d.startTop + e.clientY - d.startY), Math.max(0, window.innerHeight - d.h));
        setWinPos({ left, top });
      } else if (scaleRef.current) {
        const r = scaleRef.current;
        const dx = e.clientX - r.startX;
        const dy = e.clientY - r.startY;
        const dir = r.dir;
        let newLeft = r.left;
        let newTop = r.top;
        let newW = r.startW;
        let newH = r.startH;
        if (dir.includes('e')) {
          newW = Math.min(Math.max(MIN_WIN_W, r.startW + dx), Math.max(MIN_WIN_W, window.innerWidth - r.left - 8));
        }
        if (dir.includes('s')) {
          newH = Math.min(Math.max(MIN_WIN_H, r.startH + dy), Math.max(MIN_WIN_H, window.innerHeight - r.top - 8));
        }
        if (dir.includes('w')) {
          const maxLeft = r.left + r.startW - MIN_WIN_W;
          newLeft = Math.min(Math.max(0, r.left + dx), Math.max(0, maxLeft));
          newW = r.left + r.startW - newLeft;
        }
        if (dir.includes('n')) {
          const maxTop = r.top + r.startH - MIN_WIN_H;
          newTop = Math.min(Math.max(0, r.top + dy), Math.max(0, maxTop));
          newH = r.top + r.startH - newTop;
        }
        if (dir !== 'e' && dir !== 's') {
          setWinPos({ left: newLeft, top: newTop });
        }
        setWinSize({ width: newW, height: newH });
      }
    };
    const onUp = () => {
      dragRef.current = null;
      scaleRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [recordsOpen]);

  // 思绪图 / 词条气泡：ESC 全部收起
  const anyPopupOpen = Object.keys(cgOpen).length > 0 || Object.keys(entryOpen).length > 0 || Object.keys(recordOpen).length > 0;
  useEffect(() => {
    if (!anyPopupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCgOpen({});
        setEntryOpen({});
        setRecordOpen({});
        setTopBubble(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyPopupOpen]);

  // 监测顶部导航栏高度：单行 61、两行 100+，阈值 80 取中间安全带
  useEffect(() => {
    const el = document.querySelector('header');
    if (!el) return;
    const check = () => setHeaderTwoRow(el.getBoundingClientRect().height > 80);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------- 加载 / 错误状态 ----------
  if (dataLoading || (!currentChapter && chapterList.length === 0 && !dataError)) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 61px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
          color: '#9E9E9E',
          fontSize: 15,
        }}
      >
        章节加载中...
      </div>
    );
  }
  if (dataError) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 61px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
          fontSize: 15,
          color: '#595959',
          padding: 24,
        }}
      >
        <div style={{ color: '#D93025' }}>{dataError}</div>
        <button
          type="button"
          onClick={() => navigate('/mainstory')}
          style={{
            padding: '10px 22px',
            borderRadius: 8,
            border: '1px solid #D9D9D9',
            background: '#FFFFFF',
            fontSize: 14,
            color: '#1E1E1E',
            cursor: 'pointer',
          }}
        >
          返回事件簿
        </button>
      </div>
    );
  }
  if (!currentChapter) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 61px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
          fontSize: 15,
          color: '#9E9E9E',
        }}
      >
        <div>章节不存在</div>
        <button
          type="button"
          onClick={() => navigate('/mainstory')}
          style={{
            padding: '10px 22px',
            borderRadius: 8,
            border: '1px solid #D9D9D9',
            background: '#FFFFFF',
            fontSize: 14,
            color: '#1E1E1E',
            cursor: 'pointer',
          }}
        >
          返回事件簿
        </button>
      </div>
    );
  }

  function defaultWin() {
    if (window.innerWidth < 768) {
      const h = window.innerHeight * 0.6;
      return {
        pos: { left: 16, top: window.innerHeight - h - 88 },
        size: { width: window.innerWidth - 32, height: h },
      };
    }
    const h = Math.min(460, window.innerHeight * 0.7);
    return {
      pos: { left: window.innerWidth - 360 - 32, top: window.innerHeight - h - 88 },
      size: { width: 360, height: h },
    };
  }

  const toggleRecords = () => {
    const next = !recordsOpen;
    setRecordsOpen(next);
    if (next) {
      setWinPos(null);
      setWinSize(null);
      setEvidenceTab('evidence');
      setExpandedEvidence(new Set());
    }
  };

  const onTitlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const pos = winPos ?? defaultWin().pos;
    const size = winSize ?? defaultWin().size;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.left,
      startTop: pos.top,
      w: size.width,
      h: size.height,
    };
  };

  const onScalePointerDown = (e: React.PointerEvent, dir: ResizeDir) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const pos = winPos ?? defaultWin().pos;
    const size = winSize ?? defaultWin().size;
    scaleRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
      left: pos.left,
      top: pos.top,
    };
  };

  const toggleCg = (name: string) => {
    setCgOpen((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleEntry = (name: string) => {
    setEntryOpen((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleRecord = (id: string) => {
    setRecordOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resizeHandles: { dir: ResizeDir; style: React.CSSProperties }[] = [
    { dir: 'n', style: { top: 0, left: 14, right: 14, height: 6, cursor: 'ns-resize' } },
    { dir: 's', style: { bottom: 0, left: 14, right: 14, height: 6, cursor: 'ns-resize' } },
    { dir: 'w', style: { left: 0, top: 14, bottom: 14, width: 6, cursor: 'ew-resize' } },
    { dir: 'e', style: { right: 0, top: 14, bottom: 14, width: 6, cursor: 'ew-resize' } },
    { dir: 'nw', style: { top: 0, left: 0, width: 14, height: 14, cursor: 'nwse-resize' } },
    { dir: 'ne', style: { top: 0, right: 0, width: 14, height: 14, cursor: 'nesw-resize' } },
    { dir: 'sw', style: { bottom: 0, left: 0, width: 14, height: 14, cursor: 'nesw-resize' } },
    { dir: 'se', style: { bottom: 0, right: 0, width: 14, height: 14, cursor: 'nwse-resize' } },
  ];

  const handleStageClick = (chapter: StoryChapter, code: string) => {
    if (chapter.slug !== currentChapter.slug) {
      pendingStageRef.current = code;
      navigate(`/mainstory/${chapter.slug}`);
    } else {
      setSelectedStage(code);
    }
    if (isMobile) {
      setDrawerOpen(false);
    }
    mainRef.current?.scrollTo({ top: 0 });
  };

  const toggleChapter = (slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const bodyPadding = isMobile
    ? '32px 24px 140px'
    : '56px 40px 140px 122px';

  const script = selectedStage && chapterData ? chapterData.stages[selectedStage] : undefined;
  const stageThinks = script ? collectThinks(script) : [];
  const evidenceList = chapterData?.evidence ?? [];
  const clueList = chapterData?.clues ?? [];
  const hasEvidence = evidenceList.length > 0;

  const lineEvents = (id: string) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') setActiveLine(id);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') setActiveLine((prev) => (prev === id ? null : prev));
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') setActiveLine(id);
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') setActiveLine(null);
    },
    onPointerCancel: () => setActiveLine(null),
  });

  const highlightStyle = (id: string): React.CSSProperties => ({
    position: 'absolute',
    left: isMobile ? -12 : -122,
    right: isMobile ? -12 : 0,
    top: -3,
    bottom: -3,
    borderRadius: 8,
    background: '#EFEFEA',
    opacity: activeLine === id ? 1 : 0,
    transition: 'opacity 0.15s',
    pointerEvents: 'none',
  });

  // 记录各话题 expand 的逻辑深度（平级 when 单依赖话题按父级深度 + 1 缩进）
  const expandDepthMap: Record<string, number> = {};

  const renderScriptLine = (line: ScriptLine, id: string, depth = 0) => {
    switch (line.type) {
      case 'scene':
        return (
          <div
            key={id}
            {...lineEvents(id)}
            style={{
              position: 'relative',
              margin: id === '0' ? '0 0 16px' : '32px 0 16px',
            }}
          >
            <div style={highlightStyle(id)} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 3, height: 14, borderRadius: 2, background: '#B8C6D6', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#757575' }}>{line.text}</span>
              {line.sub ? (
                <span style={{ fontSize: 13, fontWeight: 600, color: '#757575', marginLeft: 8 }}>{line.sub}</span>
              ) : null}
            </div>
          </div>
        );
      case 'narration': {
        const status = isStatusLine(line.text);
        const needGap = line.text === '完成分析';
        if (line.text === '完成分析' && stageThinks.length > 0) {
          const allCorrect = stageThinks.every((t) => {
            const selRaw = choices[`think:${t.id}`];
            const sel: string[] = Array.isArray(selRaw) ? selRaw : [];
            const opened = choices[`thinkopen:${t.id}`] !== undefined;
            return opened && t.correct.every((c) => sel.includes(c));
          });
          if (!allCorrect) return <div key={id} aria-hidden style={{ height: 30 }} />;
        }
        return (
          <Fragment key={id}>
            <div {...lineEvents(id)} style={{ position: 'relative', margin: '0 0 14px' }}>
              <div style={highlightStyle(id)} />
              <div style={{ position: 'relative', color: status ? '#7A7A7A' : '#5C544E', textAlign: status ? 'center' : undefined }}>
                {renderHighlightedText(line.text, line.highlight)}
              </div>
            </div>
            {needGap && <div aria-hidden style={{ height: 30 }} />}
          </Fragment>
        );
      }
      case 'cg': {
        // 绑定键与后台/后端同规则：思绪=纯名；插画/CG/邀请函=label:name（不同前缀同名不共图）
        const cgLabel = line.label ?? '思绪';
        const bindKey = cgLabel !== '思绪' ? `${cgLabel}:${line.name}` : line.name;
        const bound = chapterCgs.find(
          (c) => c.name === bindKey && Number(c.instance ?? 1) === (line.inst ?? 1),
        );
        const has = !!bound;
        // 同键第 N 次出现为独立实例：开关、置顶、绑图互不影响
        const cgKey = `${bindKey}#${line.inst ?? 1}`;
        const isOpen = has && cgOpen[cgKey];
        return (
          <div key={id} {...lineEvents(id)} style={{ position: 'relative', margin: '0 0 14px' }}>
            <div style={highlightStyle(id)} />
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {isOpen && (
                <CgFloatingImage
                  src={bound!.imageUrl}
                  alt={line.name}
                  width={isMobile ? '56vw' : 230}
                  raised={topBubble === `cg:${cgKey}`}
                  onRaise={() => setTopBubble(`cg:${cgKey}`)}
                />
              )}
              <span
                role={has ? 'button' : undefined}
                tabIndex={has ? 0 : undefined}
                onClick={has ? () => toggleCg(cgKey) : undefined}
                onKeyDown={has ? (e) => { if (e.key === 'Enter') toggleCg(cgKey); } : undefined}
                onMouseEnter={(e) => { if (has) e.currentTarget.style.color = '#5B5B8F'; }}
                onMouseLeave={(e) => { if (has) e.currentTarget.style.color = '#7373A0'; }}
                style={{
                  color: has ? '#7373A0' : '#B0B0B0',
                  cursor: has ? 'pointer' : 'default',
                  userSelect: 'none',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
                title={has ? (isOpen ? '收起思绪图片' : '查看思绪图片') : '暂无图片'}
              >
                {cgLabel === '思绪' ? '思绪【' : `${cgLabel}「`}
                {has ? (
                  <span style={{ textDecoration: 'underline' }}>{line.name}</span>
                ) : (
                  line.name
                )}
                {cgLabel === '思绪' ? '】' : '」'}
              </span>
            </div>
          </div>
        );
      }
      case 'getclue': {
        const entryPrefix = '获得词条：';
        const isEntryLine = line.text.startsWith(entryPrefix) && line.text.length > entryPrefix.length;
        if (isEntryLine) {
          const entryName = line.text.slice(entryPrefix.length);
          const open = !!entryOpen[entryName];
          return (
            <div key={id} {...lineEvents(id)} style={{ position: 'relative', margin: '0 0 14px' }}>
              <div style={highlightStyle(id)} />
              <div style={{ position: 'relative', display: 'inline-block', color: line.color ?? '#A95479', fontStyle: 'italic' }}>
                {open && (
                  <EntryBubble
                    title={entryName}
                    width={isMobile ? '60vw' : 400}
                    maxHeight={isMobile ? '45vh' : 480}
                    side={!isMobile}
                    raised={topBubble === `entry:${entryName}`}
                    onRaise={() => setTopBubble(`entry:${entryName}`)}
                  />
                )}
                {entryPrefix}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleEntry(entryName)}
                  onKeyDown={(e) => { if (e.key === 'Enter') toggleEntry(entryName); }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#6B4A34'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                  style={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontWeight: 500,
                  }}
                  title={open ? '收起词条' : '查看词条'}
                >
                  {entryName}
                </span>
              </div>
            </div>
          );
        }
        const cluePrefix = '获得线索：';
        const updatePrefix = '证物更新：';
        const isClueLine = line.text.startsWith(cluePrefix) && line.text.length > cluePrefix.length;
        const isUpdateLine = line.text.startsWith(updatePrefix) && line.text.length > updatePrefix.length;
        if (isClueLine || isUpdateLine) {
          const recPrefix = isClueLine ? cluePrefix : updatePrefix;
          const recName = line.text.slice(recPrefix.length);
          const clue = clueList.find((c) => c.name === recName);
          const evi = evidenceList.find((e) => e.name === recName);
          const item = (isClueLine ? (clue ?? evi) : (evi ?? clue)) ?? null;
          const kind: 'clue' | 'evidence' = item && 'description' in item ? 'clue' : 'evidence';
          // 证物更新行展示推论；获得行（初次出现）无推论
          const showInferences = isUpdateLine && kind === 'evidence';
          const open = !!recordOpen[id];
          return (
            <div key={id} {...lineEvents(id)} style={{ position: 'relative', margin: '0 0 14px' }}>
              <div style={highlightStyle(id)} />
              <div style={{ position: 'relative', display: 'inline-block', color: line.color ?? '#A95479' }}>
                {open && (
                  <RecordBubble
                    item={item}
                    kind={kind}
                    showInferences={showInferences}
                    width={isMobile ? '70vw' : 400}
                    maxHeight={isMobile ? '45vh' : 480}
                    isMobile={isMobile}
                    triOffset={isClueLine ? 40 : 32}
                    raised={topBubble === `record:${id}`}
                    onRaise={() => setTopBubble(`record:${id}`)}
                  />
                )}
                {recPrefix}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleRecord(id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') toggleRecord(id); }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#6B4A34'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                  style={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontWeight: 500,
                  }}
                  title={open ? '收起记录' : '查看搜证记录'}
                >
                  {recName}
                </span>
              </div>
            </div>
          );
        }
        return (
          <div key={id} {...lineEvents(id)} style={{ position: 'relative', margin: '0 0 14px' }}>
            <div style={highlightStyle(id)} />
            <div style={{ position: 'relative', color: line.color ?? '#A95479', fontStyle: 'italic' }}>{line.text}</div>
          </div>
        );
      }
      case 'dialogue':
      case 'inner': {
        const isMe = line.speaker === '我';
        const nameColor = speakerNameColor(line.speaker);
        return (
          <div key={id} {...lineEvents(id)} style={{
            position: 'relative',
            margin: '0 0 18px',
            fontSize: isMobile ? 15 : 16,
            lineHeight: 1.9,
            color: isMe ? '#773B46' : '#3B3E52',
          }}>
            <div style={highlightStyle(id)} />
            <div style={{ position: 'relative' }}>
              <span style={isMobile ? {
                fontSize: 15,
                fontWeight: 600,
                color: nameColor,
                marginRight: 8,
              } : {
                position: 'absolute',
                right: 'calc(100% + 12px)',
                top: 0,
                fontSize: 15,
                fontWeight: 600,
                color: nameColor,
                whiteSpace: 'nowrap',
                lineHeight: '30.4px',
              }}>
                {line.speaker}
              </span>
              {renderHighlightedText(line.text, line.highlight)}
            </div>
          </div>
        );
      }
      case 'gap':
        return <div key={id} aria-hidden style={{ height: 30 }} />;
      case 'evidencePick': {
        const selKey = `evsel:${line.id}`;
        const expKey = `evexp:${line.id}`;
        const doneKey = `evdone:${line.id}`;
        const dlKey = `evdl:${line.id}`;
        const cfKey = `evcf:${line.id}`;
        const selectedName = typeof choices[selKey] === 'string' ? (choices[selKey] as string) : null;
        const expandedName = typeof choices[expKey] === 'string' ? (choices[expKey] as string) : null;
        const doneName = typeof choices[doneKey] === 'string' ? (choices[doneKey] as string) : null;
        const isCorrect = doneName === line.correct;
        const selItem = selectedName ? evidenceList.find((it) => it.name === selectedName) : undefined;
        return (
          <div key={id} style={{ margin: '0 0 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 320, padding: '2px 2px 12px' }}>
              {evidenceList.map((item) => {
                const active = selectedName === item.name;
                const showDetails = expandedName === item.name;
                return (
                  <div
                    key={item.name}
                    onClick={() => setChoices((prev) => {
                      const next = { ...prev };
                      if (selectedName !== item.name) {
                        next[selKey] = item.name;
                        next[expKey] = item.name;
                        delete next[doneKey];
                      } else if (showDetails) {
                        delete next[expKey];
                      } else {
                        next[expKey] = item.name;
                      }
                      return next;
                    })}
                    style={{
                      flexShrink: 0,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: active ? '1px solid #1E1E1E' : '1px solid #E8E8E8',
                      background: active ? '#EFEFEA' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'background 0.15s, border 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F5F5F3'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1E1E' }}>{item.name}</div>
                    <div style={{
                      fontSize: 12,
                      color: '#757575',
                      marginTop: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {item.summary}
                    </div>
                  </div>
                );
              })}
            </div>
            {selItem && expandedName === selItem.name && (
              <div style={{ padding: '10px 12px', border: '1px solid #E8E8E8', borderRadius: 8, background: '#FAFAFA', marginBottom: 12 }}>
                <EvidenceDetailsBody item={selItem} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 12, paddingLeft: depth * 24 }}>
              <button
                type="button"
                disabled={!selectedName}
                onClick={() => { if (selectedName) setChoices((prev) => ({ ...prev, [doneKey]: selectedName })); }}
                style={{
                  textAlign: 'left',
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: doneName ? '1px solid #1E1E1E' : '1px solid #D9D9D9',
                  background: doneName ? '#EFEFEA' : '#FFFFFF',
                  fontSize: 14,
                  fontWeight: doneName ? 600 : 400,
                  color: '#1E1E1E',
                  cursor: selectedName ? 'pointer' : 'not-allowed',
                  opacity: selectedName ? 1 : 0.5,
                  transition: 'background 0.15s, border 0.15s',
                }}
                onMouseEnter={(e) => { if (selectedName && !doneName) e.currentTarget.style.background = '#F5F5F3'; }}
                onMouseLeave={(e) => { if (!doneName) e.currentTarget.style.background = '#FFFFFF'; }}
              >
                出示证物
              </button>
            </div>
            {doneName && (
              isCorrect ? (
                <div>
                  {line.correctLines.map((l, li) => renderScriptLine(l, `${id}-c${li}`, depth + 1))}
                  {line.debate ? (() => {
                    const debate = line.debate;
                    const dlRaw = choices[dlKey];
                    const dl = dlRaw === 'ledger' || dlRaw === 'print' ? dlRaw : null;
                    const confirmed = choices[cfKey] !== undefined;
                    const debateBtn = (label: string, active: boolean, onClick: () => void) => (
                      <button
                        type="button"
                        onClick={onClick}
                        style={{
                          textAlign: 'left',
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: active ? '1px solid #1E1E1E' : '1px solid #D9D9D9',
                          background: active ? '#EFEFEA' : '#FFFFFF',
                          fontSize: 14,
                          fontWeight: active ? 600 : 400,
                          color: '#1E1E1E',
                          cursor: 'pointer',
                          transition: 'background 0.15s, border 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F5F5F3'; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = '#FFFFFF'; }}
                      >
                        {label}
                      </button>
                    );
                    return (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 12, paddingLeft: depth * 24 }}>
                          {debateBtn(debate.ledgerLabel, dl === 'ledger', () => setChoices((prev) => { const next = { ...prev }; next[dlKey] = 'ledger'; delete next[cfKey]; return next; }))}
                          {debateBtn(debate.printLabel, dl === 'print', () => setChoices((prev) => ({ ...prev, [dlKey]: 'print' })))}
                        </div>
                        {dl === 'ledger' && (
                          <>
                            {debate.ledgerLines.map((l, li) => renderScriptLine(l, `${id}-dl${li}`, depth + 1))}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 12, paddingLeft: depth * 24 }}>
                              {debateBtn(debate.printLabel, confirmed, () => setChoices((prev) => ({ ...prev, [cfKey]: 1 })))}
                            </div>
                            {confirmed && debate.printLines.map((l, li) => renderScriptLine(l, `${id}-dp${li}`, depth + 1))}
                          </>
                        )}
                        {dl === 'print' && debate.printLines.map((l, li) => renderScriptLine(l, `${id}-dp${li}`, depth + 1))}
                      </>
                    );
                  })() : null}
                </div>
              ) : (
                <div>
                  {line.wrongLines.map((l, li) => renderScriptLine(l, `${id}-w${li}`, depth + 1))}
                </div>
              )
            )}
          </div>
        );
      }
      case 'interact': {
        const status = isStatusLine(line.text);
        // 更新证物记录：获得了X！——X 拆为下划线可点，弹搜证记录气泡（初次获得，无推论）
        const recMatch = status ? line.text.match(/^更新证物记录：获得了(.+)！$/) : null;
        if (recMatch) {
          const recName = recMatch[1];
          const evi = evidenceList.find((e) => e.name === recName);
          const clue = clueList.find((c) => c.name === recName);
          const item = evi ?? clue ?? null;
          const kind: 'clue' | 'evidence' = item && 'description' in item ? 'clue' : 'evidence';
          const open = !!recordOpen[id];
          return (
            <div key={id} {...lineEvents(id)} style={{ position: 'relative', margin: '0 0 14px' }}>
              <div style={highlightStyle(id)} />
              <div style={{ position: 'relative', color: '#7A7A7A', textAlign: 'center' }}>
                更新证物记录：获得了
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  {open && (
                    <RecordBubble
                      item={item}
                      kind={kind}
                      showInferences={false}
                      width={isMobile ? '70vw' : 400}
                      maxHeight={isMobile ? '45vh' : 480}
                      isMobile={isMobile}
                      triOffset={0}
                      raised={topBubble === `record:${id}`}
                      onRaise={() => setTopBubble(`record:${id}`)}
                    />
                  )}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleRecord(id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') toggleRecord(id); }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#3A3A3A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                    style={{
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontWeight: 500,
                    }}
                    title={open ? '收起记录' : '查看搜证记录'}
                  >
                    {recName}
                  </span>
                </span>
                ！
              </div>
            </div>
          );
        }
        return (
          <div key={id} {...lineEvents(id)} style={{ position: 'relative', margin: '0 0 14px' }}>
            <div style={highlightStyle(id)} />
            <div style={{ position: 'relative', color: status ? '#7A7A7A' : '#5C544E', textAlign: status ? 'center' : undefined, paddingLeft: status ? undefined : line.indent ?? 0 }}>{status ? line.text : renderAttributeTags(line.text)}</div>
          </div>
        );
      }
      case 'choice': {
        if (line.linked) {
          const linkedRaw = choices[`key:${line.linked}`];
          const linkedSel = typeof linkedRaw === 'number' ? linkedRaw : 0;
          const linkedOpt = line.options[linkedSel];
          return (
            <div key={id} style={{ margin: '0 0 18px' }}>
              {linkedOpt.lines.map((l, li) => renderScriptLine(l, `${id}-${li}`))}
            </div>
          );
        }
        const hasCond = line.options.some((o) => o.when || o.require);
        if (hasCond) {
          const picked = line.options.findIndex(
            (o) =>
              (!o.require || o.require.every((k) => choices[`key:${k}`] !== undefined)) &&
              (!o.when || o.when.every(([k, v]) => choices[`key:${k}`] === v)) &&
              (!o.expandRequire || o.expandRequire.every((k) => choices[`expand:${k}`] !== undefined))
          );
          const pickedOpt = line.options[picked < 0 ? line.options.length - 1 : picked];
          const opened = choices[id] !== undefined;
          return (
            <div key={id} style={{ margin: '0 0 18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 12, paddingLeft: depth * 24 }}>
                <button
                  type="button"
                  onClick={() => setChoices((prev) => ({ ...prev, [id]: picked }))}
                  style={{
                    textAlign: 'left',
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: opened ? '1px solid #1E1E1E' : '1px solid #D9D9D9',
                    background: opened ? '#EFEFEA' : '#FFFFFF',
                    fontSize: 14,
                    fontWeight: opened ? 600 : 400,
                    color: '#1E1E1E',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!opened) e.currentTarget.style.background = '#F5F5F3'; }}
                  onMouseLeave={(e) => { if (!opened) e.currentTarget.style.background = '#FFFFFF'; }}
                >
                  {pickedOpt.label}
                </button>
              </div>
              {opened && (
                <div>
                  {pickedOpt.lines.map((l, li) => renderScriptLine(l, `${id}-${li}`, depth + 1))}
                </div>
              )}
              {line.options.some((o) => o.lines.some((l) => l.type === 'narration' && l.text === '完成观察')) && <div aria-hidden style={{ height: 30 }} />}
            </div>
          );
        }
        const stateKey = line.key ? `key:${line.key}` : id;
        const rawSelected = choices[stateKey];
        const selected: number = typeof rawSelected === 'number' ? rawSelected : 0;
        const opt = line.options[selected];
        const opened = rawSelected !== undefined || !line.defer;
        const shown: ScriptLine[] = !opened
          ? []
          : opt.wrong
          ? line.options.slice(selected).flatMap((o, oi) =>
              oi === 0 ? o.lines : [{ type: 'interact', text: `>【${o.label}】` }, ...o.lines]
            )
          : opt.lines;
        return (
          <div key={id} style={{ margin: '0 0 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 12, paddingLeft: depth * 24 }}>
              {line.options.map((o, oi) => {
                const active = opened && oi === selected;
                return (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => setChoices((prev) => ({ ...prev, [stateKey]: oi }))}
                    style={{
                      textAlign: 'left',
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: active ? '1px solid #1E1E1E' : '1px solid #D9D9D9',
                      background: active ? '#EFEFEA' : '#FFFFFF',
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: '#1E1E1E',
                      cursor: 'pointer',
                      transition: 'background 0.15s, border 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F5F5F3'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <div>
              {shown.map((l, li) => renderScriptLine(l, `${id}-${li}`, depth + 1))}
            </div>
          </div>
        );
      }
      case 'expand': {
        const stateKey = line.id ? `expand:${line.id}` : id;
        if (line.when && !line.when.every((k) => choices[`expand:${k}`] !== undefined)) return null;
        // when 单依赖 = 逻辑子话题（缩进为父级深度 + 1）；多依赖 = 汇总按钮（保持嵌套深度）
        let effDepth = depth;
        if (line.when && line.when.length === 1) {
          const parentDepth = expandDepthMap[line.when[0]];
          if (parentDepth !== undefined) effDepth = Math.max(depth, parentDepth + 1);
        }
        if (line.id) expandDepthMap[line.id] = effDepth;
        const raw = choices[stateKey];
        const opened = raw !== undefined;
        const gateLocked = line.gate && !line.gate.require.every((k) => choices[`expand:${k}`] !== undefined);
        const gateDisabled = gateLocked === true && line.gate?.disabled === true;
        const shownLines = gateLocked && line.gate ? line.gate.lockedLines : line.lines;
        const keyInfoActive =
          line.keyInfo !== undefined && opened && line.keyInfo.every((k) => choices[`expand:${k}`] !== undefined);
        return (
          <div key={id} style={{ margin: '0 0 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: opened ? 12 : 0, paddingLeft: effDepth * 24 }}>
              <button
                type="button"
                disabled={gateDisabled}
                onClick={() => setChoices((prev) => {
                  const next = { ...prev };
                  if (next[stateKey] !== undefined) delete next[stateKey];
                  else next[stateKey] = 1;
                  return next;
                })}
                style={{
                  textAlign: 'left',
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: opened ? '1px solid #1E1E1E' : '1px solid #D9D9D9',
                  background: opened ? '#EFEFEA' : '#FFFFFF',
                  fontSize: 14,
                  fontWeight: opened ? 600 : 400,
                  color: '#1E1E1E',
                  cursor: gateDisabled ? 'not-allowed' : 'pointer',
                  opacity: gateDisabled ? 0.5 : 1,
                  transition: 'background 0.15s, border 0.15s',
                }}
                onMouseEnter={(e) => { if (!opened && !gateDisabled) e.currentTarget.style.background = '#F5F5F3'; }}
                onMouseLeave={(e) => { if (!opened && !gateDisabled) e.currentTarget.style.background = '#FFFFFF'; }}
              >
                {line.label}
              </button>
            </div>
            {opened && !gateDisabled && (
              <div>
                {shownLines.map((l, li) => renderScriptLine(l, `${id}-${li}`, effDepth + 1))}
                {keyInfoActive && renderScriptLine({ type: 'narration', text: '关键信息已获得' }, `${id}-keyinfo`)}
              </div>
            )}
            {line.lines.some((l) => l.type === 'interact' && l.text === '完成询问') && <div aria-hidden style={{ height: 30 }} />}
          </div>
        );
      }
      case 'think': {
        const selKey = `think:${line.id}`;
        const openKey = `thinkopen:${line.id}`;
        const selRaw = choices[selKey];
        const selected: string[] = Array.isArray(selRaw) ? selRaw : [];
        const opened = choices[openKey] !== undefined;
        const isCorrect = line.correct.every((c) => selected.includes(c));
        const toggleClue = (name: string) => {
          setChoices((prev) => {
            const next = { ...prev };
            const arr = Array.isArray(prev[selKey]) ? [...(prev[selKey] as string[])] : [];
            const idx = arr.indexOf(name);
            if (idx >= 0) arr.splice(idx, 1);
            else if (arr.length < 2) arr.push(name);
            else {
              arr.shift();
              arr.push(name);
            }
            next[selKey] = arr;
            delete next[openKey];
            return next;
          });
        };
        const resultLines = isCorrect ? line.correctLines : line.wrongLines;
        const poolNames = line.pool ?? clueList.map((c) => c.name);
        const poolClues = poolNames
          .map((name) => clueList.find((c) => c.name === name))
          .filter((c): c is ClueItem => c !== undefined);
        const isDisabledName = (name: string) => (line.disabled ?? []).includes(name);
        return (
          <div key={id} style={{ margin: '0 0 18px' }}>
            <div style={{ maxHeight: 168, overflowY: 'auto', border: '1px solid #D9D9D9', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {poolClues.map((clue) => {
                const active = selected.includes(clue.name);
                const disabled = isDisabledName(clue.name);
                return (
                  <button
                    key={clue.name}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleClue(clue.name)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: active ? '1px solid #1E1E1E' : '1px solid #D9D9D9',
                      background: active ? '#EFEFEA' : '#FFFFFF',
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: disabled ? '#999999' : '#1E1E1E',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      transition: 'background 0.15s, border 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.background = '#F5F5F3'; }}
                    onMouseLeave={(e) => { if (!active && !disabled) e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    {clue.name}
                  </button>
                );
              })}
            </div>
            {[0, 1].map((i) => {
              const clue = clueList.find((c) => c.name === selected[i]);
              return (
                <div key={i} style={{ border: '1px solid #D9D9D9', borderRadius: 8, padding: '10px 14px', marginBottom: 8, background: '#FFFFFF' }}>
                  {clue ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1E1E' }}>{clue.name}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.8, color: '#4A4A4A', marginTop: 4 }}>{clue.description}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 14, color: '#999999' }}>未选择线索</div>
                  )}
                </div>
              );
            })}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                disabled={selected.length < 2}
                onClick={() => setChoices((prev) => {
                  const next = { ...prev };
                  if (next[openKey] !== undefined) delete next[openKey];
                  else next[openKey] = 1;
                  return next;
                })}
                style={{
                  textAlign: 'left',
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: opened ? '1px solid #1E1E1E' : '1px solid #D9D9D9',
                  background: opened ? '#EFEFEA' : '#FFFFFF',
                  fontSize: 14,
                  fontWeight: opened ? 600 : 400,
                  color: '#1E1E1E',
                  cursor: selected.length < 2 ? 'not-allowed' : 'pointer',
                  opacity: selected.length < 2 ? 0.5 : 1,
                  transition: 'background 0.15s, border 0.15s',
                }}
                onMouseEnter={(e) => { if (!opened && selected.length >= 2) e.currentTarget.style.background = '#F5F5F3'; }}
                onMouseLeave={(e) => { if (!opened && selected.length >= 2) e.currentTarget.style.background = '#FFFFFF'; }}
              >
                思考关联
              </button>
            </div>
            {opened && (
              <div>
                {resultLines.map((l, li) => renderScriptLine(l, `${id}-${li}`))}
              </div>
            )}
          </div>
        );
      }
    }
  };

  const renderSidebarBody = () => (
    <>
      {arcs.map((arc) => (
        <div key={arc.key} style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#757575',
            padding: '0 6px',
            marginBottom: 8,
          }}>
            {arc.name}
          </div>
          {arc.chapters.map((chapter) => {
            const active = chapter.slug === currentChapter.slug;
            const isExpanded = expanded.has(chapter.slug);
            return (
              <div key={chapter.slug}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '10px 10px',
                      borderRadius: 8,
                      background: active ? '#FFFFFF' : 'transparent',
                    }}
                  >
                  <button
                    type="button"
                    onClick={() => toggleChapter(chapter.slug)}
                    style={{ ...iconBtnStyle, padding: 2 }}
                    aria-label={isExpanded ? '收起关卡' : '展开关卡'}
                  >
                    <ChevronIcon collapsed={!isExpanded} />
                  </button>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    minWidth: 0,
                  }}>
                    <div style={{
                      fontSize: 10,
                      lineHeight: 1.1,
                      color: '#9E9E9E',
                      letterSpacing: '0.02em',
                    }}>
                      {chapter.tag}
                    </div>
                    <div style={{
                      fontSize: 16,
                      lineHeight: 1.2,
                      fontWeight: active ? 600 : 400,
                      color: '#1E1E1E',
                    }}>
                      {chapter.title}
                    </div>
                  </div>
                </div>
                {isExpanded && chapter.stages.map((code) => {
                  const stageActive = code === selectedStage;
                  return (
                    <div
                      key={code}
                      onClick={() => handleStageClick(chapter, code)}
                      style={{
                        margin: '2px 0',
                        marginLeft: 24,
                        padding: '5px 10px',
                        borderRadius: 8,
                        background: stageActive ? '#FFFFFF' : 'transparent',
                        fontSize: 14,
                        color: stageActive ? '#1E1E1E' : '#757575',
                        fontWeight: stageActive ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { if (!stageActive) e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                      onMouseLeave={(e) => { if (!stageActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {code}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );

  const renderSidebar = (onClose?: () => void) => (
    <aside style={{
      width: isMobile ? '100%' : 320,
      flexShrink: 0,
      height: '100%',
      background: '#F5F5F5',
      borderRight: isMobile ? 'none' : '1px solid #D9D9D9',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      <div style={{
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={() => navigate('/mainstory')}
          style={iconBtnStyle}
          aria-label="返回事件簿"
        >
          <ChevronLeftIcon />
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1E1E1E' }}>主线</div>
        {!onClose ? (
          <>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              style={{ ...iconBtnStyle, marginLeft: 'auto' }}
              aria-label="搜索章节"
            >
              <SearchIcon size={20} />
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              style={iconBtnStyle}
              aria-label="收起侧边栏"
            >
              <SidebarIcon />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            style={{ ...iconBtnStyle, marginLeft: 'auto' }}
            aria-label="关闭目录"
          >
            <CloseIcon />
          </button>
        )}
      </div>
      {onClose && (
        <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
          <div style={{
            height: 40,
            background: '#FFFFFF',
            border: '1px solid #D9D9D9',
            borderRadius: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            gap: 8,
          }}>
            <span style={{ fontSize: 14, color: '#B3B3B3' }}>搜索章节</span>
            <SearchIcon />
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px' }}>
        {renderSidebarBody()}
      </div>
    </aside>
  );

  const defaultThis = defaultWin();
  const winStyle = {
    left: winPos?.left ?? defaultThis.pos.left,
    top: winPos?.top ?? defaultThis.pos.top,
    width: winSize?.width ?? defaultThis.size.width,
    height: winSize?.height ?? defaultThis.size.height,
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 61px)',
      overflow: 'hidden',
      background: '#FFFFFF',
    }}>
      {!isMobile && !sidebarCollapsed && renderSidebar()}
      <div style={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        height: '100%',
        background: '#F8F8F6',
      }}>
        <div aria-hidden style={{
          position: 'absolute',
          inset: 0,
          background: 'url(/story-bg.png) right center / cover no-repeat',
          opacity: 0.1,
          pointerEvents: 'none',
        }} />
        <main ref={mainRef} style={{
          height: '100%',
          overflowY: 'auto',
          scrollbarGutter: 'stable both-edges',
          background: 'transparent',
          position: 'relative',
        }}>
        {isMobile && (
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#F8F8F6',
            borderBottom: '1px solid #E8E8E8',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <button
              type="button"
              onClick={() => navigate('/mainstory')}
              style={iconBtnStyle}
              aria-label="返回事件簿"
            >
              <ChevronLeftIcon />
            </button>
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 14,
              fontWeight: 600,
              color: '#1E1E1E',
            }}>
              {selectedStage ?? ''}
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              style={iconBtnStyle}
              aria-label="打开目录"
            >
              <MenuIcon />
            </button>
          </div>
        )}
        <div style={{
          maxWidth: 880,
          margin: '0 auto',
          padding: bodyPadding,
        }}>
          <div style={{
            fontSize: isMobile ? 15 : 16,
            lineHeight: 1.9,
            color: '#1E1E1E',
          }}>
            {script
              ? script.map((line, i) => renderScriptLine(line, `${selectedStage}-${i}`))
              : testParagraphs.map((p, i) => (
                <div key={i} {...lineEvents(`test-${i}`)} style={{ position: 'relative', margin: '0 0 18px' }}>
                  <div style={{ position: 'relative' }}>{p}</div>
                </div>
              ))}
          </div>
        </div>
        </main>
      </div>
      {isMobile && drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#F5F5F5' }}>
          {renderSidebar(() => setDrawerOpen(false))}
        </div>
      )}
      {!isMobile && sidebarCollapsed && (
        <div style={{
          position: 'fixed',
          top: headerTwoRow ? 120 : 73,
          left: 12,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            borderRadius: 9999,
            padding: 4,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          }}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              style={floatBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              aria-label="展开侧边栏"
            >
              <SidebarIcon expand />
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              style={floatBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              aria-label="搜索章节"
            >
              <SearchIcon size={20} />
            </button>
          </div>
        </div>
      )}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 480,
              maxWidth: 'calc(100vw - 48px)',
              background: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
              padding: 24,
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              style={{ ...iconBtnStyle, position: 'absolute', top: 16, right: 16 }}
              aria-label="关闭搜索"
            >
              <CloseIcon />
            </button>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1E1E1E', marginBottom: 16 }}>
              搜索章节
            </div>
            <div style={{
              height: 40,
              background: '#F5F5F5',
              border: '1px solid #D9D9D9',
              borderRadius: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px',
              marginBottom: 16,
            }}>
              <SearchIcon />
              <input
                type="text"
                placeholder="输入关键词搜索章节"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  color: '#1E1E1E',
                }}
              />
            </div>
            <div style={{ fontSize: 14, color: '#9E9E9E', textAlign: 'center', padding: '24px 0' }}>
              搜索功能建设中，敬请期待
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={toggleRecords}
        style={{
          position: 'fixed',
          right: isMobile ? 16 : 32,
          bottom: isMobile ? 16 : 32,
          zIndex: 1000,
          background: '#FFFFFF',
          border: '1px solid #D9D9D9',
          borderRadius: 9999,
          padding: isMobile ? '8px 14px' : '10px 18px',
          fontSize: isMobile ? 13 : 14,
          color: '#1E1E1E',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
      >
        搜证记录
      </button>
      {recordsOpen && (
        <div style={{
          position: 'fixed',
          left: winStyle.left,
          top: winStyle.top,
          width: winStyle.width,
          height: winStyle.height,
          zIndex: 1001,
          background: '#FFFFFF',
          border: '1px solid #D9D9D9',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div
            onPointerDown={onTitlePointerDown}
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #E8E8E8',
              flexShrink: 0,
              cursor: 'grab',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1E1E1E' }}>搜证记录</div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setRecordsOpen(false)}
              style={iconBtnStyle}
              aria-label="关闭搜证记录"
            >
              <CloseIcon />
            </button>
          </div>
          {hasEvidence ? (
            <>
              <div style={{
                display: 'flex',
                gap: 24,
                padding: '0 16px',
                borderBottom: '1px solid #E8E8E8',
                flexShrink: 0,
              }}>
                {([['evidence', `证物 ${evidenceList.length}`], ['clue', `线索 ${clueList.length}`]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setEvidenceTab(key); setExpandedEvidence(new Set()); }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '8px 2px 10px',
                      fontSize: 14,
                      fontWeight: evidenceTab === key ? 600 : 400,
                      color: evidenceTab === key ? '#1E1E1E' : '#9E9E9E',
                      borderBottom: evidenceTab === key ? '2px solid #1E1E1E' : '2px solid transparent',
                      marginBottom: -1,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
                {evidenceTab === 'evidence'
                  ? evidenceList.map((item) => {
                    const isOpen = expandedEvidence.has(item.name);
                    return (
                      <div key={item.name} style={{ marginBottom: 8 }}>
                        <div
                          onClick={() => setExpandedEvidence((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.name)) {
                              next.delete(item.name);
                            } else {
                              next.add(item.name);
                            }
                            return next;
                          })}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid #E8E8E8',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1E1E' }}>{item.name}</div>
                          {!isOpen && (
                            <div style={{
                              fontSize: 12,
                              color: '#757575',
                              marginTop: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {item.summary}
                            </div>
                          )}
                        </div>
                        {isOpen && (
                          <div style={{
                            padding: '10px 12px',
                            border: '1px solid #E8E8E8',
                            borderTop: 'none',
                            borderRadius: '0 0 8px 8px',
                            background: '#FAFAFA',
                          }}>
                            {item.details.map((d, i) => (
                              <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: '#1E1E1E', margin: '0 0 8px' }}>{d}</p>
                            ))}
                            {item.inspections?.map((ins) => (
                              <div key={ins.target} style={{ margin: '8px 0' }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#757575' }}>【点击{ins.target}】</div>
                                {ins.result.map((r, i) => (
                                  <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: '#1E1E1E', margin: '4px 0 8px' }}>{r}</p>
                                ))}
                              </div>
                            ))}
                            {item.inferences?.map((inf, i) => (
                              <div key={i} style={{
                                padding: '8px 10px',
                                background: '#F5F5F5',
                                borderLeft: '2px solid #B8C6D6',
                                borderRadius: 4,
                                fontSize: 13,
                                lineHeight: 1.8,
                                color: '#1E1E1E',
                                margin: '8px 0',
                              }}>
                                <span style={{ fontWeight: 600 }}>推论{i + 1}：</span>{inf}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                  : clueList.map((clue) => (
                    <div key={clue.name} style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #E8E8E8',
                      background: '#FFFFFF',
                      marginBottom: 8,
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1E1E' }}>{clue.name}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.8, color: '#757575', marginTop: 4 }}>{clue.description}</div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ fontSize: 14, color: '#9E9E9E' }}>暂无搜证记录</div>
            </div>
          )}
          {resizeHandles.map((h) => (
            <div
              key={h.dir}
              onPointerDown={(e) => onScalePointerDown(e, h.dir)}
              style={{
                position: 'absolute',
                zIndex: 2,
                touchAction: 'none',
                ...h.style,
              }}
            />
          ))}
          <div style={{ position: 'absolute', right: 4, bottom: 4, zIndex: 1, pointerEvents: 'none' }}>
            <ResizeGripIcon />
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryChapterPage;
