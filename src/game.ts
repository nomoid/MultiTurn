import Move from './move';
import Server from './multiturn/server';
import Remote from './remote/player';
import Board from './server/board';

function main() {
    const options = {
        players: 2,
        // turnStructure: TurnStructure.inOrder,
        state: new Board()
    };
    const game = new Server<Remote, Board>(Remote, runner, options);
    game.start();
}

async function runner(game: Server<Remote, Board>): Promise<void> {
    const player = game.players.current();
    const board = game.state;
    const validator = (possibleMove: Move) => !board.occupied(possibleMove);
    const move = await player.remote.getMove(validator);
    board.occupy(move, player.num);
    const win = board.checkVictory();
    if (win >= 0) {
        player.win();
    }
}
