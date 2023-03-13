using System.Security.Cryptography;
using System.ComponentModel.DataAnnotations;

public record class SignUpViewModel
{
    public string? Email { get; set; }

    public string? UserName { get; set; }

    public string? Password { get; set; }

    public string? ConfirmPassword { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    // public string? VerificationCode { get; set; }

    public Validation Validation { get; set; } = new();

    public static explicit operator User(SignUpViewModel signUpViewModel)
    {
        User user = new()
        {
            FirstName = signUpViewModel.FirstName,
            LastName = signUpViewModel.LastName,
            UserName = signUpViewModel.UserName,
            Password = LoginAndSignUp.Password.HashPassword(signUpViewModel.Password),
            Email = signUpViewModel.Email
        };
        return user;
    }
}

public record class Validation
{
    public Password.Config PasswordConfig { get; init; } = new();

    public Problem SignUpProblems { get; init; } = new();

    public record class Problem
    {
        public bool FirstName { get; set; } = false;
        public bool LastName { get; set; } = false;
        public bool Email { get; set; } = false;
        public bool UserName { get; set; } = false;
        public string Password { get; set; } = LoginAndSignUp.Password.PasswordProblem.None.ToString();
        public bool ConfirmPassword { get; set; } = false;
        public bool DuplicateEmail { get; set; } = false;
        public bool DuplicateUserName { get; set; } = false;
        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }
        public bool HasProblem()
        {
            var properties = this.GetType().GetProperties();
            foreach (var property in properties)
            {
                var value = property.GetValue(this);
                if ((value.GetType() == typeof(string) && value.ToString() != LoginAndSignUp.Password.PasswordProblem.None.ToString()) || (value.GetType() == typeof(bool) && (bool)value))
                {
                    return true;
                }
            }
            return false;
        }
    }
}

public record class LoginViewModel
{
    [Required]
    public string UserName { get; set; }

    [Required]
    public string Password { get; set; }

    public bool IsNotUser { get; set; } = false;
}

public record SignUpCompletedViewModel
{
    public string? UserName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}