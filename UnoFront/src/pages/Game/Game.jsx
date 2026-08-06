import React from 'react';
import useGame from '../../hooks/Game/useGame';
import styles from './Game.module.css';
import OpponentHand from '../../components/Game/OpponentHand/OpponentHand';
import PlayerProfile from '../../components/Game/PlayerProfile/PlayerProfile';
import PlayerHand from '../../components/Game/PlayerHand/PlayerHand';
import CenterArea from '../../components/Game/CenterArea/CenterArea';
import Header from '../../components/Game/Header/Header';
import Card from '../../components/Game/Card/Card';
import LobbyModal from '../../components/Game/LobbyModal/LobbyModal';
import unoAudio from '../../assets/batida na mesa.mp3';
import backgroundImg from '../../assets/background.jpg';
import tableImg from '../../assets/mesa-bar-itens svg.svg';

export default function Game() {
  const {
    isLobbyMode,
    startGame,
    isShaking,
    animatingCard,
    gameState,
    opponents,
    playedCards,
    playerCards,
    handlePlayCard,
    handleUnoClick
  } = useGame();

  const onUnoClick = () => handleUnoClick(unoAudio);

  return (
    <div className={styles.htmlBody}>
      <div className={styles.gameBoard}>
        {/* Background Image */}
        <div className={styles.backgroundImageWrapper}>
          <img src={backgroundImg} alt="Background" className={styles.backgroundImage} />
        </div>

        {/* Background dark overlay */}
        <div className={styles.boardOverlay}></div>

        {/* Top Header */}
        <Header score={gameState.score} roomId={gameState.roomId} />

        {/* Bar Table Image */}
        <div className={`${styles.tableImageWrapper} ${isShaking ? styles.shake : ''}`}>
          <img src={tableImg} alt="Table" className={styles.tableImage} />
        </div>

        {/* Dynamic Opponents (supports 1v1 up to 4 players) */}
        {opponents.map(opp => {
          if (opp.position === 'top') {
            return (
              <React.Fragment key={opp.id}>
                <div className={styles.topPlayerProfile}>
                  <PlayerProfile name={opp.name} avatar={opp.avatar} cardCount={opp.cardCount} avatarBg={opp.avatarBg} avatarBorder={opp.avatarBorder} layout="horizontal-right" />
                </div>
                <OpponentHand style={{ left: '50%', top: '130px', transform: 'translateX(-50%) scale(1.3)' }} cardCount={opp.cardCount} />
              </React.Fragment>
            );
          }
          if (opp.position === 'left') {
            return (
              <React.Fragment key={opp.id}>
                <div className={styles.leftPlayerProfile}>
                  <PlayerProfile name={opp.name} avatar={opp.avatar} cardCount={opp.cardCount} avatarBg={opp.avatarBg} avatarBorder={opp.avatarBorder} />
                </div>
                <OpponentHand style={{ left: '150px', top: '50%', transform: 'translateY(-50%) scale(1.3)' }} containerTransform="rotate(-90deg)" cardCount={opp.cardCount} />
              </React.Fragment>
            );
          }
          if (opp.position === 'right') {
            return (
              <React.Fragment key={opp.id}>
                <div className={styles.rightPlayerProfile}>
                  <PlayerProfile name={opp.name} avatar={opp.avatar} cardCount={opp.cardCount} avatarBg={opp.avatarBg} avatarBorder={opp.avatarBorder} />
                </div>
                <OpponentHand style={{ right: '150px', top: '50%', transform: 'translateY(-50%) scale(1.3)' }} containerTransform="rotate(90deg)" cardCount={opp.cardCount} />
              </React.Fragment>
            );
          }
          return null;
        })}

        {/* Center Area (Discard / Draw Pile) */}
        <CenterArea playedCards={playedCards} isShaking={isShaking} style={{ transform: 'translate(-50%, -50%) scale(1.3)' }} />

        {/* Bottom Player (You) Profile */}
        <div className={styles.bottomPlayerProfile}>
          <PlayerProfile name="Você" avatar="🐶" cardCount={playerCards.length} avatarBg="#34c759" avatarBorder="#3f3f46" layout="horizontal-left" />
        </div>

        {/* Action Buttons */}
        <div className={styles.unoButton} onClick={onUnoClick}>
          <p className={styles.unoButtonText}>UNO!</p>
        </div>

        <div className={styles.drawButton}>
          <p className={styles.drawButtonText}>COMPRAR</p>
          <p className={styles.drawButtonText}>CARTA</p>
        </div>

        {/* Bottom Player Hand */}
        <PlayerHand cards={playerCards} onPlayCard={handlePlayCard} />

        {/* Flying Card Overlay */}
        {animatingCard && (
          <div 
            className={styles.flyingCardOverlay}
            style={{
              left: animatingCard.left,
              top: animatingCard.top,
              width: animatingCard.width,
              height: animatingCard.height,
              transform: animatingCard.flying ? `translate(${animatingCard.targetLeft - animatingCard.left}px, ${animatingCard.targetTop - animatingCard.top}px) rotate(${animatingCard.targetRotation}deg) scale(${animatingCard.targetScale})` : 'none',
              transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            <Card {...animatingCard.card} rotation={0} />
          </div>
        )}

        {/* Lobby Overlay */}
        {isLobbyMode && (
          <LobbyModal 
            opponents={opponents} 
            roomId={gameState.roomId} 
            onStart={startGame} 
          />
        )}
      </div>
    </div>
  );
}
