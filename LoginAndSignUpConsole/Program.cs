using LoginAndSignUp;

var config = new Password.Config()
{
    MinLength = 8,
    RequiredDigit = true,
    RequiredLowercase = true,
    RequiredUppercase = true,
    RequiredSpecial = true
};

Console.WriteLine(config.ToJson());