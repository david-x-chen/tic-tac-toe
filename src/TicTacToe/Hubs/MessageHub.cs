namespace TicTacToe.Hubs;

public class MessageHub : Hub<IMessageHub>
{
    public async Task SendGameInfo(Guid playerId, [FromServices] IGameService gameService)
    {
        var gameInfo = await gameService.GetGames(playerId);
        await Clients.All.ReceiveGameInfo(gameInfo);
    }

    public async Task SendGameMoves(Guid playerId, Guid gameId, [FromServices] IGameService gameService)
    {
        var moves = await gameService.GetMoves(playerId, gameId);
        await Clients.Group(playerId.ToString()).ReceiveGameMoves(moves);
    }

    public async Task SendGameMoveState(Guid gameId, GameMove move, [FromServices] IGameService gameService)
    {
        var state = await gameService.MakeMove(gameId, move);
        move.State = state;
        await Clients.Group(move.PlayerId.ToString()).ReceiveGameMove(move);

        await gameService.SyncGameMoves(move.PlayerId, gameId);
    }

    public override async Task OnConnectedAsync()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var fvi = FileVersionInfo.GetVersionInfo(assembly.Location);

        var num = await HandleOnlinePlayers(true);

        await Clients.All.ReceiveVersion(fvi.FileVersion);
        await Clients.All.OnlinePlayers(num);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var num = await HandleOnlinePlayers(false);
        await Clients.All.OnlinePlayers(num);
    }

    private async Task<int> HandleOnlinePlayers(bool add)
    {
        var httpContext = Context.GetHttpContext();
        var cache = httpContext?.RequestServices.GetService<IMemoryCache>();
        var id = httpContext?.Request.Query["playerId"].ToString();

        if (cache == null) return -1;
        if (!Guid.TryParse(id, out var playerId)) return -2;
        if (playerId == Guid.Empty) return -3;

        if (cache.TryGetValue(SystemConstants.CacheKey, out List<Guid>? players))
        {
            players ??= [];

            switch (add)
            {
                case true when !players.Contains(playerId):
                    await Groups.AddToGroupAsync(Context.ConnectionId, id);
                    players.Add(playerId);
                    break;
                case false when players.Contains(playerId):
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, id);
                    players.Remove(playerId);
                    break;
            }
        }

        cache.Set(SystemConstants.CacheKey, players, TimeSpan.FromDays(1));

        return players?.Count ?? 0;
    }
}