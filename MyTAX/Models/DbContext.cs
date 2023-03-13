using Shared;
public class MyTaxDataBase : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer(DataBase.ConnectionString);
        }
    }
    public DbSet<User>? Users { get; set; }
    public DbSet<Login>? Logins { get; set; }
}