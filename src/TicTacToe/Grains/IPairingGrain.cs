namespace TicTacToe.Grains;

public interface IPairingGrain : IGrainWithGuidKey
{
    Task AddGame(Guid gameId, PlayerInfo player);

    Task RemoveGame(Guid gameId);

    Task<PairingSummary[]> GetGames();
}

[Immutable]
[MessagePackObject(keyAsPropertyName: true)]
[GenerateSerializer]
public class PairingSummary
{

    [Id(0)]
    public Guid GameId { get; set; }

    [Id(1)]
    public PlayerInfo? Player { get; set; }
}