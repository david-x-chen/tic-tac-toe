namespace TicTacToe.Models;

[MessagePackObject]
public class GameInfo
{
    [Key(0)]
    public Guid PlayerId { get; set; }

    [Key(1)] public List<GameSummary> Games { get; set; } = [];

    [Key(2)] public List<PairingSummary> AvailableGames { get; set; } = [];
}

[MessagePackObject]
public class GameMoves
{
    [Key(0)] public List<GameMove> Moves { get; set; } = [];

    [Key(1)]public GameSummary Summary { get; set; }
}