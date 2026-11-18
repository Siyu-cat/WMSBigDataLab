import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { navItems } from '../config/nav';
import type { NavItem } from '../config/nav';
import { useIsMobile } from '../hooks/useIsMobile';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // 桌面端当前展开子菜单的主菜单 key
  const [openKey, setOpenKey] = useState<string | null>(null);
  // 桌面端二级面板的位置与宽度（悬停时按相邻按钮实测，top 为面板顶到 header 底边的间距）
  const [panelBox, setPanelBox] = useState<{ left: number; top: number; width: number } | null>(null);
  // 移动端手风琴展开的主菜单 key 集合
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const closeTimer = useRef<number | null>(null);

  const showToast = useCallback((label: string) => {
    setToast(`「${label}」建设中，敬请期待`);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setMenuOpen(false);
    setOpenKey(null);
    setExpanded(new Set());
  }, [location.pathname]);

  // 事件簿在其主页面与两个拆分路由下都高亮
  const isStoryActive = /^\/(mainstory|pastevent)/.test(location.pathname);

  const isActive = (item: NavItem) => {
    if (item.key === 'story') return isStoryActive;
    if (!item.to) return false;
    return location.pathname === item.to;
  };

  const closeMenu = () => setMenuOpen(false);

  const openMenu = (key: string) => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenKey(key);
  };

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenKey(null), 120);
  };

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const makeBaseStyle = (vertical: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: vertical ? 'flex-start' : 'center',
    padding: vertical ? '14px 24px' : '10px',
    borderRadius: '8px',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1,
    color: vertical ? '#1E1E1E' : '#FFFFFF',
    background: 'transparent',
    transition: 'background 0.15s',
    whiteSpace: 'nowrap',
    width: vertical ? '100%' : undefined,
    boxSizing: 'border-box',
  });

  // 通用叶子项渲染：href 整页跳转 / to 路由 / comingSoon 弹提示
  const renderItem = (item: NavItem, vertical: boolean, styleOverride?: React.CSSProperties, dark?: boolean) => {
    const bgActive = dark || !vertical ? 'rgba(255, 255, 255, 0.18)' : '#F5F5F5';
    const bgHover = dark || !vertical ? 'rgba(255, 255, 255, 0.12)' : '#F5F5F5';
    const baseStyle = { ...makeBaseStyle(vertical), ...(styleOverride ?? {}) };
    baseStyle.background = isActive(item) ? bgActive : 'transparent';

    const hoverIn = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = bgHover; };
    const hoverOut = (e: React.MouseEvent<HTMLElement>, active: boolean) => {
      e.currentTarget.style.background = active ? bgActive : 'transparent';
    };

    if (item.href) {
      return (
        <a
          key={item.key}
          href={item.href}
          style={baseStyle}
          onMouseEnter={hoverIn}
          onMouseLeave={(e) => hoverOut(e, isActive(item))}
        >
          {item.label}
        </a>
      );
    }

    if (item.to) {
      return (
        <Link
          key={item.key}
          to={item.to}
          style={baseStyle}
          onClick={closeMenu}
          onMouseEnter={hoverIn}
          onMouseLeave={(e) => hoverOut(e, isActive(item))}
        >
          {item.label}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => { showToast(item.label); closeMenu(); }}
        style={{ ...baseStyle, border: 'none' }}
        onMouseEnter={hoverIn}
        onMouseLeave={(e) => hoverOut(e, false)}
      >
        {item.label}
      </button>
    );
  };

  // 桌面端主菜单：带子菜单的项悬停展开面板；事件簿主字点击进主线，其余无动作
  // 面板宽度 = 半间隙 + 本按钮 + 一整个间隙 + 相邻按钮 + 半间隙（悬停时实测）
  const renderDesktopItem = (item: NavItem) => {
    const bgActive = 'rgba(255, 255, 255, 0.18)';
    const bgHover = 'rgba(255, 255, 255, 0.12)';
    const baseStyle = makeBaseStyle(false);
    baseStyle.background = isActive(item) ? bgActive : 'transparent';
    const hoverIn = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = bgHover; };
    const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.background = isActive(item) ? bgActive : 'transparent';
    };

    if (item.children) {
      const mainButton = item.to ? (
        <Link to={item.to} style={baseStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          {item.label}
        </Link>
      ) : (
        <button
          type="button"
          style={{ ...baseStyle, border: 'none', cursor: 'default' }}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
        >
          {item.label}
        </button>
      );

      const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
        if (closeTimer.current) {
          window.clearTimeout(closeTimer.current);
          closeTimer.current = null;
        }
        const wrapper = e.currentTarget;
        const nav = wrapper.parentElement;
        const gap = nav ? parseFloat(getComputedStyle(nav).gap) || 20 : 20;
        const half = gap / 2;
        const next = wrapper.nextElementSibling as HTMLElement | null;
        const width = wrapper.offsetWidth + (next?.offsetWidth ?? 0) + gap * 2;
        // 面板顶边与 header 底边重合（盖住 1px 下边框，深紫连成一片）：量出差值再减去边框宽
        const headerEl = wrapper.closest('header');
        const borderWidth = headerEl ? parseFloat(getComputedStyle(headerEl).borderBottomWidth) || 0 : 0;
        const top = headerEl
          ? headerEl.getBoundingClientRect().bottom - borderWidth - wrapper.getBoundingClientRect().bottom
          : 0;
        setPanelBox({ left: -half, top, width });
        setOpenKey(item.key);
      };

      return (
        <div
          key={item.key}
          style={{ position: 'relative', display: 'flex' }}
          onMouseEnter={handleEnter}
          onMouseLeave={scheduleClose}
        >
          {mainButton}
          {/* 透明桥：盖住按钮底边到 header 底边的空隙，防止鼠标穿越时触发收起 */}
          {openKey === item.key && panelBox && panelBox.top > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, height: panelBox.top }} />
          )}
          {openKey === item.key && panelBox && (
            <div
              style={{
                position: 'absolute',
                top: `calc(100% + ${panelBox.top}px)`,
                left: panelBox.left,
                width: panelBox.width,
                display: 'flex',
                flexDirection: 'column',
                background: '#555371',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
                padding: '6px 0',
                // 最多显示 5 个子项（44px/项 + 面板上下 padding），超出滚动
                maxHeight: 232,
                overflowY: 'auto',
                zIndex: 30,
              }}
              onMouseEnter={() => openMenu(item.key)}
              onMouseLeave={scheduleClose}
            >
              {item.children.map((child) => renderItem(child, true, { paddingLeft: 20, paddingRight: 20, borderRadius: 0, color: '#FFFFFF' }, true))}
            </div>
          )}
        </div>
      );
    }

    return renderItem(item, false);
  };

  // 移动端主菜单：带子菜单的项点击手风琴展开
  const renderMobileItem = (item: NavItem) => {
    if (!item.children) return renderItem(item, true);

    const isOpen = expanded.has(item.key);
    const baseStyle = makeBaseStyle(true);
    return (
      <div key={item.key} style={{ width: '100%' }}>
        <button
          type="button"
          onClick={() => toggleExpand(item.key)}
          style={{ ...baseStyle, border: 'none', justifyContent: 'space-between', background: '#FFFFFF' }}
        >
          {item.label}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9E9E9E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            {isOpen ? <polyline points="6 15 12 9 18 15" /> : <polyline points="6 9 12 15 18 9" />}
          </svg>
        </button>
        {isOpen && (
          <div style={{
            background: '#FAFAFA',
            // 最多显示 5 个子项，超出滚动
            maxHeight: 232,
            overflowY: 'auto',
          }}>
            {item.children.map((child) => renderItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <header style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '9px 20px' : '9px 64px',
        gap: '16px 24px',
        background: '#555371',
        borderBottom: '1px solid #D9D9D9',
        position: 'relative',
        zIndex: 10,
      }}>
        <Link to="/" style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }} onClick={closeMenu}>
          <img
            src="/favicon.png"
            alt="logo"
            style={{ width: 48, height: 42, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span style={{ fontSize: 19, fontWeight: 400, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
            {/^\/(mainstory|pastevent)/.test(location.pathname) ? '事件簿' : '未名市大数据中心'}
          </span>
        </Link>

        {isMobile ? (
          <button
            type="button"
            aria-label="打开导航菜单"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 42,
              height: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              flexShrink: 0,
              padding: 12,
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </>
              ) : (
                <>
                  <line x1="3" y1="5.5" x2="17" y2="5.5" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14.5" x2="17" y2="14.5" />
                </>
              )}
            </svg>
          </button>
        ) : (
          <nav style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            {navItems.map((item) => renderDesktopItem(item))}
          </nav>
        )}

        {isMobile && menuOpen && (
          <nav style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderBottom: '1px solid #D9D9D9',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
            zIndex: 20,
          }}>
            {navItems.map((item) => renderMobileItem(item))}
          </nav>
        )}
      </header>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.78)',
          color: '#fff',
          padding: '14px 28px',
          borderRadius: '8px',
          fontSize: 16,
          zIndex: 1000,
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </>
  );
};

export default Header;
