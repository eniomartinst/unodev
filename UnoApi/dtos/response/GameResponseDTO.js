export const formatGameResponse = (game) => {
  return {
    id: game.id,
    title: game.title,
    status: game.status,
    maxPlayers: game.maxPlayers,
    createdAt: game.createdAt
  };
};

export const formatManyGamesResponse = (games) => {
  return games.map(formatGameResponse);
};
