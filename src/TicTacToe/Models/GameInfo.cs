namespace TicTacToe.Models;

[MessagePackObject(keyAsPropertyName: true)]
[GenerateSerializer]
public class GameInfo
{

    [Id(0)]
    public Guid PlayerId { get; set; }


    [Id(1)]
    public List<GameSummary> Games { get; set; } = [];


    [Id(2)]
    public List<PairingSummary> AvailableGames { get; set; } = [];
}

[MessagePackObject(keyAsPropertyName: true)]
[GenerateSerializer]
public class GameMoves
{

    [Id(0)]
    public List<GameMove> Moves { get; set; } = [];


    [Id(1)]
    public GameSummary Summary { get; set; }
}