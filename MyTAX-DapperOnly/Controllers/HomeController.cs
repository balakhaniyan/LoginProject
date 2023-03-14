using MyTAX.Models;
using Shared;
namespace MyTAX.Controllers;

public class HomeController : Controller
{

    private const int COOKIE_EXPIRATION_DAY_STAMP = 1;
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public async Task<IActionResult> Index()
    {

        string? userId = Request.Cookies["UserId"];
        string? deviceId = Request.Cookies["DeviceId"];

        if (userId == null || deviceId == null)
        {
            return View(null);
        }
        else
        {
            using (var connection = new SqlConnection(DataBase.ConnectionString))
            {
                var sql = "SELECT * FROM Logins WHERE UserId = @UserId AND DeviceId = @DeviceId";
                Login result = await connection.QueryFirstOrDefaultAsync<Login>(sql, param: new { UserId = userId, DeviceId = deviceId });
                if (result is null || result.Ended == true || result.ExpirationDate < DateTime.Now)
                {
                    return View(null);
                }
                else
                {
                    sql = "SELECT * FROM Users WHERE Id = @Id";
                    User user = await connection.QueryFirstOrDefaultAsync<User>(sql, param: new { Id = userId });
                    if (user is null)
                    {
                        return View(null);
                    }
                    UserViewModel userViewModel = new()
                    {
                        FirstName = user.FirstName,
                        LastName = user.LastName
                    };
                    return View(userViewModel);
                }
            }
        }
    }

    public IActionResult Login()
    {
        LoginViewModel loginViewModel = new()
        {
            IsNotUser = false
        };
        return View(loginViewModel);
    }

    [HttpPost]
    public async Task<IActionResult> Login(LoginViewModel loginViewModel)
    {
        if (loginViewModel is null)
        {
            return NotFound();
        }

        if (loginViewModel.UserName is null || loginViewModel.Password is null)
        {
            return View(loginViewModel);
        }

        loginViewModel = loginViewModel with { Password = Password.HashPassword(loginViewModel.Password) };

        User? result;
        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {
            var sql = "SELECT * FROM Users WHERE UserName = @UserName AND Password = @Password";
            result = connection.QueryFirstOrDefault<User>(sql, param: loginViewModel);
            if (result is null)
            {
                loginViewModel = loginViewModel with { IsNotUser = true, Password = "" };
                return View(loginViewModel);
            }
        }

        var expirationDate = DateTime.Now.AddDays(COOKIE_EXPIRATION_DAY_STAMP);
        string deviceId = Guid.NewGuid().ToString();

        var cookieOptions = new CookieOptions()
        {
            Expires = expirationDate,
            Path = "/",
        };

        Response.Cookies.Append("UserId", result.Id, cookieOptions);
        Response.Cookies.Append("DeviceId", deviceId, cookieOptions);

        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {
            var insert_sql = """
            INSERT INTO Logins(UserId, DeviceId, ExpirationDate, Ended) 
            VALUES (@UserId, @DeviceId, @ExpirationDate, @Ended) 
            """;
            try
            {
                await connection.ExecuteAsync(insert_sql, param: new { UserId = result.Id, DeviceId = deviceId, ExpirationDate = expirationDate, Ended = false });
            }
            catch (SqlException ex)
            {
                throw new System.Exception(ex.Message);
            }
        }

        return Redirect("Index");
    }

    public IActionResult SignUp()
    {
        SignUpViewModel model = new()
        {
            Validation = new()
            {
                PasswordConfig = SignUpMethods.PasswordConfig,
                SignUpProblems = new()
            }
        };
        return View(model);
    }


    [HttpPost]
    public async Task<IActionResult> SignUp(SignUpViewModel signUpViewModel)
    {
        if (signUpViewModel is null)
        {
            return NotFound();
        }

        SignUpMethods.Validate(signUpViewModel);

        if (signUpViewModel.Validation.SignUpProblems.HasProblem())
        {
            return View(signUpViewModel);
        }

        User user = (User)signUpViewModel;
        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {
            var insert_sql = """
            INSERT INTO Users(Id, FirstName, LastName, Username, Password, Email) 
            VALUES (@Id, @FirstName, @LastName, @Username, @Password, @Email)
            """;
            try
            {
                await connection.ExecuteAsync(insert_sql, param: user);
            }
            catch (SqlException ex)
            {
                throw new System.Exception(ex.Message);
            }
        }

        SignUpCompletedViewModel model = new()
        {
            FirstName = signUpViewModel.FirstName,
            LastName = signUpViewModel.LastName,
            UserName = signUpViewModel.UserName,
        };
        return View("SignUpCompleted", model);
    }

    public async Task<IActionResult> LogOut()
    {
        string? userId = Request.Cookies["UserId"];
        string? deviceId = Request.Cookies["DeviceId"];
        if (userId == null || deviceId == null)
        {
            return View(null);
        }
        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {
            string sql = "UPDATE Logins SET Ended = @Ended WHERE UserId = @UserId AND DeviceId = @DeviceId";
            await connection.ExecuteAsync(sql, new { Ended = true, UserId = userId, DeviceId = deviceId });
        }
        Response.Cookies.Delete("UserId");
        Response.Cookies.Delete("DeviceId");
        return Redirect("Index");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}