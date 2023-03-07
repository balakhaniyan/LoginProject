using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using MyTAX.Models;
using Shared;
using LoginAndSignUp;

namespace MyTAX.Controllers;

public class HomeController : Controller
{
    private readonly Password.Config _passwordConfig = new()
    {
        MinLength = 6,
        RequiredDigit = true,
        RequiredLowercase = true,
        RequiredUppercase = true,
        RequiredSymbol = true
    };
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
        return View();
    }

    public IActionResult SignUp()
    {
        SignUpViewModel model = new()
        {
            Validation = new()
            {
                PasswordConfig = _passwordConfig,
                SignUpProblems = new()
            }
        };
        return View(model);
    }

    [HttpPost]
    public IActionResult SignUp(SignUpViewModel signUpViewModel)
    {
        if (signUpViewModel is null)
        {
            return NotFound();
        }
        // if (model.Email is null || !Email.IsValid(model.Email))
        // {
        //     model.Validation.SignUpProblems.Email = true;
        // }
        // if (model.Password is not null)
        // {
        //     // model.Validation.SignUpProblems.Password = Password.CheckPassword(model.Password, _passwordConfig).ToString();
        // }

        // if (model.Password != model.ConfirmPassword)
        // {
        //     model.Validation.SignUpProblems.ConfirmPassword = true;
        // }



        User user = new()
        {
            FirstName = signUpViewModel.FirstName,
            LastName = signUpViewModel.LastName,
            UserName = signUpViewModel.UserName,
            Password = signUpViewModel.Password,
            Email = signUpViewModel.Email
        };

        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {
            var sql = "insert into Users values (@Id, @FirstName, @LastName, @Username, @Password, @Email)";
            connection.Execute(sql, param: user);
        }
        return View("Index");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
