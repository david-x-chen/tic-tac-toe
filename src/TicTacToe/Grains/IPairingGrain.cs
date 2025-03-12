namespace TicTacToe.Grains;

public interface IPairingGrain : IGrainWithGuidKey
{
    Task AddGame(Guid gameId, PlayerInfo player);

    Task RemoveGame(Guid gameId);

    Task<PairingSummary[]> GetGames();
}

[Immutable]
[MessagePackObject]
[GenerateSerializer]
public class PairingSummary
{
    [Key(0)]
    [Id(0)]
    public Guid GameId { get; set; }
    [Key(1)]
    [Id(1)]
    public PlayerInfo? Player { get; set; }
}