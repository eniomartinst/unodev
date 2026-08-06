import Card from '../repository/Card.js';
import NotFoundException from '../config/exceptions/NotFoundException.js';

class CardService {
  // Retorna o dicionário completo para o front-end
  async findAll() { 
    return await Card.findAll(); 
  }

  // Método para gerar as 108 cartas oficiais do UNO de forma automatizada
  async seedCards() {
    const count = await Card.count();
    if (count > 0) return; // Trava de segurança: se já tem cartas, não duplica

    const colors = ['Red', 'Blue', 'Green', 'Yellow'];
    const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', 'Draw2'];
    const deck = [];

    colors.forEach(color => {
      values.forEach(value => {
        let points = parseInt(value);
        if (isNaN(points)) points = 20; // Cartas de ação (Skip, Reverse, Draw2) valem 20
        
        deck.push({ color, value, points });
        
        // No UNO, existe apenas um "0" por cor, mas duas cópias do restante
        if (value !== '0') {
          deck.push({ color, value, points });
        }
      });
    });

    // Cartas curingas (4 cópias de cada)
    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'Wild', value: 'Wild', points: 50 });
      deck.push({ color: 'Wild', value: 'WildDraw4', points: 50 });
    }

    await Card.bulkCreate(deck);
    console.log("Dicionário de 108 cartas do UNO populado com sucesso no banco!");
  }
}

export default new CardService();