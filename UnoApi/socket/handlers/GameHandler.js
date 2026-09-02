import GameService from '../../service/GameService.js';
import RoundService from '../../service/RoundService.js';
import ScoreService from '../../service/ScoreService.js';
import User from '../../repository/User.js';
import { formatManyGamesResponse } from '../../dtos/response/GameResponseDTO.js';

// ---------------------------------------------------------------------------
// GameHandler — Socket Controller do Game Loop UNO
//
// Arquitetura: este arquivo é exclusivamente camada de transporte (WebSocket).
// Toda a lógica de negócio está isolada nos Services (RoundService, ScoreService).
//
// Eventos recebidos:
//   game:join_room   — entra no canal Socket.IO da sala
//   game:start       — inicia o primeiro Round (Fluxo 1)
//   turn:play_card   — jogador joga uma carta (Fluxo 2a)
//   turn:draw_card   — jogador compra uma carta (Fluxo 2b)
//   game:leave_room  — sai do canal da sala
//
// Eventos emitidos:
//   round:updated    — estado da mesa após qualquer ação
//   round:finished   — rodada encerrada, nova rodada em 3s
//   game:finished    — partida encerrada (alguém atingiu 500 pts)
//   game:error       — jogada inválida ou acesso não autorizado
// ---------------------------------------------------------------------------

export default function setupGameEvents(io, socket) {
  // Helper local: emite erro apenas para o socket requisitante 
  const emitError = (originalEvent, message) => {
    socket.emit('game:error', { event: originalEvent, message });
  };

  // Entrar na sala (canal Socket.IO) 
  socket.on('game:join_room', async (data) => {
    const { gameId, token: payloadToken } = data;
    const username = socket.user?.username || 'Desconhecido';
    const token = payloadToken || socket.handshake?.auth?.token;

    if (!gameId) return;

    try {
      // Regra de negócio
      if (token) {
        await GameService.joinGame({ game_id: gameId, access_token: token }).catch(e => {
          console.error('[GameHandler] Erro no joinGame:', e.message);
        });
      }

      socket.join(`game_${gameId}`);
      socket.join(`private_${gameId}_${username}`);
      console.log(`[GameHandler] ${username} entrou na sala game_${gameId} (e private_${gameId}_${username})`);

      const game = await GameService.findById(gameId);
      const players = game?.usersInGame || [];

      // Broadcast da lista real de jogadores para todos na sala
      io.to(`game_${gameId}`).emit('lobby:updated', {
        gameId,
        players,
        status: game?.status
      });

      // Atualiza todas as "bolinhas" do menu de salas para todos os usuários online!
      const allGames = await GameService.findAll();
      io.emit('lobby:updated', formatManyGamesResponse(allGames));

      socket.to(`game_${gameId}`).emit('game:update', {
        action: 'user_joined',
        user: username,
        message: `${username} entrou na sala.`,
      });

      // Se a partida já está em andamento, envia o estado da mesa e a mão privada para o jogador
      if (game?.status === 'in_progress') {
        const activeRound = await RoundService.getActiveRound(gameId);
        if (activeRound) {
          const roundData = activeRound.toJSON();
          socket.emit('round:updated', {
            message: 'Partida em andamento.',
            ...RoundService.publicRoundState(roundData, players),
          });
          const myHand = RoundService.privateHandState(roundData, username);
          socket.emit('my:hand', { hand: myHand });
        }
      }
    } catch (err) {
      console.error('[GameHandler] Erro ao carregar dados do jogo no join_room:', err);
    }
  });


  // ─── FLUXO 1: game:start — Inicialização da Partida ──────────────────────
  // Payload: { gameId }
  socket.on('game:start', async (data) => {
    try {
      const { gameId } = data;
      const username = socket.user?.username;

      // 1. Busca o jogo e os jogadores
      const game = await GameService.findById(gameId);
      const players = game.usersInGame || [];

      // Segurança: apenas o criador pode disparar game:start
      const requester = players.find((p) => p.username === username);
      if (!requester?.isCreator) return emitError('game:start', 'Apenas o criador pode iniciar a partida.');
      if (players.length < 2) return emitError('game:start', 'Mínimo de 2 jogadores para iniciar.');

      // 2. Atualiza o status do Game para in_progress
      await GameService.update(gameId, { status: 'in_progress', currentPlayerIndex: 0 });

      // 3. Inicializa o primeiro Round (embaralha, distribui, define carta inicial)
      const round = await RoundService.initRound(gameId, players);

      // 4. Broadcast do estado inicial da mesa para todos na sala
      const publicState = RoundService.publicRoundState(round.toJSON(), players);
      io.to(`game_${gameId}`).emit('round:updated', {
        message: 'A partida começou! Boa sorte a todos.',
        ...publicState,
      });

      // 5. Emite a mão privada para cada jogador individualmente
      emitPrivateHands(io, gameId, round.toJSON(), players);

    } catch (err) {
      console.error('[GameHandler] game:start error:', err);
      emitError('game:start', err.message || 'Erro ao iniciar a partida.');
    }
  });

  // ─── FLUXO 2a: turn:play_card — Jogar uma Carta ──────────────────────────
  // Payload: { gameId, cardId, chosenColor? }
  // chosenColor obrigatório para Wild e WildDraw4
  socket.on('turn:play_card', async (data) => {
    try {
      const { gameId, cardId, chosenColor } = data;
      const username = socket.user?.username;

      // 1. Carrega estado atual do jogo e da rodada
      const game = await GameService.findById(gameId);
      const players = game.usersInGame || [];
      const round = await RoundService.getActiveRound(gameId);

      if (!round) return emitError('turn:play_card', 'Nenhuma rodada ativa encontrada.');

      // Segurança: verifica se é a vez deste jogador
      const currentPlayer = players[round.currentPlayerIndex];
      if (currentPlayer?.username !== username) {
        return emitError('turn:play_card', 'Não é a sua vez de jogar.');
      }

      // Segurança: verifica se o jogador possui a carta na mão (anti-forge)
      const hand = (round.hands || {})[username] || [];
      const cardIndex = hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        return emitError('turn:play_card', 'Você não possui esta carta na mão.');
      }
      const card = hand[cardIndex];

      // 2. Valida se a jogada é legal pelas regras do UNO
      const topCard = (round.discardPile || []).at(-1);
      if (!RoundService.isValidPlay(card, topCard, round.activeColor)) {
        return emitError(
          'turn:play_card',
          `Jogada inválida: ${card.color} ${card.value} não combina com ${round.activeColor} ou ${topCard?.value}.`
        );
      }

      // 3. Aplica o efeito da carta (retorna novos valores, sem mutar o round)
      const { direction, pendingDraws, activeColor } = RoundService.applyCardEffect(
        card,
        { direction: round.direction, pendingDraws: round.pendingDraws, activeColor: round.activeColor },
        chosenColor
      );

      // 4. Remove carta da mão do jogador e adiciona ao descarte (imutável)
      let hands = { ...round.hands, [username]: hand.filter((_, i) => i !== cardIndex) };
      let discardPile = [...(round.discardPile || []), card];
      let deck = [...(round.deck || [])];
      let saidUno = { ...(round.saidUno || {}) };

      if (hands[username].length > 1) {
        saidUno[username] = false;
      }

      // 5. Aplica as compras forçadas ao próximo jogador imediato (Draw2/WildDraw4)
      if (pendingDraws > 0) {
        const immediateNextIndex =
          ((round.currentPlayerIndex + direction) % players.length + players.length) % players.length;
        const nextUsername = players[immediateNextIndex]?.username;

        if (nextUsername) {
          const { drawn, deck: d, discardPile: disc } = RoundService.drawCards(deck, discardPile, pendingDraws);
          hands = { ...hands, [nextUsername]: [...(hands[nextUsername] || []), ...drawn] };
          if (hands[nextUsername].length > 1) saidUno[nextUsername] = false;
          deck = d;
          discardPile = disc;
        }
      }

      // 6. Calcula o próximo jogador (considerando Skip e Reverse em 2 jogadores)
      const nextIndex = RoundService.advanceTurn(round.currentPlayerIndex, direction, players.length, card.value);

      // 7. Verifica se este jogador venceu a rodada (mão zerada)
      const roundWinner = RoundService.checkRoundWinner(hands);

      // 8. Persiste o estado atualizado no banco
      await round.update({
        currentPlayerIndex: roundWinner ? round.currentPlayerIndex : nextIndex,
        direction,
        activeColor,
        pendingDraws: 0, // Draws foram resolvidos no passo 5
        deck,
        discardPile,
        hands,
        saidUno,
        status: roundWinner ? 'finished' : 'active',
      });

      // 9. Broadcast do estado público atualizado da mesa
      const updatedRoundData = round.toJSON();
      const publicState = RoundService.publicRoundState(updatedRoundData, players);
      io.to(`game_${gameId}`).emit('round:updated', {
        message: `${username} jogou ${card.color} ${card.value}${pendingDraws > 0 ? ` (+${pendingDraws})` : ''}`,
        ...publicState,
      });
      emitPrivateHands(io, gameId, updatedRoundData, players);

      // 10. Trata condição de vitória da rodada
      if (roundWinner) {
        await handleRoundEnd(io, gameId, hands, players, roundWinner);
      }

    } catch (err) {
      console.error('[GameHandler] turn:play_card error:', err);
      emitError('turn:play_card', err.message || 'Erro ao processar a jogada.');
    }
  });

  // ─── FLUXO 2b: turn:draw_card — Comprar uma Carta ────────────────────────
  // Payload: { gameId }
  socket.on('turn:draw_card', async (data) => {
    try {
      const { gameId } = data;
      const username = socket.user?.username;

      // 1. Carrega estado atual
      const game = await GameService.findById(gameId);
      const players = game.usersInGame || [];
      const round = await RoundService.getActiveRound(gameId);

      if (!round) return emitError('turn:draw_card', 'Nenhuma rodada ativa encontrada.');

      // Segurança: verifica se é a vez deste jogador
      const currentPlayer = players[round.currentPlayerIndex];
      if (currentPlayer?.username !== username) {
        return emitError('turn:draw_card', 'Não é a sua vez de jogar.');
      }

      // 2. Compra 1 carta e passa a vez (regra: comprar = encerrar turno)
      const { drawn, deck, discardPile } = RoundService.drawCards(
        round.deck || [],
        round.discardPile || [],
        1
      );
      const hands = {
        ...round.hands,
        [username]: [...((round.hands || {})[username] || []), ...drawn],
      };
      
      let saidUno = { ...(round.saidUno || {}) };
      if (hands[username].length > 1) {
        saidUno[username] = false;
      }

      const nextIndex = RoundService.advanceTurn(
        round.currentPlayerIndex,
        round.direction,
        players.length,
        null // sem efeito especial de carta
      );

      // 3. Persiste e faz broadcast
      await round.update({ deck, discardPile, hands, saidUno, currentPlayerIndex: nextIndex });

      const updatedRoundData = round.toJSON();
      const publicState = RoundService.publicRoundState(updatedRoundData, players);
      io.to(`game_${gameId}`).emit('round:updated', {
        message: `${username} comprou uma carta.`,
        ...publicState,
      });
      emitPrivateHands(io, gameId, updatedRoundData, players);

    } catch (err) {
      console.error('[GameHandler] turn:draw_card error:', err);
      emitError('turn:draw_card', err.message || 'Erro ao comprar carta.');
    }
  });

  // ─── Sair da sala ─────────────────────────────────────────────────────────
  socket.on('game:leave_room', async (data) => {
    const { gameId, token: payloadToken } = data;
    const username = socket.user?.username || 'Desconhecido';
    const token = payloadToken || socket.handshake?.auth?.token;

    if (!gameId) return;

    try {
      if (token) {
        await GameService.leaveGame({ game_id: gameId, access_token: token }).catch(e => {
          console.error('[GameHandler] Erro no leaveGame:', e.message);
        });
      }

      socket.leave(`game_${gameId}`);
      console.log(`[GameHandler] ${username} saiu da sala game_${gameId}`);

      socket.to(`game_${gameId}`).emit('game:update', {
        action: 'user_left',
        user: username,
        message: `${username} saiu da sala.`,
      });

      // Atualiza quem ficou na sala
      const game = await GameService.findById(gameId).catch(() => null);
      if (game) {
        io.to(`game_${gameId}`).emit('lobby:updated', {
          gameId,
          players: game.usersInGame || [],
          status: game.status
        });
      }

      // Atualiza todas as "bolinhas" do menu de salas para todos os usuários online!
      const allGames = await GameService.findAll();
      io.emit('lobby:updated', formatManyGamesResponse(allGames));

    } catch (err) {
      console.error('[GameHandler] erro ao processar saída da sala:', err);
    }
  });

  // ─── FLUXO UNO: turn:say_uno ──────────────────────────
  socket.on('turn:say_uno', async (data) => {
    try {
      const { gameId } = data;
      const username = socket.user?.username;

      const round = await RoundService.getActiveRound(gameId);
      if (!round) return emitError('turn:say_uno', 'Nenhuma rodada ativa encontrada.');

      const hand = (round.hands || {})[username] || [];
      if (hand.length <= 2) {
        const saidUno = { ...(round.saidUno || {}) };
        saidUno[username] = true;
        await round.update({ saidUno });

        io.to(`game_${gameId}`).emit('game:uno_shouted', {
          username,
          message: `${username} gritou UNO!`,
        });
      }
    } catch (err) {
      console.error('[GameHandler] turn:say_uno error:', err);
      emitError('turn:say_uno', err.message || 'Erro ao gritar UNO.');
    }
  });

  // ─── FLUXO DESAFIO: turn:challenge ──────────────────────────
  socket.on('turn:challenge', async (data) => {
    try {
      const { gameId } = data;
      const challenger = socket.user?.username;

      const game = await GameService.findById(gameId);
      const players = game.usersInGame || [];
      const round = await RoundService.getActiveRound(gameId);

      if (!round) return emitError('turn:challenge', 'Nenhuma rodada ativa encontrada.');

      const hands = round.hands || {};
      const saidUno = round.saidUno || {};
      
      let punishedPlayer = null;
      for (const player of players) {
        const username = player.username;
        if (hands[username] && hands[username].length === 1 && !saidUno[username]) {
           punishedPlayer = username;
           break;
        }
      }

      if (punishedPlayer) {
        const { drawn, deck, discardPile } = RoundService.drawCards(
          round.deck || [],
          round.discardPile || [],
          2
        );
        
        const newHands = {
          ...hands,
          [punishedPlayer]: [...hands[punishedPlayer], ...drawn]
        };
        const newSaidUno = { ...saidUno, [punishedPlayer]: false };
        
        await round.update({ deck, discardPile, hands: newHands, saidUno: newSaidUno });
        
        const updatedRoundData = round.toJSON();
        const publicState = RoundService.publicRoundState(updatedRoundData, players);
        
        io.to(`game_${gameId}`).emit('round:updated', {
          message: `🚨 ${challenger} desafiou! ${punishedPlayer} não disse UNO e comprou 2 cartas!`,
          ...publicState,
        });
        io.to(`game_${gameId}`).emit('game:challenged', {
          message: `🚨 ${challenger} desafiou! ${punishedPlayer} não disse UNO e comprou 2 cartas!`
        });
        emitPrivateHands(io, gameId, updatedRoundData, players);
      } else {
        emitError('turn:challenge', 'Ninguém esqueceu de falar UNO.');
      }
    } catch (err) {
      console.error('[GameHandler] turn:challenge error:', err);
      emitError('turn:challenge', err.message || 'Erro ao desafiar.');
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers isolados (fora do handler para manter a função principal limpa)
// ---------------------------------------------------------------------------

/**
 * emitPrivateHands :: (io, gameId, roundData, players) -> void
 * Emite a mão privada para cada jogador via seu socket individual.
 * Utiliza o mecanismo de rooms do Socket.IO para envio direcionado.
 */
function emitPrivateHands(io, gameId, roundData, players) {
  // Itera sobre os jogadores e emite a mão de cada um apenas para ele
  players.forEach((player) => {
    // O frontend deve entrar na sala `private_${gameId}_${username}` ao conectar
    const privateRoom = `private_${gameId}_${player.username}`;
    const myHand = RoundService.privateHandState(roundData, player.username);
    io.to(privateRoom).emit('my:hand', { hand: myHand });
  });
}

/**
 * handleRoundEnd :: (io, gameId, hands, players, winnerUsername) -> Promise<void>
 *
 * Fluxo 3: executado quando uma mão é zerada.
 *   1. Calcula pontos ganhos (cartas restantes dos perdedores)
 *   2. Persiste no banco (Score + Game.totalScores)
 *   3. Se >= 500 pts → game:finished; caso contrário → round:finished + nova rodada
 */
async function handleRoundEnd(io, gameId, hands, players, winnerUsername) {
  // 1. Calcula e persiste os pontos
  const points = RoundService.calculateRoundPoints(hands, winnerUsername);
  const updatedScores = await ScoreService.addPoints(gameId, winnerUsername, points);

  // 2. Verifica condição de fim de jogo (500 pontos)
  const gameWinner = await ScoreService.checkGameWinner(gameId);

  if (gameWinner) {
    // ── Partida encerrada ────────────────────────────────────────────────────
    const winnerUser = await User.findOne({ where: { username: gameWinner } });
    await GameService.update(gameId, {
      status: 'finished',
      winnerId: winnerUser?.id || null,
    });

    io.to(`game_${gameId}`).emit('game:finished', {
      winner: gameWinner,
      totalScores: updatedScores,
      message: `🏆 ${gameWinner} venceu a partida com ${updatedScores[gameWinner]} pontos!`,
    });

    // Atualiza o lobby globalmente
    const games = await GameService.findAll();
    io.emit('lobby:updated', formatManyGamesResponse(games));

  } else {
    // ── Rodada encerrada, partida continua ────────────────────────────────────
    io.to(`game_${gameId}`).emit('round:finished', {
      winner: winnerUsername,
      pointsGained: points,
      totalScores: updatedScores,
      message: `${winnerUsername} venceu esta rodada e ganhou ${points} pontos! Nova rodada em 3 segundos...`,
    });

    // Inicia nova rodada após delay para os clientes exibirem o resultado
    setTimeout(async () => {
      try {
        const freshGame = await GameService.findById(gameId);
        const freshPlayers = freshGame.usersInGame || [];
        const newRound = await RoundService.initRound(gameId, freshPlayers);
        const roundData = newRound.toJSON();

        io.to(`game_${gameId}`).emit('round:updated', {
          message: '🃏 Nova rodada iniciada!',
          ...RoundService.publicRoundState(roundData, freshPlayers),
        });
        emitPrivateHands(io, gameId, roundData, freshPlayers);

      } catch (err) {
        console.error('[GameHandler] Erro ao iniciar nova rodada:', err);
      }
    }, 3000);
  }
}
