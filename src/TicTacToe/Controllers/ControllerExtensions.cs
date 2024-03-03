namespace TicTacToe.Controllers;

public static class ControllerExtensions
{
    public static Guid GetGuid(this ControllerBase controller)
    {
        if (controller.Request.Headers["x-player-id"].ToString() is { Length: > 0 } idCookie)
        {
            return Guid.Parse(idCookie);
        }

        return Guid.Empty;
    }
}
