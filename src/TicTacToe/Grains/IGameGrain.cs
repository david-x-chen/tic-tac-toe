namespace TicTacToe.Grains;

public interface IGameGrain : IGrainWithGuidKey
{
    Task<GameState> AddPlayerToGame(Guid player);
    Task<GameState> GetState();
    Task<List<GameMove>> GetMoves();
    Task<GameState> MakeMove(GameMove move);
    Task<GameSummary> GetSummary(Guid player);
    Task SetName(string name);
}

[Serializable]
public enum GameState
{
    AwaitingPlayers,
    InPlay,
    Finished
}

[Serializable]
public enum GameOutcome
{
    Win,
    Lose,
    Draw
}

[MessagePackObject]
[GenerateSerializer]
public struct GameMove
{
    [Key(0)]
    [Id(0)]
    public Guid PlayerId { get; set; }
    [Key(1)]
    [Id(1)]
    public int X { get; set; }
    [Key(2)]
    [Id(2)]
    public int Y { get; set; }
    [Key(3)]
    [Id(3)]public GameState State { get; set; }
}

[MessagePackObject]
[GenerateSerializer]
public struct GameSummary
{
    [Key(0)]
    [Id(0)]
    public GameState State { get; set; }
    [Key(1)]
    [Id(1)]
    public bool YourMove { get; set; }
    [Key(2)]
    [Id(2)]
    public int NumMoves { get; set; }
    [Key(3)]
    [Id(3)]
    public GameOutcome Outcome { get; set; }
    [Key(4)]
    [Id(4)]
    public int NumPlayers { get; set; }
    [Key(5)]
    [Id(5)]
    public Guid GameId { get; set; }
    [Key(6)]
    [Id(6)]
    public string[] Usernames { get; set; }
    [Key(7)]
    [Id(7)]
    public string Name { get; set; }
    [Key(8)]
    [Id(8)]
    public bool GameStarter { get; set; }
}
