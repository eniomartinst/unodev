import { useState, useEffect } from 'react';
import api from '../../api/api';
import { mockOpponents, mockPlayedCards, mockPlayerCards, mockGameState } from '../../mocks/gameMock';

export default function useGame() {
  const [isShaking, setIsShaking] = useState(false);
  const [animatingCard, setAnimatingCard] = useState(null);
  const [isLobbyMode, setIsLobbyMode] = useState(true);
  
  const [opponents, setOpponents] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [gameState, setGameState] = useState({ score: 0, roomId: '' });

  const startGame = async () => {
    try {
      const token = localStorage.getItem('token');
      const roomId = localStorage.getItem('currentRoomId');

      // Avisa a API para criar a rodada e distribuir as cartas
      await api.post('/api/games/start', {
        game_id: Number(roomId),
        access_token: token
      });

      // Fecha o Modal e mostra a mesa
      setIsLobbyMode(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Erro ao iniciar a partida");
    }
  };

  // Simulate receiving initial data separately from socket/API
  useEffect(() => {
    // Frontend is responsible for calculating visual positions for the pile
    const initialPileWithVisuals = mockPlayedCards.map(card => ({
      ...card,
      rotation: Math.floor(Math.random() * 60) - 30,
      offsetX: Math.floor(Math.random() * 40) - 20,
      offsetY: Math.floor(Math.random() * 40) - 20,
    }));

    setOpponents(mockOpponents);
    setPlayedCards(initialPileWithVisuals);
    setPlayerCards(mockPlayerCards);
    setGameState(mockGameState);
  }, [mockOpponents, mockPlayedCards, mockPlayerCards, mockGameState]);

  const handlePlayCard = (index, element) => {
    if (animatingCard) return; // Prevent multiple cards from flying at once
    
    const card = playerCards[index];
    const newHand = [...playerCards];
    newHand.splice(index, 1);
    
    // Get start coordinates
    const startRect = element.getBoundingClientRect();
    
    // Get target coordinates from CenterArea
    const centerAreaElement = document.getElementById('center-card-area');
    let targetRect = startRect;
    if (centerAreaElement) {
      targetRect = centerAreaElement.getBoundingClientRect();
    }
    
    setPlayerCards(newHand);
    
    // Calculate the target rotation and scale based on center area
    const finalRotation = Math.floor(Math.random() * 60) - 30; // -30 to 30 deg
    const finalOffsetX = Math.floor(Math.random() * 40) - 20; // -20 to 20 px
    const finalOffsetY = Math.floor(Math.random() * 40) - 20; // -20 to 20 px

    // We add 360 degrees to make the card do a full spin in the air before landing
    const targetRotation = finalRotation + 360;
    const targetScale = 1.3;
    
    setAnimatingCard({
      card,
      left: startRect.left,
      top: startRect.top,
      width: startRect.width,
      height: startRect.height,
      targetLeft: targetRect.left + (finalOffsetX * 1.3),
      targetTop: targetRect.top + (finalOffsetY * 1.3),
      targetRotation,
      targetScale,
      flying: false // Will trigger animation in next tick
    });
    
    // Trigger the CSS transition
    setTimeout(() => {
      setAnimatingCard(prev => ({ ...prev, flying: true }));
    }, 10);
    
    // Complete the animation
    setTimeout(() => {
      setPlayedCards(prev => {
        // Keep at most 6 cards in the pile to avoid DOM bloating
        const nextCards = [...prev, { ...card, id: Date.now(), rotation: finalRotation, offsetX: finalOffsetX, offsetY: finalOffsetY }];
        if (nextCards.length > 6) {
          return nextCards.slice(nextCards.length - 6);
        }
        return nextCards;
      });
      setAnimatingCard(null);
    }, 510); // 500ms transition + 10ms buffer
  };

  const handleUnoClick = (audioSource) => {
    if (audioSource) {
      const audio = new Audio(audioSource);
      audio.play();
    }
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return {
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
  };
}
