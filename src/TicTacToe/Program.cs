using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.Extensions.Options;

const string corsPolicy = "cors";

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder();
builder.Configuration
    .AddJsonFile("appsettings.json", true, true)
    .AddEnvironmentVariables();

var kvUrl = builder.Configuration["AzureKeyVault:Url"];
if (!string.IsNullOrWhiteSpace(kvUrl))
{
    builder.Configuration.AddAzureKeyVault($"{kvUrl}",
        builder.Configuration["AzureKeyVault:AppId"],
        builder.Configuration["AzureKeyVault:AppSecret"]);
}

builder.Services.AddApplicationInsightsTelemetry();

builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithCorrelationIdHeader()
        .WriteTo.Console();

    // Configure Application Insights sink
    var telemetryConfiguration =
        services.GetService<IOptions<TelemetryConfiguration>>();

    if (telemetryConfiguration == null) return;

    if (string.IsNullOrEmpty(telemetryConfiguration.Value.ConnectionString))
    {
        telemetryConfiguration.Value.ConnectionString =
            builder.Configuration["ApplicationInsights-ConnectionString"];
    }

    // We have a valid Application Insights setup
    configuration
        .WriteTo
        .ApplicationInsights(
            telemetryConfiguration.Value, TelemetryConverter.Traces);
});

builder.Services.AddMemoryCache();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddTokenBucketLimiter("token", limiterOptions =>
    {
        limiterOptions.TokenLimit = 100;
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 5;
        limiterOptions.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        limiterOptions.TokensPerPeriod = 20;
        limiterOptions.AutoReplenishment = true;
    });
});

var corsOrigins = builder.Configuration["TicTacToe:CORS"];
var keyConfigName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production" ? "" : "-dev";
var sqlConnStr = builder.Configuration[$"mssqlorleans{keyConfigName}"];
var clusterId = Environment.GetEnvironmentVariable("TicTacToe_Cluster_Id");
var serviceId = Environment.GetEnvironmentVariable("TicTacToe_Cluster_ServiceId");
var siloPort = Environment.GetEnvironmentVariable("TicTacToe_Silo_Port");
var gatewayPort = Environment.GetEnvironmentVariable("TicTacToe_Gateway_Port");

if (!int.TryParse(siloPort, out var sPort))
{
    sPort = 11111;
}

if (!int.TryParse(gatewayPort, out var gPort))
{
    gPort = 30000;
}

builder.Host.UseOrleans((ctx, siloBuilder) =>
{
    siloBuilder
        .AddAdoNetGrainStorage(SystemConstants.PersistentStoreName, options =>
        {
            options.Invariant = "System.Data.SqlClient";
            options.ConnectionString = sqlConnStr;
        })
        .Configure<ClusterOptions>(options =>
        {
            options.ClusterId = clusterId ?? $"TicTacToe-Cluster-{Guid.NewGuid()}";
            options.ServiceId = serviceId ?? "TicTacToe-AwesomeService";
        })
        .UseAdoNetClustering(options =>
        {
            options.ConnectionString = sqlConnStr;
            options.Invariant = "System.Data.SqlClient";
        })
        .ConfigureEndpoints(siloPort: sPort, gatewayPort: gPort)
        .ConfigureLogging(loggingBuilder => loggingBuilder.SetMinimumLevel(LogLevel.Warning).AddConsole());
});

builder.Services.AddTransient<IGameService, GameService>();

builder.Services.AddHeaderPropagation(x =>
{
    x.Headers.Add("x-correlation-id");
    x.Headers.Add("traceparent");
});

builder.Services.AddCors(options =>
{
    var origins = string.IsNullOrEmpty(corsOrigins)
        ? ["*"]
        : corsOrigins.Split(';', StringSplitOptions.RemoveEmptyEntries);

    options.DefaultPolicyName = corsPolicy;
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowCredentials();
        policy.SetIsOriginAllowedToAllowWildcardSubdomains();
        policy.WithOrigins(origins);
        policy.AllowAnyHeader();
        policy.AllowAnyMethod();
    });
});

builder.Services.AddControllersWithViews();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSignalR(options => { options.DisableImplicitFromServicesParameters = true; })
    .AddMessagePackProtocol(options =>
    {
        StaticCompositeResolver.Instance.Register(
            ContractlessStandardResolver.Instance,
            StandardResolver.Instance
        );

        options.SerializerOptions = MessagePackSerializerOptions.Standard
            .WithResolver(StaticCompositeResolver.Instance)
            .WithSecurity(MessagePackSecurity.UntrustedData);
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();

app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();

app.UseAuthorization();

app.UseCors(corsPolicy);

app.MapDefaultControllerRoute();

app.MapControllers().RequireCors(corsPolicy);
app.MapHub<MessageHub>("/message");
app.MapFallbackToFile("/index.html");

app.Run();