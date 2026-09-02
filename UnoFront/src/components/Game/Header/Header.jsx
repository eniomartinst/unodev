import React, { useState } from 'react';
import axios from 'axios';
import styles from './Header.module.css';

export default function Header({ score = 1500, roomId = 'X8K9V', onLeaveGame, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [placar, setPlacar] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregarPlacar = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/games/scores', { game_id: roomId || 1 });
      
      let scoresData = data.scores;
      // Convert Object to Array if necessary (API currently returns Object)
      if (scoresData && typeof scoresData === 'object' && !Array.isArray(scoresData)) {
        scoresData = Object.entries(scoresData).map(([username, score]) => ({ username, score }));
      }
      
      setPlacar(scoresData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.headerContainer}>
      <div className={styles.leftSection}>
        <div className={styles.badge}>
          <span className={styles.scoreText}>🏆 {score}</span>
        </div>
        <div className={styles.badge}>
          <span className={styles.roomText}>Sala: #{roomId}</span>
        </div>
        <button onClick={carregarPlacar} className={styles.badge} style={{ cursor: 'pointer', color: 'white' }}>
          🏆 {loading ? 'Carregando...' : 'Ver Placar'}
        </button>
      </div>

      <div className={styles.rightSection}>
        <button 
          className={styles.hamburgerMenu} 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        {menuOpen && (
          <div className={styles.dropdownMenu}>
            <button className={styles.dropdownItem} onClick={onLeaveGame}>
              🚪 Sair da Partida
            </button>
            <button className={styles.dropdownItem} onClick={onLogout}>
              🛑 Sair da Conta
            </button>
          </div>
        )}
      </div>

      {placar && (
        <div style={{
          position: 'absolute',
          top: '75px',
          left: '40px',
          background: 'rgba(30, 30, 30, 0.95)',
          color: '#fff',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          pointerEvents: 'auto',
          minWidth: '220px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>🏆 Placar</h4>
            <button 
              onClick={() => setPlacar(null)} 
              style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>
          {Array.isArray(placar) && placar.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {placar.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span>{item.player_name || item.name || item.Player?.name || item.username || `Jogador ${item.player_id || item.playerId || idx + 1}`}</span>
                  <strong>{item.score || item.points || 0} pts</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: '14px', color: '#ccc' }}>Nenhuma pontuação registrada.</p>
          )}
        </div>
      )}
    </div>
  );
}