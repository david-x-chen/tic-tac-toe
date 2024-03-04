namespace TicTacToe.Models;

[Immutable]
[GenerateSerializer]
public class PlayerInfo
{
    [Id(0)] public Guid Id { get; set; }

    [Id(1)] public string Name { get; set; } = string.Empty;
}