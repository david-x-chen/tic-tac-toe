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
public struct GameMove
{
    [Key(0)] public Guid PlayerId { get; set; }
    [Key(1)] public int X { get; set; }
    [Key(2)] public int Y { get; set; }
    [Key(3)] public GameState State { get; set; }
}

[MessagePackObject]
public struct GameSummary
{
    [Key(0)]  public GameState State { get; set; }
    [Key(1)]  public bool YourMove { get; set; }
    [Key(2)]  public int NumMoves { get; set; }
    [Key(3)]  public GameOutcome Outcome { get; set; }
    [Key(4)]  public int NumPlayers { get; set; }
    [Key(5)]  public Guid GameId { get; set; }
    [Key(6)]  public string[] Usernames { get; set; }
    [Key(7)]  public string Name { get; set; }
    [Key(8)]  public bool GameStarter { get; set; }
}
