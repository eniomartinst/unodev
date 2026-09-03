export const mockOpponents = [
  { id: 1, name: "Ana_Gamer", avatar: "🐱", cardCount: 8, position: 'top', avatarBg: "#d8b4fe", avatarBorder: "#463f41ff" },
  { id: 2, name: "Jogador_1", avatar: "🦊", cardCount: 4, position: 'left', avatarBg: "#312e81", avatarBorder: "#3f3f46" },
  { id: 3, name: "Jogador_3", avatar: "🐼", cardCount: 2, position: 'right', avatarBg: "#10b981", avatarBorder: "#3f3f46" },

];

export const mockPlayedCards = [
  { type: 'front', value: '7', color: '#73aa2c', id: 'initial' }
];

export const mockPlayerCards = [
  { id: 45, type: 'front', value: '2', color: '#b01e35' },
  { id: 45, type: 'front', value: '7', color: '#ead426' },
  { id: 35, type: 'front', value: '5', color: '#ead426' },
];

export const mockGameState = {
  roomId: "X8K9V",
  score: 1500,
  currentTurnUserId: 2, // ID do jogador que tem a vez agora
  direction: 1, // 1 para horário, -1 para anti-horário (útil para animar setas na mesa)
  activeColor: "#b01e35", // Essencial: se a carta do topo for +4 (preta), o React precisa saber qual cor o jogador escolheu para pintar o meio da mesa
  unoCalledBy: null // ou o ID de quem gritou UNO na rodada
};