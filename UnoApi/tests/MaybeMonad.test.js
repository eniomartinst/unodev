import { describe, it } from 'node:test';
import assert from 'node:assert';
import Maybe from '../config/utils/Maybe.js';

describe('Programação Funcional - Maybe Monad (Atividade 2)', () => {

  describe('Cenário 1: Operações Seguras com Dados Existentes', () => {
    it('Deve encadear transformações de dados corretamente (Functor)', () => {
      // Simulação do payload que extraímos da tabela Game
      const activeUser = { username: 'elton', isCreator: true, token: 'abc-123' };

      // Encapsulamos no Monad e extraímos uma propriedade específica
      const isCreator = Maybe.of(activeUser)
        .map(u => u.isCreator)
        .getOrElse(false);

      assert.strictEqual(isCreator, true);
    });
  });

  describe('Cenário 2: Tratamento Seguro de Falhas (Null Safety)', () => {
    it('Deve evitar erros (Null Pointer) ao tentar transformar um valor inexistente', () => {
      // Simulação: O token enviado não encontrou ninguém no array (retorna undefined)
      const nonExistentUser = undefined;

      // Se fizéssemos nonExistentUser.isCreator sem o Monad, o Node.js dispararia um "TypeError"
      // Com o Monad, a operação 'map' entra em curto-circuito de forma "segura"
      const isCreator = Maybe.of(nonExistentUser)
        .map(u => u.isCreator)
        .getOrElse(false); // Fornece um fallback

      assert.strictEqual(isCreator, false);
    });

    it('Deve aplicar múltiplas transformações seguras', () => {
      const gameData = { title: 'Sala dos Campeões', players: 4 };

      const uppercaseTitle = Maybe.of(gameData)
        .map(data => data.title)
        .map(title => title.toUpperCase())
        .getOrElse('SALA DESCONHECIDA');

      assert.strictEqual(uppercaseTitle, 'SALA DOS CAMPEÕES');
    });
  });

});