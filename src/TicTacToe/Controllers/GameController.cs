namespace TicTacToe.Controllers;

[Route("api/[controller]")]
[ApiController]
[EnableRateLimiting("token")]
public class GameController(
    IGrainFactory grainFactory,
    IGameService gameService)
    : Controller
{
    [HttpGet("get-games")]
    public async Task<IActionResult> GetGames()
    {
        var guid = this.GetGuid();
        if (guid == Guid.Empty)
        {
            return BadRequest("Wrong player id");
        }

        return Json(await gameService.GetGames(guid));
    }

    [HttpPost("create-game")]
    public async Task<IActionResult> CreateGame([FromBody] PlayerInfo user)
    {
        var playerId = this.GetGuid();
        if (playerId == Guid.Empty)
        {
            return BadRequest("Wrong player id");
        }

        var player = grainFactory.GetGrain<IPlayerGrain>(playerId);
        var gameIdTask = await player.CreateGame(user.Name);

        await gameService.SyncGame(playerId);

        return Json(new { GameId = gameIdTask });
    }

    [HttpPost("join-game/{id:guid}")]
    public async Task<IActionResult> Join(Guid id)
    {
        var playerId = this.GetGuid();
        if (playerId == Guid.Empty)
        {
            return BadRequest("Wrong player id");
        }

        var player = grainFactory.GetGrain<IPlayerGrain>(playerId);
        var state = await player.JoinGame(id);

        await gameService.SyncGame(playerId);

        return Json(new { GameState = state });
    }

    [HttpGet("get-moves/{id:guid}")]
    public async Task<IActionResult> GetMoves(Guid id)
    {
        var playerId = this.GetGuid();
        if (playerId == Guid.Empty)
        {
            return BadRequest("Wrong player id");
        }

        var moves = await gameService.GetMoves(playerId, id);
        await gameService.SyncGame(playerId);

        return Json(moves);
    }

    [HttpPost("make-move/{id:guid}")]
    public async Task<IActionResult> MakeMove(Guid id, [FromQuery]int x, [FromQuery]int y)
    {
        var playerId = this.GetGuid();
        if (playerId == Guid.Empty)
        {
            return BadRequest("Wrong player id");
        }

        var move = new GameMove { PlayerId = playerId, X = x, Y = y };
        var state = gameService.MakeMove(id, move);
        await gameService.SyncGame(playerId);

        return Json(state);
    }

    [HttpGet("query-game")]
    public async Task<IActionResult> QueryGame(Guid id)
    {
        var game = grainFactory.GetGrain<IGameGrain>(id);
        var state = await game.GetState();
        return Json(state);
    }

    [HttpPost("set-player")]
    public async Task<IActionResult> SetUser([FromBody] PlayerInfo user)
    {
        var playerId = this.GetGuid();
        if (playerId == Guid.Empty)
        {
            return BadRequest("Wrong player id");
        }

        var player = grainFactory.GetGrain<IPlayerGrain>(playerId);
        await player.SetUsername(user.Name);

        await gameService.SyncGame(playerId);

        return Json(new { });
    }
}