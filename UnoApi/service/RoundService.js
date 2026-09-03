import Card from '../repository/Card.js';
import Round from '../repository/Round.js';

// ---------------------------------------------------------------------------
// Funções auxiliares puras (sem efeitos colaterais)
// ---------------------------------------------------------------------------

// shuffle :: Array -> Array  (Fisher-Yates, retorna novo array sem mutar o original)
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// isStartCard :: card -> boolean
// Cartas válidas para iniciar a pilha de descarte: numéricas e não-curingas
const isStartCard = (card) => {
  const numeric = ['0','1','2','3','4','5','6','7','8','9'];
  return numeric.includes(card.value) && card.color !== 'Wild';
};

// safeIndex :: (index, direction, n) -> number
// Garante que o índice sempre fique dentro dos limites do array (suporta direção negativa)
const safeIndex = (index, direction, n) =>
  ((index + direction) % n + n) % n;

// ---------------------------------------------------------------------------
// RoundService — Motor do jogo UNO (Clean Architecture: sem camada HTTP)
// ---------------------------------------------------------------------------

const RoundService = {
  // ─── Fluxo 1: Inicialização de Rodada ────────────────────────────────────

  /**
   * initRound :: (gameId, players[]) -> Promise<Round>
   * Embaralha o deck de 108 cartas do dicionário, distribui 7 a cada jogador,
   * define a primeira carta do descarte (deve ser numérica) e persiste o Round.
   */
  initRound: async (gameId, players) => {
    // 1. Carrega o dicionário completo do banco (fonte de verdade)
    const allCards = await Card.findAll({ raw: true });

    // 2. Embaralha — HOF: map implícito via Fisher-Yates
    let deck = shuffle(allCards);

    // 3. Distribui 7 cartas a cada jogador (imutável: splice cria cópias)
    const hands = {};
    for (const player of players) {
      hands[player.username] = deck.splice(0, 7);
    }

    // 4. Revela a primeira carta do descarte garantindo que seja numérica
    let topCardIndex = deck.findIndex(isStartCard);
    if (topCardIndex === -1) topCardIndex = 0; // fallback de segurança
    const [topCard] = deck.splice(topCardIndex, 1);

    // 5. Persiste o Round no banco
    const round = await Round.create({
      gameId,
      status: 'active',
      currentPlayerIndex: 0,
      direction: 1,          // 1 = horário, -1 = anti-horário
      activeColor: topCard.color,
      pendingDraws: 0,
      deck,
      discardPile: [topCard],
      hands,
    });

    return round;
  },

  // ─── Fluxo 2: Validação de Jogada ────────────────────────────────────────

  /**
   * isValidPlay :: (card, topCard, activeColor) -> boolean
   * Regras de compatibilidade do UNO:
   *   - Curingas (Wild/WildDraw4) sempre são válidos
   *   - Mesma cor que a cor ativa atual
   *   - Mesmo valor/tipo que o topo do descarte
   */
  isValidPlay: (card, topCard, activeColor) => {
    if (!card) return false;
    if (!topCard) return true;
    
    // Cartas Curinga (Wild e WildDraw4) são sempre válidas
    if (card.color === 'Wild' || card.value === 'Wild' || card.value === 'WildDraw4') return true;
    
    // Validação de cor: a carta deve coincidir com a cor ativa na mesa
    const effectiveColor = activeColor || topCard.color;
    if (effectiveColor && card.color.toLowerCase() === effectiveColor.toLowerCase()) return true;
    
    // Validação de número ou símbolo: deve coincidir com o valor da carta do topo
    if (String(card.value).toLowerCase() === String(topCard.value).toLowerCase()) return true;
    
    return false;
  },


  // ─── Fluxo 2: Resolução de Efeitos ───────────────────────────────────────

  /**
   * applyCardEffect :: (card, state, chosenColor?) -> { direction, pendingDraws, activeColor }
   * Função pura: recebe o estado atual e retorna os campos alterados pela carta jogada.
   * Não muta o estado original.
   */
  applyCardEffect: (card, { direction, pendingDraws, activeColor }, chosenColor) => {
    // Curingas recebem a cor escolhida pelo jogador
    const newColor = card.color === 'Wild' ? (chosenColor || 'Red') : card.color;

    switch (card.value) {
      case 'Reverse':
        return { direction: direction * -1, pendingDraws, activeColor: newColor };
      case 'Draw2':
        return { direction, pendingDraws: pendingDraws + 2, activeColor: newColor };
      case 'WildDraw4':
        return { direction, pendingDraws: pendingDraws + 4, activeColor: newColor };
      default:
        // Skip e cartas numéricas: apenas atualiza a cor
        return { direction, pendingDraws, activeColor: newColor };
    }
  },

  // ─── Fluxo 2: Avanço de Turno ────────────────────────────────────────────

  /**
   * advanceTurn :: (currentIndex, direction, playerCount, cardValue) -> nextIndex
   * Calcula o próximo índice de jogador, considerando:
   *   - Skip, Draw2, WildDraw4: pulam o próximo jogador (2 passos)
   *   - Reverse em jogo de 2 jogadores: age como Skip
   *   - Demais cartas: avanço normal (1 passo)
   */
  advanceTurn: (currentIndex, direction, playerCount, cardValue) => {
    const n = playerCount;
    const isSkip =
      cardValue === 'Skip' ||
      cardValue === 'Draw2' ||
      cardValue === 'WildDraw4' ||
      (cardValue === 'Reverse' && n === 2);

    const steps = isSkip ? 2 : 1;
    return ((currentIndex + direction * steps) % n + n) % n;
  },

  // ─── Fluxo 2: Compra de Cartas ───────────────────────────────────────────

  /**
   * drawCards :: (deck, discardPile, count) -> { drawn, deck, discardPile }
   * Compra `count` cartas do deck. Se o deck esgotar, reembaralha o descarte
   * (mantendo apenas o topo) como novo deck — regra oficial do UNO.
   */
  drawCards: (deck, discardPile, count) => {
    let newDeck = [...deck];
    let newDiscard = [...discardPile];
    const drawn = [];

    for (let i = 0; i < count; i++) {
      if (newDeck.length === 0) {
        if (newDiscard.length <= 1) break; // Deck e descarte esgotados
        const topCard = newDiscard.pop();
        newDeck = shuffle(newDiscard);
        newDiscard = [topCard];
      }
      drawn.push(newDeck.shift());
    }

    return { drawn, deck: newDeck, discardPile: newDiscard };
  },

  // ─── Fluxo 3: Condições de Vitória ───────────────────────────────────────

  /**
   * checkRoundWinner :: hands -> username | null
   * Verifica se algum jogador zerou a mão. Retorna o username do vencedor ou null.
   */
  checkRoundWinner: (hands) => {
    for (const [username, hand] of Object.entries(hands)) {
      if (Array.isArray(hand) && hand.length === 0) return username;
    }
    return null;
  },

  /**
   * calculateRoundPoints :: (hands, winnerUsername) -> number
   * Soma os pontos de todas as cartas nas mãos dos perdedores.
   * HOF: usa reduce para acumular os valores.
   */
  calculateRoundPoints: (hands, winnerUsername) =>
    Object.entries(hands)
      .filter(([username]) => username !== winnerUsername)
      .flatMap(([, hand]) => hand)
      .reduce((sum, card) => sum + (card.points || 0), 0),

  // ─── Helpers de consulta ─────────────────────────────────────────────────

  /**
   * getActiveRound :: gameId -> Promise<Round | null>
   * Busca a rodada ativa mais recente de um jogo.
   */
  getActiveRound: async (gameId) =>
    Round.findOne({
      where: { gameId, status: 'active' },
      order: [['createdAt', 'DESC']],
    }),

  // ─── Serialização pública do estado ──────────────────────────────────────

  /**
   * publicRoundState :: (roundData, players) -> object
   * Serializa o estado da rodada para broadcast. Oculta as mãos dos adversários
   * (substitui por contagem), expondo apenas a mão do jogador solicitante.
   *
   * @param roundData   Objeto com os campos do Round (toJSON() ou plain object)
   * @param players     Array de jogadores do Game (usersInGame)
   */
  publicRoundState: (roundData, players) => {
    const hands = roundData.hands || {};
    // HOF: map para converter cada mão em contagem (privacidade dos adversários)
    const handCounts = Object.fromEntries(
      Object.entries(hands).map(([u, h]) => [u, Array.isArray(h) ? h.length : h])
    );

    const discardPile = roundData.discardPile || [];

    return {
      roundId: roundData.id,
      gameId: roundData.gameId,
      status: roundData.status,
      topCard: discardPile.at(-1) || null,
      activeColor: roundData.activeColor,
      currentPlayerIndex: roundData.currentPlayerIndex,
      currentPlayer: players[roundData.currentPlayerIndex]?.username || null,
      direction: roundData.direction,
      pendingDraws: roundData.pendingDraws,
      deckSize: (roundData.deck || []).length,
      handCounts, // contagem de cartas por jogador (sem revelar as cartas)
      saidUno: roundData.saidUno || {},
    };
  },

  /**
   * privateHandState :: (roundData, username) -> card[]
   * Retorna a mão privada de um jogador específico (para emitir apenas para ele).
   */
  privateHandState: (roundData, username) =>
    (roundData.hands || {})[username] || [],
};

export default RoundService;
