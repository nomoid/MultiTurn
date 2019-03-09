# MultiTurn: A Turn-Based Multiplayer Game Framework

By Markus Feng

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