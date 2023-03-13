using Shared;

namespace API;

[Route("/api/[controller]")]
[ApiController]
public class SignUpAPIController : ControllerBase
{
    [Route("[action]")]
    public async Task<bool> IsUserNameDuplicate(string? username)
    {
        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {

            var sql = "SELECT * FROM Users WHERE UserName = @UserName";
            var result = await connection.QueryFirstOrDefaultAsync<User>(sql, param: new { UserName = username });
            if (result is null)
            {
                return false;
            }
            return true;
        }
    }

    [Route("[action]")]
    public async Task<bool> IsEmailDuplicate(string? email)
    {
        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {

            var sql = "SELECT * FROM Users WHERE Email = @Email";
            var result = await connection.QueryFirstOrDefaultAsync<User>(sql, param: new { Email = email });
            if (result is null)
            {
                return false;
            }
            return true;
        }
    }
}
