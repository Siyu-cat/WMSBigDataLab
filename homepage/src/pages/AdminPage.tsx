import { useState, useEffect } from 'react';
import {
  login,
  importEntryPreview,
  importEntrySave,
  UnauthorizedError,
} from '../services/adminService';
import type { WordImportEntry, ImportResult } from '../services/adminService';
import {
  previewStoryImport,
  saveStoryImport,
  getStoryChapters,
  getStoryChapter,
  uploadStoryCg,
} from '../services/storyService';
import type { StoryPreviewResult, StorySaveResult, StoryChapterMeta } from '../services/storyService';
import { getUser, setUser, setToken, clearToken, getToken } from '../services/auth';
import type { User } from '../services/auth';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #E8E8E8',
  fontSize: 15,
  boxSizing: 'border-box',
  outline: 'none',
  background: '#FFFFFF',
};

const primaryBtn: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 8,
  border: 'none',
  background: '#1E1E1E',
  color: '#FFFFFF',
  fontSize: 15,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 8,
  border: '1px solid #D9D9D9',
  background: '#FFFFFF',
  color: '#1E1E1E',
  fontSize: 15,
  cursor: 'pointer',
};

const AdminPage: React.FC = () => {
  const [user, setUserState] = useState<User | null>(() =>
    getToken() ? getUser() : null
  );

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [entryFile, setEntryFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<WordImportEntry[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [actionError, setActionError] = useState('');
  const [authExpired, setAuthExpired] = useState(false);

  // 主线导入
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<StoryPreviewResult | null>(null);
  const [storySlug, setStorySlug] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [storyArc, setStoryArc] = useState('haiosen');
  const [storyPreviewLoading, setStoryPreviewLoading] = useState(false);
  const [storySaving, setStorySaving] = useState(false);
  const [storyResult, setStoryResult] = useState<StorySaveResult | null>(null);
  const [storyError, setStoryError] = useState('');
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);

  // 思绪图片管理
  const [cgChapterSlug, setCgChapterSlug] = useState('');
  const [cgChapterList, setCgChapterList] = useState<StoryChapterMeta[]>([]);
  // 思绪行实例列表（同键第 N 次出现 = 独立实例）；cgMap key = `${绑定键}#${inst}`
  // 绑定键：思绪=纯名；插画/CG/邀请函=label:name（与后端 cgBindKey 同规则）
  const [cgItems, setCgItems] = useState<{ name: string; label?: string; inst: number }[]>([]);
  const [cgMap, setCgMap] = useState<Record<string, string>>({});
  const [cgLoading, setCgLoading] = useState(false);
  const [cgUploading, setCgUploading] = useState<string | null>(null);
  const [cgError, setCgError] = useState('');
  const [cgNotice, setCgNotice] = useState('');

  useEffect(() => {
    if (!user) return;
    getStoryChapters()
      .then((list) => {
        setExistingSlugs(list.map((c) => c.slug));
        setCgChapterList(list);
      })
      .catch(() => setExistingSlugs([]));
  }, [user]);

  /** 选择章节：加载详情并递归提取所有「思绪【名称】」行（含嵌套块） */
  const handleCgChapterChange = async (slug: string) => {
    setCgChapterSlug(slug);
    setCgError('');
    setCgNotice('');
    if (!slug) {
      setCgItems([]);
      setCgMap({});
      return;
    }
    setCgLoading(true);
    try {
      const d = await getStoryChapter(slug);
      const parsed = JSON.parse(d.data) as { stages?: Record<string, unknown[]> };
      const items: { name: string; label?: string; inst: number }[] = [];
      const seen = new Set<string>();
      const walk = (arr: unknown[]): void => {
        if (!Array.isArray(arr)) return;
        for (const item of arr) {
          if (!item || typeof item !== 'object') continue;
          const l = item as {
            type?: string;
            name?: string;
            label?: string;
            inst?: number;
            lines?: unknown[];
            options?: { lines?: unknown[] }[];
            correctLines?: unknown[];
            wrongLines?: unknown[];
            debate?: { ledgerLines?: unknown[]; printLines?: unknown[] };
            gate?: { lockedLines?: unknown[] };
          };
          if (l.type === 'cg' && l.name) {
            const inst = Number(l.inst ?? 1) || 1;
            const label = l.label && l.label !== '思绪' ? l.label : undefined;
            const bindKey = label ? `${label}:${l.name}` : l.name;
            const key = `${bindKey}#${inst}`;
            if (!seen.has(key)) {
              seen.add(key);
              items.push({ name: l.name, label, inst });
            }
          }
          if (l.lines) walk(l.lines);
          if (l.options) l.options.forEach((o) => o.lines && walk(o.lines));
          if (l.correctLines) walk(l.correctLines);
          if (l.wrongLines) walk(l.wrongLines);
          if (l.debate) {
            if (l.debate.ledgerLines) walk(l.debate.ledgerLines);
            if (l.debate.printLines) walk(l.debate.printLines);
          }
          if (l.gate?.lockedLines) walk(l.gate.lockedLines);
        }
      };
      Object.values(parsed.stages ?? {}).forEach(walk);
      setCgItems(items);
      const map: Record<string, string> = {};
      (d.cgs ?? []).forEach((c) => { map[`${c.name}#${Number(c.instance ?? 1) || 1}`] = c.imageUrl; });
      setCgMap(map);
    } catch (err) {
      setCgError(err instanceof Error ? err.message : '章节加载失败');
      setCgItems([]);
      setCgMap({});
    } finally {
      setCgLoading(false);
    }
  };

  const handleCgUpload = async (bindKey: string, inst: number, file: File, display: string) => {
    if (!cgChapterSlug) return;
    const mapKey = `${bindKey}#${inst}`;
    setCgUploading(mapKey);
    setCgError('');
    setCgNotice('');
    try {
      const r = await uploadStoryCg(cgChapterSlug, bindKey, file, inst);
      setCgMap((prev) => ({ ...prev, [mapKey]: r.imageUrl }));
      setCgNotice(`「${display}」图片已${cgMap[mapKey] ? '替换' : '上传'}`);
    } catch (err) {
      if (handleAuthError(err)) return;
      setCgError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setCgUploading(null);
    }
  };

  const handleAuthError = (err: unknown): boolean => {
    if (err instanceof UnauthorizedError) {
      clearToken();
      setUserState(null);
      setAuthExpired(true);
      return true;
    }
    return false;
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError('请输入用户名和密码');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const data = await login(username.trim(), password);
      setToken(data.token);
      const u: User = { id: '', username: data.username, role: 'admin' };
      setUser(u);
      setUserState(u);
      setAuthExpired(false);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setUserState(null);
    setUsername('');
    setPassword('');
  };

  const resetEntryState = () => {
    setEntryFile(null);
    setPreviewData([]);
    setImportResult(null);
    setActionError('');
  };

  const handlePreview = async () => {
    if (!entryFile) return;
    setPreviewLoading(true);
    setActionError('');
    setImportResult(null);
    try {
      const data = await importEntryPreview(entryFile);
      setPreviewData(data);
    } catch (err) {
      if (handleAuthError(err)) return;
      setActionError(err instanceof Error ? err.message : '文件解析失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;
    setSaving(true);
    setActionError('');
    try {
      const result = await importEntrySave(previewData);
      setImportResult(result);
    } catch (err) {
      if (handleAuthError(err)) return;
      setActionError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setSaving(false);
    }
  };

  // ---------- 主线导入 ----------
  const slugFromTag = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9]/g, '');

  const resetStoryState = () => {
    setStoryFile(null);
    setStoryPreview(null);
    setStorySlug('');
    setStoryTitle('');
    setStoryArc('haiosen');
    setStoryResult(null);
    setStoryError('');
  };

  const handleStoryPreview = async () => {
    if (!storyFile) return;
    setStoryPreviewLoading(true);
    setStoryError('');
    setStoryResult(null);
    try {
      const data = await previewStoryImport(storyFile);
      setStoryPreview(data);
      setStorySlug(slugFromTag(data.tag));
      setStoryTitle(data.title);
    } catch (err) {
      if (handleAuthError(err)) return;
      setStoryError(err instanceof Error ? err.message : '文件解析失败');
    } finally {
      setStoryPreviewLoading(false);
    }
  };

  const handleStorySave = async () => {
    if (!storyPreview || !storySlug.trim() || !storyTitle.trim()) return;
    if (!/^[a-z0-9-]{1,64}$/.test(storySlug.trim())) {
      setStoryError('章节标识只能包含小写字母、数字和连字符（1-64位）');
      return;
    }
    setStorySaving(true);
    setStoryError('');
    try {
      const result = await saveStoryImport({
        slug: storySlug.trim(),
        title: storyTitle.trim(),
        tag: storyPreview.tag,
        num: storyPreview.num,
        arc: storyArc,
        data: storyPreview.data,
      });
      setStoryResult(result);
      setExistingSlugs((prev) =>
        prev.includes(result.slug) ? prev : [...prev, result.slug]
      );
    } catch (err) {
      if (handleAuthError(err)) return;
      setStoryError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setStorySaving(false);
    }
  };

  // ---------- 登录视图 ----------
  if (!user) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 61px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F0F1F5',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            borderRadius: 12,
            padding: '40px 36px',
            boxSizing: 'border-box',
          }}
        >
          <h2
            style={{
              margin: '0 0 8px 0',
              fontSize: 22,
              fontWeight: 600,
              color: '#1E1E1E',
              textAlign: 'center',
            }}
          >
            管理后台登录
          </h2>
          <p
            style={{
              margin: '0 0 28px 0',
              fontSize: 13,
              color: '#9E9E9E',
              textAlign: 'center',
            }}
          >
            词条导入 · 主线管理
          </p>

          {authExpired && !loginError && (
            <div
              style={{
                padding: '10px 12px',
                marginBottom: 16,
                borderRadius: 8,
                background: '#FFF7E6',
                border: '1px solid #FFD591',
                color: '#D48806',
                fontSize: 13,
              }}
            >
              登录已过期，请重新登录
            </div>
          )}

          {loginError && (
            <div
              style={{
                padding: '10px 12px',
                marginBottom: 16,
                borderRadius: 8,
                background: '#FFF1F0',
                border: '1px solid #FFA39E',
                color: '#D93025',
                fontSize: 13,
              }}
            >
              {loginError}
            </div>
          )}

          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{ ...inputStyle, marginBottom: 14 }}
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{ ...inputStyle, marginBottom: 24 }}
          />
          <button
            onClick={handleLogin}
            disabled={loginLoading}
            style={{
              ...primaryBtn,
              width: '100%',
              background: loginLoading ? '#9E9E9E' : '#1E1E1E',
              cursor: loginLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {loginLoading ? '登录中...' : '登录'}
          </button>
        </div>
      </div>
    );
  }

  // ---------- 管理页视图 ----------
  const validEntries = previewData.filter((e) => !e.skipped);
  const skippedEntries = previewData.filter((e) => e.skipped);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 61px)',
        background: '#F0F1F5',
        padding: '32px 24px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1E1E1E' }}>
            管理后台
          </h1>
          <span style={{ fontSize: 14, color: '#9E9E9E' }}>{user.username}</span>
          <button
            onClick={handleLogout}
            style={{ ...secondaryBtn, marginLeft: 'auto', padding: '8px 18px', fontSize: 14 }}
          >
            退出登录
          </button>
        </div>

        {/* 词条导入卡片 */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#1E1E1E' }}>
              词条 Word 导入
            </h2>
            <span style={{ fontSize: 13, color: '#9E9E9E' }}>
              支持 .docx，行格式：#分类##标题###内容
            </span>
          </div>

          {actionError && (
            <div
              style={{
                padding: '10px 12px',
                marginTop: 16,
                borderRadius: 8,
                background: '#FFF1F0',
                border: '1px solid #FFA39E',
                color: '#D93025',
                fontSize: 13,
              }}
            >
              {actionError}
            </div>
          )}

          {/* 文件选择 + 操作 */}
          <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <label
              style={{
                ...secondaryBtn,
                display: 'inline-block',
                padding: '10px 20px',
                fontSize: 14,
                marginBottom: 0,
              }}
            >
              选择文件
              <input
                type="file"
                accept=".docx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setEntryFile(f);
                  setPreviewData([]);
                  setImportResult(null);
                  setActionError('');
                  e.target.value = '';
                }}
              />
            </label>
            <span style={{ fontSize: 14, color: entryFile ? '#1E1E1E' : '#9E9E9E' }}>
              {entryFile ? entryFile.name : '未选择文件'}
            </span>
            <button
              onClick={handlePreview}
              disabled={!entryFile || previewLoading}
              style={{
                ...primaryBtn,
                padding: '10px 20px',
                fontSize: 14,
                marginLeft: 'auto',
                background:
                  !entryFile || previewLoading ? '#C9C9C9' : '#1E1E1E',
                cursor: !entryFile || previewLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {previewLoading ? '解析中...' : '解析预览'}
            </button>
          </div>

          {/* 预览结果 */}
          {previewData.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  fontSize: 13,
                  color: '#9E9E9E',
                  marginBottom: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span>共 {previewData.length} 条</span>
                <span style={{ color: '#389E0D' }}>可导入 {validEntries.length} 条</span>
                <span style={{ color: skippedEntries.length > 0 ? '#D48806' : '#9E9E9E' }}>
                  跳过 {skippedEntries.length} 条
                </span>
              </div>

              <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid #E8E8E8', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F7F7F7' }}>
                      <th style={cellStyle}>#</th>
                      <th style={cellStyle}>分类</th>
                      <th style={cellStyle}>标题</th>
                      <th style={cellStyle}>内容</th>
                      <th style={cellStyle}>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, i) => (
                      <tr key={i} style={{ background: item.skipped ? '#FFFBE6' : '#FFFFFF' }}>
                        <td style={cellStyle}>{i + 1}</td>
                        <td style={cellStyle}>
                          {[item.level1Category, item.level2Category].filter(Boolean).join(' / ') || '—'}
                        </td>
                        <td style={{ ...cellStyle, color: '#1E1E1E', fontWeight: 500 }}>
                          {item.title || '—'}
                        </td>
                        <td style={{ ...cellStyle, color: '#9E9E9E', maxWidth: 320, wordBreak: 'break-all' }}>
                          {item.content ? item.content.slice(0, 60) + (item.content.length > 60 ? '…' : '') : '—'}
                        </td>
                        <td style={{ ...cellStyle, color: item.skipped ? '#D48806' : '#389E0D' }}>
                          {item.skipped ? `跳过：${item.skipReason || '格式不符'}` : '正常'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleImport}
                  disabled={saving || validEntries.length === 0}
                  style={{
                    ...primaryBtn,
                    padding: '10px 24px',
                    fontSize: 14,
                    background:
                      saving || validEntries.length === 0 ? '#C9C9C9' : '#1E1E1E',
                    cursor: saving || validEntries.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? '导入中...' : `确认导入 ${validEntries.length} 条`}
                </button>
                <button onClick={resetEntryState} style={{ ...secondaryBtn, padding: '10px 20px', fontSize: 14 }}>
                  清空重选
                </button>
              </div>

              {importResult && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: '#F6FFED',
                    border: '1px solid #B7EB8F',
                    fontSize: 14,
                    color: '#135200',
                  }}
                >
                  导入完成：新增 {importResult.created} 条 · 更新 {importResult.updated} 条 · 跳过{' '}
                  {importResult.skipped} 条 · 失败 {importResult.errors} 条
                </div>
              )}
            </div>
          )}
        </div>

        {/* 主线导入卡片 */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#1E1E1E' }}>
              主线 Word 导入
            </h2>
            <span style={{ fontSize: 13, color: '#9E9E9E' }}>
              第一段 = 章节头（如 Episode.1人情冷暖），其后按幕与档案区书写
            </span>
          </div>

          {storyError && (
            <div
              style={{
                padding: '10px 12px',
                marginTop: 16,
                borderRadius: 8,
                background: '#FFF1F0',
                border: '1px solid #FFA39E',
                color: '#D93025',
                fontSize: 13,
              }}
            >
              {storyError}
            </div>
          )}

          {/* 文件选择 + 解析 */}
          <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <label
              style={{
                ...secondaryBtn,
                display: 'inline-block',
                padding: '10px 20px',
                fontSize: 14,
                marginBottom: 0,
              }}
            >
              选择文件
              <input
                type="file"
                accept=".docx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setStoryFile(f);
                  setStoryPreview(null);
                  setStoryResult(null);
                  setStoryError('');
                  e.target.value = '';
                }}
              />
            </label>
            <span style={{ fontSize: 14, color: storyFile ? '#1E1E1E' : '#9E9E9E' }}>
              {storyFile ? storyFile.name : '未选择文件'}
            </span>
            <button
              onClick={handleStoryPreview}
              disabled={!storyFile || storyPreviewLoading}
              style={{
                ...primaryBtn,
                padding: '10px 20px',
                fontSize: 14,
                marginLeft: 'auto',
                background: !storyFile || storyPreviewLoading ? '#C9C9C9' : '#1E1E1E',
                cursor: !storyFile || storyPreviewLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {storyPreviewLoading ? '解析中...' : '解析预览'}
            </button>
          </div>

          {/* 预览结果 + 导入参数 */}
          {storyPreview && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  fontSize: 13,
                  color: '#595959',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  章节头：<b style={{ color: '#1E1E1E' }}>{storyPreview.tag}</b> ·{' '}
                  <b style={{ color: '#1E1E1E' }}>{storyPreview.title}</b>
                </span>
                <span>幕 {storyPreview.stageKeys.length} 个</span>
                <span>证物 {storyPreview.evidenceCount} 件</span>
                <span>词条 {storyPreview.clueCount} 条</span>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#9E9E9E',
                  background: '#F7F7F7',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 16,
                  wordBreak: 'break-all',
                  lineHeight: 1.7,
                }}
              >
                幕顺序：{storyPreview.stageKeys.map((k) => `${k}(${storyPreview.stageCounts[k] ?? 0})`).join('、')}
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <label style={{ fontSize: 13, color: '#595959' }}>
                  章节标识（slug）
                  <input
                    type="text"
                    value={storySlug}
                    onChange={(e) => setStorySlug(e.target.value.toLowerCase())}
                    placeholder="episode1"
                    style={{ ...inputStyle, marginTop: 6, fontSize: 14, padding: '9px 12px' }}
                  />
                </label>
                <label style={{ fontSize: 13, color: '#595959', flex: '1 1 200px' }}>
                  章节标题
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="人情冷暖"
                    style={{ ...inputStyle, marginTop: 6, fontSize: 14, padding: '9px 12px' }}
                  />
                </label>
                <label style={{ fontSize: 13, color: '#595959' }}>
                  所属篇章
                  <select
                    value={storyArc}
                    onChange={(e) => setStoryArc(e.target.value)}
                    style={{ ...inputStyle, marginTop: 6, fontSize: 14, padding: '9px 12px' }}
                  >
                    <option value="haiosen">海奥森篇</option>
                    <option value="jianlangu">剑兰谷篇</option>
                    <option value="yaning">亚宁篇</option>
                  </select>
                </label>
              </div>

              {storySlug && existingSlugs.includes(storySlug.trim()) && (
                <div
                  style={{
                    padding: '10px 12px',
                    marginTop: 14,
                    borderRadius: 8,
                    background: '#FFFBE6',
                    border: '1px solid #FFD591',
                    color: '#D48806',
                    fontSize: 13,
                  }}
                >
                  标识「{storySlug.trim()}」已存在：直接导入 = 覆盖更新该章节；想新建请修改标识。
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleStorySave}
                  disabled={storySaving || !storySlug.trim() || !storyTitle.trim()}
                  style={{
                    ...primaryBtn,
                    padding: '10px 24px',
                    fontSize: 14,
                    background:
                      storySaving || !storySlug.trim() || !storyTitle.trim()
                        ? '#C9C9C9'
                        : '#1E1E1E',
                    cursor:
                      storySaving || !storySlug.trim() || !storyTitle.trim()
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {storySaving
                    ? '导入中...'
                    : existingSlugs.includes(storySlug.trim())
                      ? '确认导入（覆盖更新）'
                      : '确认导入'}
                </button>
                <button onClick={resetStoryState} style={{ ...secondaryBtn, padding: '10px 20px', fontSize: 14 }}>
                  清空重选
                </button>
              </div>

              {storyResult && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: '#F6FFED',
                    border: '1px solid #B7EB8F',
                    fontSize: 14,
                    color: '#135200',
                  }}
                >
                  {storyResult.created ? '已新建' : '已更新'}章节{' '}
                  <b>{storyResult.slug}</b>，事件簿目录已可显示该章节。
                </div>
              )}
            </div>
          )}
        </div>

        {/* 思绪图片管理卡片 */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#1E1E1E' }}>
              思绪图片
            </h2>
            <span style={{ fontSize: 13, color: '#9E9E9E' }}>
              为章节中的「思绪【名称】」行绑定图片（jpg / png / webp，单张 ≤10MB；按名称绑定，章节重导不丢）
            </span>
          </div>

          {cgError && (
            <div
              style={{
                padding: '10px 12px',
                marginTop: 16,
                borderRadius: 8,
                background: '#FFF1F0',
                border: '1px solid #FFA39E',
                color: '#D93025',
                fontSize: 13,
              }}
            >
              {cgError}
            </div>
          )}
          {cgNotice && (
            <div
              style={{
                padding: '10px 12px',
                marginTop: 16,
                borderRadius: 8,
                background: '#F6FFED',
                border: '1px solid #B7EB8F',
                color: '#135200',
                fontSize: 13,
              }}
            >
              {cgNotice}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 18,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <select
              value={cgChapterSlug}
              onChange={(e) => handleCgChapterChange(e.target.value)}
              style={{
                ...inputStyle,
                width: 300,
                fontSize: 14,
                padding: '9px 12px',
                marginBottom: 0,
              }}
            >
              <option value="">选择已导入章节...</option>
              {cgChapterList.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.tag} {c.title}（{c.slug}）
                </option>
              ))}
            </select>
            {cgLoading && <span style={{ fontSize: 13, color: '#9E9E9E' }}>加载中...</span>}
          </div>

          {cgChapterSlug && !cgLoading && (
            cgItems.length === 0 ? (
              <div style={{ marginTop: 16, fontSize: 14, color: '#9E9E9E' }}>
                该章节暂无「思绪【名称】」行
              </div>
            ) : (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cgItems.map(({ name, label, inst }) => {
                  const bindKey = label ? `${label}:${name}` : name;
                  const mapKey = `${bindKey}#${inst}`;
                  const display = label ? `${label}「${name}」` : `思绪【${name}】`;
                  const url = cgMap[mapKey];
                  const uploading = cgUploading === mapKey;
                  return (
                    <div
                      key={mapKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '10px 12px',
                        border: '1px solid #E8E8E8',
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 74,
                          background: '#F7F7F7',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: '#B0B0B0' }}>无图</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#7373A0' }}>
                          {display}
                          {inst > 1 && (
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#9E9E9E', marginLeft: 6 }}>
                              第{inst}张
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#9E9E9E',
                            marginTop: 2,
                            wordBreak: 'break-all',
                          }}
                        >
                          {url ?? '未上传图片'}
                        </div>
                      </div>
                      <label
                        style={{
                          ...secondaryBtn,
                          display: 'inline-block',
                          padding: '8px 16px',
                          fontSize: 13,
                          marginBottom: 0,
                          cursor: uploading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {uploading ? '上传中...' : url ? '替换图片' : '上传图片'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploading}
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleCgUpload(bindKey, inst, f, display);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* 底部链接 */}
        <div style={{ fontSize: 14 }}>
          <a
            href="/bigdatalab/admin/categories"
            style={{ color: '#1E1E1E', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            分类管理（进入百科后台）
          </a>
        </div>
      </div>
    </div>
  );
};

const cellStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #F0F0F0',
  textAlign: 'left',
  color: '#595959',
  verticalAlign: 'top',
};

export default AdminPage;
