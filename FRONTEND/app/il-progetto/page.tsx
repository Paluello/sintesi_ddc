'use client';

import { useState } from 'react';
import Toolbar from '@/components/molecules/Toolbar/Toolbar';
import SideMenu from '@/components/organisms/SideMenu/SideMenu';
import styles from './page.module.css';

export default function IlProgettoPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToolbarMenuClick = () => {
    setMenuOpen(prev => !prev);
  };

  return (
    <div className={styles.container}>
      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <Toolbar
        onMenuClick={handleToolbarMenuClick}
        showOnlyMenu={true}
        isMenuOpen={menuOpen}
      />
      <h1 className={styles.pageTitle}>Il Progetto</h1>
    </div>
  );
}
