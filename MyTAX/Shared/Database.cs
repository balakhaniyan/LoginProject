namespace Shared;
class DataBase
{
    public static readonly string AppSettings = "appsettings.json";
    public static readonly IConfigurationRoot Configuration = new ConfigurationBuilder()
       .SetBasePath(Directory.GetCurrentDirectory())
       .AddJsonFile(AppSettings)
       .Build();
    public static readonly string? ConnectionString = Configuration.GetConnectionString("DefaultConnection");
}