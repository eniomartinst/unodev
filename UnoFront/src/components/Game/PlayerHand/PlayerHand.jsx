import React, { useState } from 'react';
import Card from '../Card/Card';
import styles from './PlayerHand.module.css';

export default function PlayerHand({ style, cards = [], onPlayCard }) {
  const [scrollIndex, setScrollIndex] = useState(0);

  const maxVisibleCards = 15;

  const handleWheel = (e) => {
    if (cards.length <= maxVisibleCards) return;
    
    if (e.deltaY > 0) {
      setScrollIndex((prev) => Math.min(prev + 1, cards.length - maxVisibleCards));
    } else if (e.deltaY < 0) {
      setScrollIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <div className={styles.playerHandContainer} style={style} onWheel={handleWheel}>
      {cards.map((card, index) => {
        const visibleCount = Math.min(cards.length, maxVisibleCards);
        const midPoint = (visibleCount - 1) / 2;
        const shiftAmount = Math.max(0, (cards.length - maxVisibleCards) * 35 / 2);

        let layoutIndex;
        let targetX;

        if (index < scrollIndex) {
          layoutIndex = 0;
          const hiddenCount = scrollIndex - index;
          targetX = -hiddenCount * 2;
        } else if (index >= scrollIndex + visibleCount) {
          layoutIndex = visibleCount - 1;
          const hiddenCount = index - (scrollIndex + visibleCount - 1);
          targetX = layoutIndex * 35 + hiddenCount * 2;
        } else {
          layoutIndex = index - scrollIndex;
          targetX = layoutIndex * 35;
        }

        const physicalX = index * 35;
        const offsetX = targetX - physicalX + shiftAmount;

        const angle = (layoutIndex - midPoint) * 4;
        const yOffset = Math.abs(layoutIndex - midPoint) * 2;

        return (
          <div 
            key={index} 
            className={styles.cardWrapper} 
            onClick={(e) => onPlayCard && onPlayCard(index, e.currentTarget)}
            style={{ 
              '--card-rot': `${angle}deg`,
              '--card-y': `${yOffset}px`,
              '--card-x': `${offsetX}px`,
              zIndex: index 
            }}
          >
            <Card {...card} rotation={0} />
          </div>
        );
      })}
    </div>
  );
}

