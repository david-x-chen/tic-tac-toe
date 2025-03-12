namespace TicTacToe.Models;

[Immutable]
[MessagePackObject]
[GenerateSerializer]
public class PlayerInfo
{
    [Key(0)]
    [Id(0)]
    public Guid Id { get; set; }

    [Key(1)]
    [Id(1)]
    public string Name { get; set; } = string.Empty;
}