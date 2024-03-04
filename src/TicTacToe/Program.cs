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

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

builder.Services.AddMemoryCache();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddTokenBucketLimiter("token", options =>
    {
        options.TokenLimit = 100;
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 5;
        options.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        options.TokensPerPeriod = 20;
        options.AutoReplenishment = true;
    });
});

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
    siloBuilder
        .AddAdoNetGrainStorage(SystemConstants.PersistentStoreName, options =>
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
        .ConfigureLogging(loggingBuilder => loggingBuilder.SetMinimumLevel(LogLevel.Warning).AddConsole());
});

builder.Services.AddTransient<IGameService, GameService>();

builder.Services.AddCors(options =>
{
    var corsOrigins = builder.Configuration.GetValue<string>("CorsOrigins");
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

builder.Services.AddSignalR(options =>
    {
        options.DisableImplicitFromServicesParameters = true;
    })
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