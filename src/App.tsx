import {UserCircle} from '@phosphor-icons/react';
import {lazy, Suspense, useState} from 'react';
import {useAuth} from './features/auth/auth-context';
import {ProfileDialog} from './features/profile/ProfileDialog';
import {useProgress} from './hooks/useProgress';

const MarbleTaxonomyExplorer = lazy(() => import('./features/world/MarbleTaxonomyExplorer').then((module) => ({default: module.MarbleTaxonomyExplorer})));

export default function App() {
  const auth = useAuth();
  const namespace = auth.userId ? `privy:${auth.userId}` : 'guest';
  const {progress, setChildAlias} = useProgress(namespace);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="taxonomy-app">
      <a className="skip-link" href="#taxonomy-map">跳到技能圖</a>
      <header className="taxonomy-topbar">
        <a className="taxonomy-brand" href="/" aria-label="成長星球首頁">
          <span className="taxonomy-brand-mark" aria-hidden="true">學</span>
          <span className="taxonomy-brand-copy">
            <strong>成長星球</strong>
            <small>STAR·INK LEARNING ATLAS</small>
          </span>
        </a>
        <button
          className="taxonomy-profile"
          type="button"
          aria-label={progress.childAlias ? `開啟 ${progress.childAlias} 的學習者設定` : (auth.authenticated ? '設定孩子暱稱' : '家長登入')}
          onClick={() => setProfileOpen(true)}
        >
          <UserCircle aria-hidden="true" weight="regular" />
          <span>{progress.childAlias || (auth.authenticated ? '設定孩子暱稱' : '家長登入')}</span>
        </button>
      </header>

      <main id="taxonomy-map">
        <Suspense fallback={<div className="taxonomy-loading" role="status">正在連接學習關係…</div>}>
          <MarbleTaxonomyExplorer />
        </Suspense>
      </main>

      <ProfileDialog
        open={profileOpen}
        auth={auth}
        childAlias={progress.childAlias}
        onClose={() => setProfileOpen(false)}
        onSaveAlias={setChildAlias}
      />
    </div>
  );
}
