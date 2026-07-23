export const formatPlayerResponse = (player) => {
  return {
    id: player.id,
    name: player.name,
    email: player.email,
    age: player.age,
    createdAt: player.createdAt
  };
};

export const formatManyPlayersResponse = (players) => {
  return players.map(formatPlayerResponse);
};
