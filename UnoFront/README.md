# Uno - Frontend

Este repositorio contem a interface grafica do jogo Uno, construida com React e Vite. A responsabilidade deste projeto e renderizar as telas interativas para os jogadores e realizar a comunicacao com a API, consumindo os servicos de autenticacao e o andamento do jogo.

## Rotas da Aplicacao

O fluxo de navegacao da aplicacao e dividido em rotas publicas (para visitantes) e rotas protegidas (para jogadores logados). A tabela abaixo descreve cada uma delas e o seu respectivo papel no sistema:

| Rota | Papel Principal | Regra de Protecao |
|---|---|---|
| `/login` | Permitir que o jogador informe seu usuario e senha para receber o token de acesso da API. | Rota de Visitante. Se o jogador ja possuir um token no armazenamento local, ele sera redirecionado automaticamente para `/rooms`. |
| `/register` | Coletar os dados de novos jogadores (nome, email, usuario, idade e senha) e registrar uma nova conta. | Rota de Visitante. Se o jogador ja possuir um token no armazenamento local, ele sera redirecionado automaticamente para `/rooms`. |
| `/rooms` | Servir como o saguao principal do jogo, onde o jogador logado podera listar, criar e acessar as salas das partidas de Uno. | Rota Protegida. O jogador so pode acessar essa tela se possuir um token valido. Caso contrario, e redirecionado para `/login`. |

## Configuracao e Execucao

Voce pode executar o frontend de duas maneiras diferentes: utilizando a infraestrutura via Docker ou rodando o servidor de desenvolvimento localmente (Node.js).

### 1. Executando COM Docker

Se voce estiver utilizando a infraestrutura completa do projeto, nao e necessario instalar dependencias locais na sua maquina. O container se encarrega de tudo.

- Navegue ate a raiz principal do projeto (onde esta o arquivo `docker-compose.yml`).
- Execute o comando para subir todos os servicos:
```bash
docker-compose up -d --build
```
- O Docker ira construir a imagem do front, instalar as dependencias internamente e disponibilizar a interface na porta configurada (geralmente `http://localhost:5173`). O recarregamento automatico ja esta configurado para refletir as alteracoes no codigo instantaneamente, de dentro para fora do container.

### 2. Executando SEM Docker (Localmente)

Para rodar a aplicacao localmente sem o container, certifique-se de ter o Node.js instalado.

1. Variaveis de Ambiente:
Renomeie ou copie o arquivo `.env.example` para `.env` na raiz da pasta `UnoFront` para apontar para a API correta:
```text
VITE_API_URL=http://localhost:3000
```

2. Instalacao das dependencias locais:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
O servidor do Vite ira inicializar e exibir no terminal a URL local (ex: `http://localhost:5173`) para voce acessar o jogo no seu navegador.
