namespace TicTacToe.Models;

[MessagePackObject]
[GenerateSerializer]
public class GameInfo
{
    [Key(0)]
    [Id(0)]
    public Guid PlayerId { get; set; }

    [Key(1)]
    [Id(1)]
    public List<GameSummary> Games { get; set; } = [];

    [Key(2)]
    [Id(2)]
    public List<PairingSummary> AvailableGames { get; set; } = [];
}

[MessagePackObject]
[GenerateSerializer]
public class GameMoves
{
    [Key(0)]
    [Id(0)]
    public List<GameMove> Moves { get; set; } = [];

    [Key(1)]
    [Id(1)]
    public GameSummary Summary { get; set; }
}