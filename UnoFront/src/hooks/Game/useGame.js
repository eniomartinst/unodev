import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { socket, connectSocket } from '../../socket/socket';
import { isCardPlayable } from '../../components/Game/PlayerHand/PlayerHand';

const AVATARS = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🐨'];
const AVATAR_BGS = ['#34c759', '#d8b4fe', '#312e81', '#10b981', '#f59e0b', '#ec4899'];

const COLOR_NAMES_PT = {
  Red: 'Vermelha',
  Blue: 'Azul',
  Green: 'Verde',
  Yellow: 'Amarela',
  Wild: 'Curinga'
};

export default function useGame() {
  const navigate = useNavigate();
  const roomId = localStorage.getItem('currentRoomId');
  const token = localStorage.getItem('token');

  const [currentUser, setCurrentUser] = useState(null);
  const [isLobbyMode, setIsLobbyMode] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [opponents, setOpponents] = useState([]);

  const [playedCards, setPlayedCards] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [gameState, setGameState] = useState({
    roomId: roomId || '---',
    score: 0,
    currentTurnPlayer: null,
    direction: 1,
    activeColor: 'Red',
    message: ''
  });

  const [isShaking, setIsShaking] = useState(false);
  const [animatingCard, setAnimatingCard] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Wild Card color picker
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pendingWildPlay, setPendingWildPlay] = useState(null);

  // Helper: map players to visual opponent positions around the table
  const updateOpponentsState = useCallback((playersList, myUsername, handCounts = {}) => {
    const oppList = (playersList || []).filter(p => p.username !== myUsername);
    const n = oppList.length;

    const mapped = oppList.map((opp, idx) => {
      let position = 'top';
      if (n === 1) position = 'top';
      else if (n === 2) position = idx === 0 ? 'left' : 'right';
      else if (n === 3) position = idx === 0 ? 'left' : idx === 1 ? 'top' : 'right';

      return {
        id: opp.username || idx,
        name: opp.username,
        avatar: AVATARS[(idx + 1) % AVATARS.length],
        avatarBg: AVATAR_BGS[(idx + 1) % AVATAR_BGS.length],
        avatarBorder: '#3f3f46',
        position,
        cardCount: handCounts[opp.username] !== undefined ? handCounts[opp.username] : (opp.cardCount || 0)
      };
    });

    setOpponents(mapped);
  }, []);

  // 1. Load User Profile and connect WebSocket
  useEffect(() => {
    if (!roomId || !token) {
      navigate('/rooms');
      return;
    }

    let myUsername = '';

    const init = async () => {
      try {
        const profileRes = await api.get('/api/auth/profile');
        const user = profileRes.data;
        myUsername = user.username || user.name;
        setCurrentUser(user);

        // Fetch initial room info from API
        try {
          const gameRes = await api.get(`/api/games/${roomId}`);
          const game = gameRes.data;
          const players = game.usersInGame || [];
          setLobbyPlayers(players);
          const amCreator = players.find(p => p.username === myUsername)?.isCreator || false;
          setIsCreator(amCreator);
          updateOpponentsState(players, myUsername);

          if (game.status === 'in_progress') {
            setIsLobbyMode(false);
          }
        } catch (e) {
          console.warn('Erro ao buscar dados iniciais da sala:', e);
        }

        // Connect socket
        const s = connectSocket(token);
        s.emit('game:join_room', { gameId: Number(roomId) });

      } catch (err) {
        console.error('Erro ao autenticar usuário:', err);
        navigate('/login');
      }
    };

    init();

    // Socket Event Handlers
    const handleLobbyUpdated = (data) => {
      if (data.players) {
        setLobbyPlayers(data.players);
        const amCreator = data.players.find(p => p.username === myUsername)?.isCreator || false;
        setIsCreator(amCreator);
        updateOpponentsState(data.players, myUsername);
      }
      if (data.status === 'in_progress') {
        setIsLobbyMode(false);
      }
    };

    const handleRoundUpdated = (data) => {
      setIsLobbyMode(false);

      if (data.topCard) {
        setPlayedCards(prev => {
          const topWithVisuals = {
            ...data.topCard,
            type: 'front',
            rotation: Math.floor(Math.random() * 40) - 20,
            offsetX: Math.floor(Math.random() * 30) - 15,
            offsetY: Math.floor(Math.random() * 30) - 15,
          };
          const next = [...prev, topWithVisuals];
          return next.length > 6 ? next.slice(next.length - 6) : next;
        });
      }


      if (data.handCounts) {
        setOpponents(prev => prev.map(opp => ({
          ...opp,
          cardCount: data.handCounts[opp.name] !== undefined ? data.handCounts[opp.name] : opp.cardCount
        })));
      }

      setGameState(prev => ({
        ...prev,
        currentTurnPlayer: data.currentPlayer,
        direction: data.direction,
        activeColor: data.activeColor || prev.activeColor,
        message: data.message || ''
      }));
    };

    const handleMyHand = (data) => {
      if (data.hand) {
        const formatted = data.hand.map(card => ({
          ...card,
          type: 'front',
        }));
        setPlayerCards(formatted);
      }
    };

    const handleRoundFinished = (data) => {
      setFeedbackMessage({ text: `🎉 ${data.message || `${data.winner} venceu a rodada!`}`, type: 'success' });
      if (data.totalScores && myUsername) {
        setGameState(prev => ({
          ...prev,
          score: data.totalScores[myUsername] || prev.score
        }));
      }
    };

    const handleGameFinished = (data) => {
      setFeedbackMessage({ text: `🏆 FIM DE JOGO! ${data.message || `${data.winner} é o grande campeão!`}`, type: 'success' });
    };

    const handleGameError = (data) => {
      console.warn('[Game] Erro na jogada:', data?.message);
    };


    const handleConnect = () => {
      socket.emit('game:join_room', { gameId: Number(roomId) });
    };

    socket.on('connect', handleConnect);
    socket.on('lobby:updated', handleLobbyUpdated);
    socket.on('round:updated', handleRoundUpdated);
    socket.on('my:hand', handleMyHand);
    socket.on('round:finished', handleRoundFinished);
    socket.on('game:finished', handleGameFinished);
    socket.on('game:error', handleGameError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('lobby:updated', handleLobbyUpdated);
      socket.off('round:updated', handleRoundUpdated);
      socket.off('my:hand', handleMyHand);
      socket.off('round:finished', handleRoundFinished);
      socket.off('game:finished', handleGameFinished);
      socket.off('game:error', handleGameError);
      socket.emit('game:leave_room', { gameId: Number(roomId) });
    };

  }, [roomId, token, navigate, updateOpponentsState]);

  // Auto-dismiss feedback messages
  useEffect(() => {
    if (feedbackMessage) {
      const t = setTimeout(() => setFeedbackMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [feedbackMessage]);

  // 2. Start Game Action (Emitted by room creator)
  const startGame = () => {
    socket.emit('game:start', { gameId: Number(roomId) });
  };

  // 3. Play Card Action (Strict 1 card per turn validation)
  const executePlayCard = (card, index, element, chosenColor) => {
    if (animatingCard) return;

    // Send to WebSocket
    socket.emit('turn:play_card', {
      gameId: Number(roomId),
      cardId: card.id,
      chosenColor: chosenColor || undefined
    });

    // Animate locally
    const newHand = [...playerCards];
    newHand.splice(index, 1);

    const startRect = element ? element.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight - 100, width: 100, height: 140 };
    const centerAreaElement = document.getElementById('center-card-area');
    let targetRect = startRect;
    if (centerAreaElement) {
      targetRect = centerAreaElement.getBoundingClientRect();
    }

    setPlayerCards(newHand);

    const finalRotation = Math.floor(Math.random() * 60) - 30;
    const finalOffsetX = Math.floor(Math.random() * 40) - 20;
    const finalOffsetY = Math.floor(Math.random() * 40) - 20;
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
      flying: false
    });

    setTimeout(() => {
      setAnimatingCard(prev => (prev ? { ...prev, flying: true } : null));
    }, 10);

    setTimeout(() => {
      setPlayedCards(prev => {
        const nextCards = [...prev, { ...card, type: 'front', rotation: finalRotation, offsetX: finalOffsetX, offsetY: finalOffsetY }];
        if (nextCards.length > 6) {
          return nextCards.slice(nextCards.length - 6);
        }
        return nextCards;
      });
      setAnimatingCard(null);
    }, 510);
  };

  const handlePlayCard = (index, element) => {
    if (animatingCard) return;
    const card = playerCards[index];
    if (!card) return;

    const myUsername = currentUser?.username || currentUser?.name;

    // REGRA 1: Só pode jogar na sua vez (bloqueia silenciosamente se não for a vez)
    if (gameState.currentTurnPlayer && gameState.currentTurnPlayer !== myUsername) {
      return;
    }

    // REGRA 2: Só pode jogar carta da mesma cor, mesmo número/ação ou Curinga (bloqueia silenciosamente)
    const topCard = playedCards[playedCards.length - 1];
    if (topCard && !isCardPlayable(card, topCard, gameState.activeColor)) {
      return;
    }

    // Se for Curinga, solicita escolha da cor
    const isWild = card.color === 'Wild' || card.value === 'Wild' || card.value === 'WildDraw4' || card.value === 'wild' || card.value === '+4';
    if (isWild) {
      setPendingWildPlay({ card, index, element });
      setColorPickerOpen(true);
      return;
    }

    // Executa jogada de 1 carta
    executePlayCard(card, index, element);
  };

  const handleSelectColor = (color) => {
    setColorPickerOpen(false);
    if (pendingWildPlay) {
      const { card, index, element } = pendingWildPlay;
      executePlayCard(card, index, element, color);
      setPendingWildPlay(null);
    }
  };

  // 4. Draw Card Action (Só no seu turno, bloqueia silenciosamente fora da vez)
  const handleDrawCard = () => {
    const myUsername = currentUser?.username || currentUser?.name;
    if (gameState.currentTurnPlayer && gameState.currentTurnPlayer !== myUsername) {
      return;
    }

    socket.emit('turn:draw_card', { gameId: Number(roomId) });
  };


  // 5. UNO Button Click
  const handleUnoClick = (audioSource) => {
    if (audioSource) {
      const audio = new Audio(audioSource);
      audio.play().catch(() => {});
    }
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return {
    currentUser,
    isLobbyMode,
    isCreator,
    lobbyPlayers,
    startGame,
    isShaking,
    animatingCard,
    gameState,
    opponents,
    playedCards,
    playerCards,
    handlePlayCard,
    handleDrawCard,
    handleUnoClick,
    colorPickerOpen,
    handleSelectColor,
    feedbackMessage
  };
}
