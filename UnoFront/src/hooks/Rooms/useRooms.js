import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { socket, connectSocket } from '../../socket/socket';

export default function useRooms() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('salas');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const carregarDadosDoLobby = async () => {
    try {
      const userResponse = await api.get('/api/auth/profile');
      setUser({
        name: userResponse.data.name || userResponse.data.username,
        score: 0 
      });

      const roomsResponse = await api.get('/api/games');
      const salasFormatadas = roomsResponse.data.map(game => ({
        id: game.id,
        max: game.maxPlayers,
        players: game.usersInGame ? game.usersInGame.length : 0, 
        status: game.status === 'in_progress' ? 'em jogo' : 'aguardando' 
      }));

      setRooms(salasFormatadas);
    } catch (error) {
      console.error("Erro ao buscar dados reais do lobby:", error);
    }
  };

  useEffect(() => {
    carregarDadosDoLobby();
    
    const socketInstance = connectSocket();

    const handleLobbyUpdate = (games) => {
      const salasFormatadas = games.map(game => ({
        id: game.id,
        max: game.maxPlayers,
        players: game.usersInGame ? game.usersInGame.length : 0, 
        status: game.status === 'in_progress' ? 'em jogo' : 'aguardando' 
      }));
      setRooms(salasFormatadas);
    };

    socketInstance.on('lobby:updated', handleLobbyUpdate);

    return () => {
      socketInstance.off('lobby:updated', handleLobbyUpdate);
    };
  }, []);


  // --- Criar Sala e Entrar ---
  const handleCreateRoom = async () => {
    try {
      // Criar a sala no banco de dados
      const createRes = await api.post('/api/games', {
        title: `Sala do ${user?.name || 'Jogador'}`,
        maxPlayers: maxPlayers,
        status: 'waiting'
      });
      
      const newGameId = createRes.data.id;

      // Salva o ID da sala para a tela de Game saber qual mesa carregar
      localStorage.setItem('currentRoomId', newGameId); 
      navigate('/game'); // Redireciona para a mesa do jogo! A tela /game vai emitir game:join_room via Socket

    } catch (error) {
      console.error("Erro ao criar sala:", error);
      alert(error.response?.data?.error || "Erro ao criar a sala.");
    }
  };

  // --- Entrar numa Sala Existente ---
  const handleJoinRoom = async (gameId) => {
    try {
      localStorage.setItem('currentRoomId', gameId);
      navigate('/game'); // A tela /game vai emitir game:join_room via Socket
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);
      alert(error.response?.data?.error || "Erro ao entrar na sala");
    }
  };

  return {
    user, rooms, activeTab, setActiveTab,
    maxPlayers, setMaxPlayers, settingsOpen, setSettingsOpen,
    handleCreateRoom, handleJoinRoom, carregarDadosDoLobby
  };
}