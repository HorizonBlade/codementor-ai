import React from 'react';
import { Flame, Trophy, Zap } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getTranslation } from '../utils/translations';

function Navbar() {
  const stats = useAppStore((s) => s.stats);
  const appLanguage = useAppStore((s) => s.appLanguage);

  return (
    <header className="navbar">
      <div className="navbar__left">
        <h1 className="navbar__logo">
          CodeMentor <span className="navbar__logo-accent">AI</span>
        </h1>
      </div>

      <div className="navbar__right">
        <div className="navbar__stat" title={getTranslation('prog.solved_total', appLanguage)}>
          <Trophy size={16} />
          <span>{stats.totalSolved}</span>
        </div>
        <div className="navbar__stat navbar__stat--xp" title={getTranslation('prog.xp_total', appLanguage)}>
          <Zap size={16} />
          <span>{stats.xp} {getTranslation('nav.xp', appLanguage)}</span>
        </div>
        <div className="navbar__stat navbar__stat--streak" title={getTranslation('prog.streak_curr', appLanguage)}>
          <Flame size={16} />
          <span>{stats.streak}</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
