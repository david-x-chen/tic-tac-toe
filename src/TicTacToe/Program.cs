
using Orleans.Configuration;
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder();

builder.Configuration
    .AddJsonFile("appsettings.json", true, true)
    .AddEnvironmentVariables();

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

var kvUrl = builder.Configuration["AzureKeyVault:Url"];

if (!string.IsNullOrWhiteSpace(kvUrl))
{
    builder.Configuration.AddAzureKeyVault($"{kvUrl}",
        builder.Configuration["AzureKeyVault:AppId"],
        builder.Configuration["AzureKeyVault:AppSecret"]);
}

var keyConfigName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production" ? "" : "-dev";
var sqlConnStr = builder.Configuration[$"mssqlorleans{keyConfigName}"];

builder.Host.UseOrleans((ctx, siloBuilder) =>
{
    siloBuilder.AddAdoNetGrainStorage("OrleansStorage", options =>
    {
        options.Invariant = "System.Data.SqlClient";
        options.ConnectionString = sqlConnStr;
    })
    .Configure<ClusterOptions>(options =>
    {
        options.ClusterId = "ClusterTicTacToe";
        options.ServiceId = "AwesomeTicTacToeService";
    })
    .UseAdoNetClustering(options =>
    {
        options.ConnectionString = sqlConnStr;
        options.Invariant = "System.Data.SqlClient";
    })
        .ConfigureEndpoints(siloPort: 11111, gatewayPort: 30000)
        .ConfigureLogging(builder => builder.SetMinimumLevel(LogLevel.Warning).AddConsole());
});

builder.WebHost.ConfigureKestrel((ctx, kestrelOptions) =>
{
    // To avoid port conflicts, each Web server must listen on a different port.
    var instanceId = ctx.Configuration.GetValue<int>("InstanceId");
    kestrelOptions.ListenAnyIP(8080 + instanceId);
});

builder.Services.AddControllersWithViews();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseDefaultFiles();
app.UseRouting();

app.UseAuthorization();

app.MapDefaultControllerRoute();

app.Run();