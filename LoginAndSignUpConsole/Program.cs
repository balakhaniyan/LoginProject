using System.Data.SqlClient;
using Dapper;

var cs = @"Server=.;Database=MyDataBase;Trusted_Connection=True;";

using (var con = new SqlConnection(cs))
{
    con.Open();
    var version = con.ExecuteScalar<string>("SELECT COUNT(*) FROM data");
    Console.WriteLine(version);
}