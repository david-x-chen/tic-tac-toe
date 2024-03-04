namespace TicTacToe.Services;

public interface IGameService
{
    Task<GameInfo> GetGames(Guid playerId);

    Task SyncGame(Guid playerId);

    Task<GameMoves> GetMoves(Guid playerId, Guid gameId);

    Task<GameState> MakeMove(Guid gameId, GameMove move);

    Task SyncGameMoves(Guid playerId, Guid gameId);
}