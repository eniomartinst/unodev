import React from 'react';
import Card from '../Card/Card';
import styles from './CenterArea.module.css';

export default function CenterArea({ style, playedCards = [], isShaking }) {
  return (
    <div className={styles.centerAreaContainer} style={style}>
       {/* Draw Deck */}
       <div className={isShaking ? styles.jump : ''}>
         <Card type="back" rotation={-20} style={{ position: 'relative', marginRight: '20px' }} shadowStyle="-2px 2px 0px 0px #aaa, -4px 4px 0px 0px #888" />
       </div>
       
       {/* Discard Pile */}
       <div 
         id="center-card-area" 
         className={`${styles.activeCardWrapper} ${isShaking ? styles.jumpDelay : ''}`} 
         style={{ position: 'relative' }}
       >
         <div style={{ opacity: 0, pointerEvents: 'none' }}>
            <Card type="front" value="7" color="transparent" />
         </div>
         {playedCards && playedCards.length > 0 ? (
           playedCards.map((card, index) => (
             <div 
               key={card.id || index} 
               style={{ 
                 position: 'absolute', 
                 left: '50%',
                 top: '50%',
                 transform: `translate(calc(-50% + ${card.offsetX || 0}px), calc(-50% + ${card.offsetY || 0}px))`,
                 zIndex: index
               }}
             >
               <Card {...card} rotation={card.rotation !== undefined ? card.rotation : 5} />
             </div>
           ))
         ) : (
           <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
             <Card type="front" value="7" color="#34c759" rotation={5} />
           </div>
         )}
       </div>
    </div>
  );
}
