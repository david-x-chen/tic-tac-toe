
using Orleans.Configuration;

var builder = WebApplication.CreateBuilder();

builder.Configuration
    .AddJsonFile("appsettings.json", true, true)
    .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")}.json", true, true)
    .AddEnvironmentVariables();

var config = builder.Configuration.GetSection("AzureKayVault");
var dnsNameKeyVault = config["DNSNameKeyVault"];

if (!string.IsNullOrWhiteSpace(dnsNameKeyVault))
{
    builder.Configuration.AddAzureKeyVault($"{dnsNameKeyVault}",
        config["AADAppRegistrationAppId"],
        config["AADAppRegistrationAppSecret"]);
}

var keyConfigName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production" ? "" : "-dev";
Console.WriteLine(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"));
var sqlConnStr = builder.Configuration[$"mssqlorleans{keyConfigName}"];
Console.WriteLine(sqlConnStr);

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