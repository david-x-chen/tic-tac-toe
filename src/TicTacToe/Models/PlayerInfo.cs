namespace TicTacToe.Models;

[Immutable]
[MessagePackObject]
public class PlayerInfo
{
    [Key(0)] public Guid Id { get; set; }

    [Key(1)] public string Name { get; set; } = string.Empty;
}