global using Newtonsoft.Json;
using System.Security.Cryptography;
using System.ComponentModel.DataAnnotations;
using LoginAndSignUp;

public class SignUpViewModel
{
    public string? Email { get; set; }

    public string? UserName { get; set; }

    public string? Password { get; set; }

    public string? ConfirmPassword { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    // public string? VerificationCode { get; set; }

    public Validation Validation { get; set; } = new();

}

public class Validation
{
    public Password.Config PasswordConfig { get; init; } = new();

    public Problem SignUpProblems { get; init; } = new();

    public record class Problem
    {
        public bool FirstName { get; set; } = false;
        public bool LastName { get; set; } = false;
        public bool Email { get; set; } = false;
        public bool UserName { get; set; } = false;
        public LoginAndSignUp.Password.PasswordProblem Password { get; set; } = LoginAndSignUp.Password.PasswordProblem.None;
        public bool ConfirmPassword { get; set; } = false;
        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }
    }
}