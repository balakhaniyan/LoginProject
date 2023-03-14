using System.Collections.Generic;
namespace Shared;
class SignUpMethods
{
    public static readonly Password.Config PasswordConfig = new()
    {
        MinLength = 6,
        RequiredDigit = true,
        RequiredLowercase = true,
        RequiredUppercase = true,
        RequiredSymbols = Password.SYMBOLS
    };
    public static async void Validate(SignUpViewModel signUpViewModel)
    {
        if (signUpViewModel.Email is null || !Email.IsValid(signUpViewModel.Email))
        {
            signUpViewModel.Validation.SignUpProblems.Email = true;
        }

        if (signUpViewModel.UserName is null)
        {
            signUpViewModel.Validation.SignUpProblems.UserName = true;
        }

        if (signUpViewModel.FirstName is null)
        {
            signUpViewModel.Validation.SignUpProblems.FirstName = true;
        }

        if (signUpViewModel.LastName is null)
        {
            signUpViewModel.Validation.SignUpProblems.LastName = true;
        }

        if (signUpViewModel.Password is null)
        {
            signUpViewModel.Validation.SignUpProblems.Password =
            (Password.PasswordProblem.Length |
             Password.PasswordProblem.Digit |
             Password.PasswordProblem.Lowercase |
             Password.PasswordProblem.Uppercase |
             Password.PasswordProblem.Symbol).ToString();
        }
        else
        {
            signUpViewModel.Validation.SignUpProblems.Password = Password.CheckPassword(signUpViewModel.Password, PasswordConfig).ToString();

        }

        if (signUpViewModel.ConfirmPassword is null || signUpViewModel.Password != signUpViewModel.ConfirmPassword)
        {
            signUpViewModel.Validation.SignUpProblems.ConfirmPassword = true;
        }

        using (var connection = new SqlConnection(DataBase.ConnectionString))
        {

            var sql = "SELECT * FROM Users WHERE Email = @Email OR UserName = @UserName";
            var result = await connection.QueryFirstOrDefaultAsync<User>(sql, param: signUpViewModel);

            if (result is not null)
            {
                if (result.Email == signUpViewModel.Email)
                {
                    signUpViewModel.Validation.SignUpProblems.Email = true;
                }

                if (result.UserName == signUpViewModel.UserName)
                {
                    signUpViewModel.Validation.SignUpProblems.UserName = true;
                }
            }
        }
    }
}