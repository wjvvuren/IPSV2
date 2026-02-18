using DotNetEnv;
using Scalar.AspNetCore;
using IpsApi.Services;

// Load .env file (credentials, DB config)
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// ----- Services -----
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSingleton<DatabaseService>();

// CORS — allow the Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// ----- Middleware -----
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("AllowFrontend");

app.MapControllers();

app.Run();
