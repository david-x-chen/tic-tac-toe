namespace TicTacToe.Grains;

public interface IPairingGrain : IGrainWithIntegerKey
{
    Task AddGame(Guid gameId, PlayerInfo player);

    Task RemoveGame(Guid gameId);

    Task<PairingSummary[]> GetGames();
}

[Immutable]
[MessagePackObject]
public class PairingSummary
{
    [Key(0)] public Guid GameId { get; set; }
    [Key(1)] public PlayerInfo? Player { get; set; }
}