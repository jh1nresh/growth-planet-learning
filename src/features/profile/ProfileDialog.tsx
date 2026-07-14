import {useEffect, useState, type FormEvent} from 'react';
import {SignIn, SignOut, UserCircle} from '@phosphor-icons/react';
import {Modal} from '../../components/Modal';
import {sanitizeAlias} from '../../lib/progress';
import type {AuthState} from '../auth/auth-context';

interface ProfileDialogProps {
  open: boolean;
  auth: AuthState;
  childAlias: string;
  onClose: () => void;
  onSaveAlias: (alias: string) => void;
}

export function ProfileDialog({open, auth, childAlias, onClose, onSaveAlias}: ProfileDialogProps) {
  const [alias, setAlias] = useState(childAlias);

  useEffect(() => setAlias(childAlias), [childAlias, open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextAlias = sanitizeAlias(alias);
    if (!nextAlias) return;
    onSaveAlias(nextAlias);
    onClose();
  };

  return (
    <Modal open={open} title="學習者設定" onClose={onClose} className="profile-modal">
      <div className="auth-status">
        <UserCircle aria-hidden="true" weight="duotone" />
        <div>
          <strong>{auth.authenticated ? '家長帳號已連線' : '訪客模式'}</strong>
          <span>{auth.authenticated ? `${auth.parentEmail ?? 'Privy 家長帳號'} · 進度仍只留在這台裝置` : '進度只留在這台裝置，不會上傳孩子資料。'}</span>
        </div>
      </div>

      {auth.authenticated ? (
        <button className="secondary-button" type="button" onClick={() => void auth.logout()}>
          <SignOut aria-hidden="true" /> 登出家長帳號
        </button>
      ) : auth.canLogin ? (
        <button className="secondary-button" type="button" disabled={!auth.ready} onClick={auth.login}>
          <SignIn aria-hidden="true" /> 用 Privy 登入家長帳號
        </button>
      ) : (
        <p className="setup-note">正式家長登入會在 Privy App ID 連上後啟用；現在可直接使用全部學習內容。</p>
      )}

      <form className="profile-form" onSubmit={submit}>
        <label htmlFor="child-alias">孩子暱稱</label>
        <input
          id="child-alias"
          value={alias}
          maxLength={16}
          autoComplete="off"
          required
          aria-describedby="child-alias-help"
          onChange={(event) => setAlias(event.target.value)}
        />
        <small id="child-alias-help">不需要真實姓名；最多 16 個字。</small>
        <button className="primary-button" type="submit" disabled={!sanitizeAlias(alias)}>儲存暱稱</button>
      </form>
    </Modal>
  );
}
