using MyTAX.Models;
using Shared;
using LoginAndSignUp;
namespace MyTAX.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View();
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
    public IActionResult Login(LoginViewModel loginViewModel)
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

        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {
            var sql = "SELECT * FROM Users WHERE UserName = @UserName AND Password = @Password";
            var result = connection.QueryFirstOrDefault<User>(sql, param: loginViewModel);
            if (result is null)
            {
                loginViewModel = loginViewModel with { IsNotUser = true, Password = null };
                return View(loginViewModel);
            }
        }

        return View("Index", loginViewModel);
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

        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {
            User user = (User)signUpViewModel;
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

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}