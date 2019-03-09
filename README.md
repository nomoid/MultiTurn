# MultiTurn: A Turn-Based Multiplayer Game Framework

By Markus Feng

Disclaimer: This is currently under active development, so changes may occur at
any moment without prior notice. Many features are not yet complete. Use at
your own risk!

MultiTurn is a turn-based multiplayer game framework. Its design goals are that
it should abstract away redundant networking/user management code that would be
present in turn-based multiplayer games, so that the developer can focus on
developing the game, not the endge. It is intended to be used with some other
game engine that deals with the other aspects of creating a game, such as game
logic and graphics.

See the [specification](docs/specs.pdf) document for more details.

## Installation
Install [yarn](https://yarnpkg.com/)

Installing the dependencies:
```
yarn
```

## Usage
Building the client:
```bash
yarn build-client
```

Building the server:
```bash
yarn build-server
```

Running the server:
```bash
yarn server
```

The server can now be accessed on http://localhost:8080.

## Sample game: Tic-Tac-Toe

The turn-based multiplayer networking logic for the game is abstracted away by
library functions, with the help of `Promises`, `async`, and `await`.
```typescript
async function runner(game: Server<Remote, Board>): Promise<void> {
  const player = game.getCurrentPlayer();
  const board = state;
  const validator = (possibleMove: Move) => !board.occupied(possibleMove);
  let move;
  do {
    move = await player.remote.getMove();
  } while (!validator(move));
  console.log(`Valid move: {${move.x}, ${move.y}}`);
  board.occupy(move, player.num);
  const win = board.checkVictory();
  if (win >= 0) {
    game.gameOver(player.num.toString());
    return;
  }
  const full = board.checkFull();
  if (full) {
    game.gameOver((-1).toString());
  }
}
```

For the complete Tic-Tac-Toe sample, see [here](src/tictactoe).