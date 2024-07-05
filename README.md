# Quake Log Parser

## Descrição
Este projeto é um parser de logs para o jogo Quake, desenvolvido para analisar arquivos de log gerados por um servidor do jogo e extrair estatísticas.
As informações extraídas incluem detalhes sobre mortes, causas das mortes e estatísticas individuais dos jogadores.

## Funcionalidades
- Leitura de arquivos de .
- Agrupamento dos dados de jogo por partida.
- Coleta de dados de kills.
- Relatório detalhado por partida, incluindo:
    - Total de kills.
    - Jogadores envolvidos.
    - Scoreboard com nicknames, kills e deaths.
    - Kills agrupadas por causa da morte.

## Pré-requisitos
Para rodar este projeto, você precisará ter Node.js instalado em seu ambiente. O projeto foi desenvolvido e testado usando Node.js versão 18.x.

## Instalação
Clone o repositório para sua máquina local usando:
```bash
git clone https://github.com/bergaminifrg/log-parser.git
```
Navegue até o diretório do projeto e instale as dependências:
```bash
cd log-parser
npm install
```

## Executando o Projeto
Para executar o parser, você pode usar o comando:
```bash
npm run dev
```
Este comando compila o TypeScript e executa o script resultante.

## Testes
Para executar os testes unitários, utilize o comando:
```bash
npm test
```

## Decisões de Design
### Padrões de Projeto Utilizados
- **Strategy Pattern:** Utilizado para modularizar o processamento das diferentes linhas do log. Cada tipo de linha (kill, game start, game end) é processado por uma estratégia específica, permitindo fácil extensão e manutenção.
- **Singleton Pattern:** Utilizado na classe de configuração para garantir uma única instância das configurações do parser em todo o projeto.