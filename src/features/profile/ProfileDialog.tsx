import {useEffect, useRef, useState, type FormEvent} from 'react';
import {CheckCircle, SignIn, SignOut, UserCircle} from '@phosphor-icons/react';
import {Modal} from '../../components/Modal';
import type {AuthState} from '../auth/auth-context';
import {CHILD_AVATARS, isChildPin, type ChildAvatarId, type ChildProfile, type ProgressSyncStatus} from '../family/familyTypes';
import {sanitizeAlias} from '../../lib/progress';
import type {useFamily} from '../../hooks/useFamily';

interface ProfileDialogProps {
  open: boolean;
  auth: AuthState;
  family: ReturnType<typeof useFamily>;
  guestAlias: string;
  syncStatus: ProgressSyncStatus;
  onRetrySync: () => Promise<void>;
  onResolveSyncConflict: (strategy: 'cloud' | 'local') => Promise<void>;
  onClose: () => void;
  onSaveGuestAlias: (alias: string) => void;
  onChildActivated: () => void;
}

type FormMode = 'create' | 'edit' | 'unlock' | null;

const avatarLabels: Record<ChildAvatarId, string> = {
  sprout: '新芽',
  star: '星星',
  moon: '月亮',
  cloud: '雲朵',
};

const syncLabels: Record<ProgressSyncStatus, string> = {
  local: '進度只存在本機',
  loading: '正在同步進度',
  synced: '進度已同步',
  offline: '目前離線，稍後同步',
  conflict: '另一台裝置有新進度，請重新載入',
};

export function ProfileDialog({
  open,
  auth,
  family,
  guestAlias,
  syncStatus,
  onRetrySync,
  onResolveSyncConflict,
  onClose,
  onSaveGuestAlias,
  onChildActivated,
}: ProfileDialogProps) {
  const [mode, setMode] = useState<FormMode>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [alias, setAlias] = useState('');
  const [avatarId, setAvatarId] = useState<ChildAvatarId>('sprout');
  const [pin, setPin] = useState('');
  const [guestName, setGuestName] = useState(guestAlias);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setMode(auth.authenticated && !family.loading && family.profiles.length === 0 ? 'create' : null);
    setSelectedChildId(null);
    setAlias('');
    setAvatarId('sprout');
    setPin('');
    setGuestName(guestAlias);
    setFormError(null);
    setDeleteConfirmId(null);
    family.clearError();
  }, [open]);

  useEffect(() => {
    if (open && auth.authenticated && !family.loading && family.profiles.length === 0 && !mode) setMode('create');
  }, [auth.authenticated, family.loading, family.profiles.length, mode, open]);

  const selectedProfile = family.profiles.find((profile) => profile.id === selectedChildId) ?? null;

  const beginUnlock = (profile: ChildProfile) => {
    setSelectedChildId(profile.id);
    setPin('');
    setFormError(null);
    setMode('unlock');
    requestAnimationFrame(() => pinRef.current?.focus());
  };

  const beginCreate = () => {
    setSelectedChildId(null);
    setAlias('');
    setAvatarId('sprout');
    setPin('');
    setFormError(null);
    setDeleteConfirmId(null);
    setMode('create');
  };

  const beginEdit = (profile: ChildProfile) => {
    setSelectedChildId(profile.id);
    setAlias(profile.alias);
    setAvatarId(profile.avatarId);
    setPin('');
    setFormError(null);
    setDeleteConfirmId(null);
    setMode('edit');
  };

  const submitUnlock = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProfile || !isChildPin(pin)) return;
    setSubmitting(true);
    setFormError(null);
    try {
      if (auth.authenticated) {
        try {
          await auth.logout();
        } catch {
          throw new Error('家長帳號未能安全登出，請重試後再進入孩子帳號。');
        }
      }
      await family.unlockChild(selectedProfile.id, pin);
      onChildActivated();
      onClose();
    } catch (caught) {
      setPin('');
      setFormError(caught instanceof Error ? caught.message : '無法登入孩子檔案。');
      requestAnimationFrame(() => pinRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    const safeAlias = sanitizeAlias(alias);
    if (!safeAlias || !isChildPin(pin)) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const profile = await family.createChild({alias: safeAlias, avatarId, pin});
      setPin('');
      beginUnlock(profile);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : '無法建立孩子檔案。');
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProfile) return;
    const safeAlias = sanitizeAlias(alias);
    if (!safeAlias || (pin && !isChildPin(pin))) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await family.updateChild({childId: selectedProfile.id, alias: safeAlias, avatarId, ...(pin ? {pin} : {})});
      setPin('');
      setMode(null);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : '無法更新孩子檔案。');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (childId: string) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await family.deleteChild(childId);
      setMode(null);
      setSelectedChildId(null);
      setDeleteConfirmId(null);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : '無法移除孩子檔案。');
    } finally {
      setSubmitting(false);
    }
  };

  const submitGuest = (event: FormEvent) => {
    event.preventDefault();
    const nextAlias = sanitizeAlias(guestName);
    if (!nextAlias) return;
    onSaveGuestAlias(nextAlias);
    onClose();
  };

  const signOutParent = async () => {
    setFormError(null);
    try {
      await auth.logout();
    } catch {
      setFormError('家長帳號登出失敗，請稍後再試。');
    }
  };

  const leaveChild = async () => {
    setFormError(null);
    try {
      await family.endChildSession();
    } catch {
      setFormError('無法切換孩子，請稍後再試。');
    }
  };

  return (
    <Modal open={open} title="家庭與學習帳號" onClose={onClose} className="profile-modal family-modal">
      <div className="auth-status">
        <UserCircle aria-hidden="true" weight="duotone" />
        <div>
          <strong>{family.activeChild ? `${family.activeChild.alias} 的學習帳號` : auth.authenticated ? '家長帳號已連線' : family.profiles.length ? '這台裝置已獲家長授權' : '訪客模式'}</strong>
          <span>{family.activeChild ? syncLabels[syncStatus] : auth.authenticated ? auth.parentEmail ?? 'Privy 家長帳號' : family.profiles.length ? '選擇孩子並輸入 4 位數 PIN。' : '訪客進度只留在這台裝置。'}</span>
        </div>
        {family.activeChild ? <CheckCircle aria-label="孩子已登入" weight="fill" /> : null}
      </div>

      {family.error || formError ? <p className="family-form-error" role="alert">{formError ?? family.error}</p> : null}

      <div className="family-auth-actions">
        {auth.authenticated ? (
          <button className="secondary-button" type="button" onClick={() => void signOutParent()}>
            <SignOut aria-hidden="true" /> 登出家長帳號
          </button>
        ) : auth.canLogin ? (
          <button className="primary-button" type="button" disabled={!auth.ready} onClick={auth.login}>
            <SignIn aria-hidden="true" /> 家長登入／管理孩子
          </button>
        ) : (
          <p className="setup-note">尚未設定 Privy App ID；訪客仍可使用全部課程。</p>
        )}

        {family.activeChild ? (
          <button className="secondary-button" type="button" onClick={() => void leaveChild()}>
            切換孩子或回到訪客
          </button>
        ) : null}
      </div>

      {family.activeChild && syncStatus === 'offline' ? (
        <div className="family-sync-recovery" role="status">
          <span>進度保存在這台裝置；連線恢復後可以重新同步。</span>
          <button type="button" className="secondary-button compact" onClick={() => void onRetrySync()}>重新同步</button>
        </div>
      ) : null}

      {family.activeChild && syncStatus === 'conflict' ? (
        <div className="family-sync-recovery is-conflict" role="alert">
          <strong>兩台裝置都有新的學習進度</strong>
          <span>請由家長選擇要使用哪一份；Oshiami 不會自動覆蓋。</span>
          <div>
            <button type="button" className="primary-button" onClick={() => void onResolveSyncConflict('cloud')}>使用最新雲端進度</button>
            <button type="button" className="secondary-button" onClick={() => void onResolveSyncConflict('local')}>保留這台進度</button>
          </div>
        </div>
      ) : null}

      {family.loading ? <p className="family-loading" role="status">正在讀取家庭帳號…</p> : null}

      {family.profiles.length ? (
        <section className="family-section" aria-labelledby="family-profile-heading">
          <div className="family-section-heading">
            <h3 id="family-profile-heading">選擇學習帳號</h3>
            {auth.authenticated ? <button type="button" className="text-button" onClick={beginCreate}>新增孩子</button> : null}
          </div>
          <ul className="family-profile-list">
            {family.profiles.map((profile) => (
              <li key={profile.id} className={family.activeChild?.id === profile.id ? 'is-active' : ''}>
                <span className={`family-avatar avatar-${profile.avatarId}`} aria-hidden="true">{avatarLabels[profile.avatarId].slice(0, 1)}</span>
                <div><strong>{profile.alias}</strong><span>{avatarLabels[profile.avatarId]}帳號</span></div>
                {family.activeChild?.id === profile.id ? (
                  <span className="family-active-label">使用中</span>
                ) : (
                  <button type="button" className="secondary-button compact" onClick={() => beginUnlock(profile)}>進入</button>
                )}
                {auth.authenticated ? <button type="button" className="text-button" onClick={() => beginEdit(profile)}>管理</button> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mode === 'unlock' && selectedProfile ? (
        <form className="profile-form family-form" onSubmit={submitUnlock}>
          <h3>進入 {selectedProfile.alias} 的帳號</h3>
          <label htmlFor="child-pin">4 位數 PIN</label>
          <input
            ref={pinRef}
            id="child-pin"
            value={pin}
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
            required
            aria-invalid={Boolean(formError)}
            aria-describedby="child-pin-help"
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <small id="child-pin-help">PIN 只用於家長已授權的裝置，不需要孩子 Email。</small>
          <div className="family-form-actions">
            <button type="button" className="secondary-button" onClick={() => setMode(null)}>取消</button>
            <button className="primary-button" type="submit" disabled={submitting || !isChildPin(pin)}>{submitting ? '正在進入…' : '進入學習'}</button>
          </div>
        </form>
      ) : null}

      {auth.authenticated && mode === 'create' ? (
        <form className="profile-form family-form" onSubmit={submitCreate}>
          <h3>建立孩子學習帳號</h3>
          <label htmlFor="new-child-alias">孩子暱稱</label>
          <input id="new-child-alias" value={alias} maxLength={16} autoComplete="off" required aria-describedby="new-child-alias-help" onChange={(event) => setAlias(event.target.value)} />
          <small id="new-child-alias-help">使用暱稱即可，不輸入真實姓名。</small>
          <label htmlFor="new-child-avatar">頭像</label>
          <select id="new-child-avatar" value={avatarId} onChange={(event) => setAvatarId(event.target.value as ChildAvatarId)}>
            {CHILD_AVATARS.map((avatar) => <option key={avatar} value={avatar}>{avatarLabels[avatar]}</option>)}
          </select>
          <label htmlFor="new-child-pin">4 位數 PIN</label>
          <input id="new-child-pin" value={pin} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="new-password" required aria-describedby="new-child-pin-help" onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} />
          <small id="new-child-pin-help">請由家長設定；伺服器只保存安全雜湊，不會保存明文。</small>
          <div className="family-form-actions">
            {family.profiles.length ? <button type="button" className="secondary-button" onClick={() => setMode(null)}>取消</button> : null}
            <button className="primary-button" type="submit" disabled={submitting || !sanitizeAlias(alias) || !isChildPin(pin)}>{submitting ? '正在建立…' : '建立孩子帳號'}</button>
          </div>
        </form>
      ) : null}

      {auth.authenticated && mode === 'edit' && selectedProfile ? (
        <form className="profile-form family-form" onSubmit={submitEdit}>
          <h3>管理 {selectedProfile.alias}</h3>
          <label htmlFor="edit-child-alias">孩子暱稱</label>
          <input id="edit-child-alias" value={alias} maxLength={16} autoComplete="off" required onChange={(event) => setAlias(event.target.value)} />
          <label htmlFor="edit-child-avatar">頭像</label>
          <select id="edit-child-avatar" value={avatarId} onChange={(event) => setAvatarId(event.target.value as ChildAvatarId)}>
            {CHILD_AVATARS.map((avatar) => <option key={avatar} value={avatar}>{avatarLabels[avatar]}</option>)}
          </select>
          <label htmlFor="edit-child-pin">新 PIN（選填）</label>
          <input id="edit-child-pin" value={pin} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="new-password" aria-describedby="edit-child-pin-help" onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} />
          <small id="edit-child-pin-help">留空即可保留目前 PIN。</small>
          <div className="family-form-actions">
            <button type="button" className="secondary-button" onClick={() => setMode(null)}>取消</button>
            <button className="primary-button" type="submit" disabled={submitting || !sanitizeAlias(alias) || Boolean(pin && !isChildPin(pin))}>儲存修改</button>
          </div>
          <div className="family-danger-zone">
            {deleteConfirmId === selectedProfile.id ? (
              <><span>會刪除雲端帳號與進度；其他裝置連線後也會清除快取。</span><button type="button" className="danger-button" disabled={submitting} onClick={() => void confirmDelete(selectedProfile.id)}>確認永久移除</button><button type="button" className="text-button" onClick={() => setDeleteConfirmId(null)}>取消</button></>
            ) : (
              <button type="button" className="text-button danger-text" onClick={() => setDeleteConfirmId(selectedProfile.id)}>移除孩子帳號</button>
            )}
          </div>
        </form>
      ) : null}

      {!auth.authenticated && !family.activeChild && family.profiles.length === 0 ? (
        <form className="profile-form guest-profile-form" onSubmit={submitGuest}>
          <label htmlFor="guest-child-alias">訪客暱稱</label>
          <input id="guest-child-alias" value={guestName} maxLength={16} autoComplete="off" required aria-describedby="guest-child-alias-help" onChange={(event) => setGuestName(event.target.value)} />
          <small id="guest-child-alias-help">訪客進度不會跨裝置同步。</small>
          <button className="secondary-button" type="submit" disabled={!sanitizeAlias(guestName)}>繼續訪客學習</button>
        </form>
      ) : null}
    </Modal>
  );
}
