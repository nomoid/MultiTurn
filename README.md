# MultiTurn: A Turn-Based Multiplayer Game Framework

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

## Sample game: Chess

The turn-based multiplayer networking logic for the game is abstracted away by
library functions, with the help of `Promises`, `async`, and `await`.
```typescript
async function runner(game: Server<Remote, Board>): Promise<void> {
  const player = game.getCurrentPlayer();
  const color = numToColor(player.num);
  if (board.getAllValidMoves(color).length === 0) {
    if (board.isInCheck(color)) {
      game.gameOver(opponentNum(player.num).toString());
    }
    else {
      game.gameOver((0).toString());
    }
  }
  const validator = (possibleMove: Move) =>
    board.tryMove(numToColor(player.num),
      start(possibleMove),
      end(possibleMove));
  let move: Move;
  do {
    move = await player.remote.getMove();
  } while (!validator(move));
}
```

### Implementation

- The above is a slightly modifed version of the server-side multiplayer
  networking logic in the [game](src/chess/game.ts) class. The logic to set
  up the networking interface is present in the [server](src/chess/server.ts)
  class.
- The client-side multiplayer networking logic resides in the
  [remote](src/chess/remote.ts) class.
- Most of the logic for the Chess game itself is in the
  [board](src/chess/board.ts) class and the [rules](src/chess/rules.ts) class.
- The client user interface is spread among the HTML/CSS files in the
  [public](public) directory and the [client](src/chess/client.ts) class.
- The serialized move object is found in the [move](src/chess/move.ts) class.
- The remainder of the library is found in the [multiturn](src/multiturn)
  directory.

For the complete Chess sample, see [here](src/chess).

## Sample game: Tic-Tac-Toe

Tic-tac-toe involves similar multiplayer logic to the chess example above.
```typescript
async function runner(game: Server<Remote, Board>): Promise<void> {
  const player = game.getCurrentPlayer();
  const board = state;
  const validator = (possibleMove: Move) => !board.occupied(possibleMove);
  let move: Move;
  do {
    move = await player.remote.getMove();
  } while (!validator(move));
  board.occupy(move, player.num);
  const win = board.checkVictory();
  if (win > 0) {
    game.gameOver(player.num.toString());
    return;
  }
  const full = board.checkFull();
  if (full) {
    game.gameOver((0).toString());
  }
}
```

For the complete Tic-Tac-Toe sample, see [here](src/tictactoe).