namespace TicTacToe.Hubs;

public interface IMessageHub
{
    Task ReceiveVersion(string? version);

    Task ReceiveMessage(string user, string message);

    Task ReceiveGameInfo(GameInfo gameInfo);

    Task ReceiveGameMove(GameMove move);

    Task ReceiveGameMoves(GameMoves gameMoves);

    Task OnlinePlayers(int numOfOnlinePlayers);
}