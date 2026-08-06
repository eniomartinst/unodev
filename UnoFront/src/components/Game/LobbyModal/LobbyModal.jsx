import React from 'react';
import styles from './LobbyModal.module.css';
import PlayerProfile from '../PlayerProfile/PlayerProfile';

export default function LobbyModal({ opponents, roomId, onStart }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <h2 className={styles.title}>Sala #{roomId}</h2>
        <p className={styles.subtitle}>Aguardando jogadores...</p>
        
        <div className={styles.playersList}>
          {/* Você */}
          <div className={styles.playerItem}>
            <PlayerProfile 
              name="Você" 
              avatar="🐶" 
              cardCount={0} 
              avatarBg="#34c759" 
              avatarBorder="#3f3f46" 
              layout="horizontal-right" 
            />
            <span className={styles.statusReady}>Pronto</span>
          </div>

          {/* Oponentes */}
          {opponents.map(opp => (
            <div key={opp.id} className={styles.playerItem}>
              <PlayerProfile 
                name={opp.name} 
                avatar={opp.avatar} 
                cardCount={0} 
                avatarBg={opp.avatarBg} 
                avatarBorder={opp.avatarBorder} 
                layout="horizontal-right" 
              />
              <span className={styles.statusReady}>Pronto</span>
            </div>
          ))}
        </div>

        <button className={styles.startButton} onClick={onStart}>
          Iniciar Partida
        </button>
      </div>
    </div>
  );
}
