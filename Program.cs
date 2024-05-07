using BlazorViteDemo.Components;
using Vite.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add the Vite manifest integration.
builder.Services.AddViteServices();

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    if (bool.Parse(builder.Configuration["Vite:Server:Enabled"] ?? string.Empty)) 
    {
        // Proxies requests for css and js to 
        // the Vite development server for HMR.
        app.UseViteDevelopmentServer(true);
    }
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
