import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../service/authService';

export default function useLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await authService.login({ username, password });
      
      // Salva o token localmente
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
      }
      
      navigate('/rooms');
    } catch (err) {
      // Trata erros vindos da API
      if (err.response?.data?.error) {
        // Extrai mensagens de erro detalhadas se houver
        const serverError = err.response.data.error;
        if (Array.isArray(serverError)) {
          setError(serverError.map(e => e.message).join(' | '));
        } else {
          setError(serverError);
        }
      } else {
        setError('Erro ao realizar login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    username, setUsername,
    password, setPassword,
    error,
    loading,
    handleSubmit
  };
}
