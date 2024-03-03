namespace TicTacToe.Controllers;

public class ViewModel 
{
    public string GameId { get; set; } = null!;

    public string AssmVersion { get; set; } = null!;
}

public class HomeController(IGrainFactory grainFactory) : Controller
{
    public async Task<IActionResult> Join(Guid id)
    {
        var guid = this.GetGuid();
        if (guid == Guid.Empty)
        {
            return BadRequest("Wrong player id");
        }

        var player = grainFactory.GetGrain<IPlayerGrain>(guid);
        await player.JoinGame(id);
        return Ok(id);
    }
}
