namespace TicTacToe.Services;

public class GameService(
    ILogger<GameService> logger,
    IGrainFactory grainFactory,
    IMemoryCache cache,
    IHubContext<MessageHub, IMessageHub> hubContext)
    : IGameService
{
    public async Task<GameInfo> GetGames(Guid playerId)
    {
        var player = grainFactory.GetGrain<IPlayerGrain>(playerId);
        var gamesTask = player.GetGameSummaries();
        var availableTask = player.GetAvailableGames();
        await Task.WhenAll(gamesTask, availableTask);

        var summaries = new List<PairingSummary>();
        summaries.AddRange(availableTask.Result);

        var gameInfo = new GameInfo
        {
            PlayerId = playerId,
            Games = gamesTask.Result,
            AvailableGames = summaries
        };

        return gameInfo;
    }

    public async Task SyncGame(Guid playerId)
    {
        var gameInfo = await GetGames(playerId);
        await hubContext.Clients.Group(playerId.ToString()).ReceiveGameInfo(gameInfo);

        if (!cache.TryGetValue(SystemConstants.CacheKey, out List<Guid>? players))
            return;

        if (players == null) return;

        foreach (var p in players.Where(p => p != playerId))
        {
            var info = await GetGames(p);
            await hubContext.Clients.Group(p.ToString()).ReceiveGameInfo(info);
        }
    }

    public async Task<GameMoves> GetMoves(Guid playerId, Guid gameId)
    {
        var game = grainFactory.GetGrain<IGameGrain>(gameId);
        var moves = await game.GetMoves();
        var summary = await game.GetSummary(playerId);

        return new GameMoves
        {
            Moves = moves,
            Summary = summary
        };
    }

    public async Task<GameState> MakeMove(Guid gameId, GameMove move)
    {
        var game = grainFactory.GetGrain<IGameGrain>(gameId);
        var state = await game.MakeMove(move);

        return state;
    }

    public async Task SyncGameMoves(Guid playerId, Guid gameId)
    {
        var gameMoves = await GetMoves(playerId, gameId);
        await hubContext.Clients.Group(playerId.ToString()).ReceiveGameMoves(gameMoves);

        if (!cache.TryGetValue(SystemConstants.CacheKey, out List<Guid>? players))
            return;

        if (players == null) return;

        foreach (var p in players.Where(p => p != playerId))
        {
            try
            {
                var moves = await GetMoves(p, gameId);
                await hubContext.Clients.Group(p.ToString()).ReceiveGameMoves(moves);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "{Message}", ex.Message);
            }
        }
    }
}