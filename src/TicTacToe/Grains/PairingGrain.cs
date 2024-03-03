using MemoryCache = System.Runtime.Caching.MemoryCache;

namespace TicTacToe.Grains;

[Reentrant]
public class PairingGrain : Grain, IPairingGrain
{
    private readonly MemoryCache _cache = new("pairing");

    public Task AddGame(Guid gameId, PlayerInfo player)
    {
        _cache.Add(gameId.ToString(), player, new DateTimeOffset(DateTime.UtcNow).AddHours(1));
        return Task.CompletedTask;
    }

    public Task RemoveGame(Guid gameId)
    {
        _cache.Remove(gameId.ToString());
        return Task.CompletedTask;
    }

    public Task<PairingSummary[]> GetGames() =>
        Task.FromResult(_cache.Select(x =>
            new PairingSummary { GameId = Guid.Parse(x.Key), Player = x.Value as PlayerInfo })
            .ToArray());

}
