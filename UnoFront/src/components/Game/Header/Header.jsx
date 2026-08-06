import React from 'react';
import styles from './Header.module.css';

export default function Header({ score = 1500, roomId = 'X8K9V' }) {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.leftSection}>
        <div className={styles.badge}>
          <span className={styles.scoreText}>🏆 {score}</span>
        </div>
        <div className={styles.badge}>
          <span className={styles.roomText}>Sala: #{roomId}</span>
        </div>
      </div>

      <div className={styles.rightSection}>
        <button className={styles.hamburgerMenu}>
          ☰
        </button>
      </div>
    </div>
  );
}
