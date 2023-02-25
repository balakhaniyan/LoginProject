using LoginAndSignUp;
namespace LoginAndSignUpTest;

public class PasswordUnitTest
{

    public readonly Password.Config config = new()
    {
        MinLength = 8,
        RequiredDigit = true,
        RequiredLowercase = true,
        RequiredUppercase = true,
        RequiredSpecial = true
    };

    [Fact]
    public void TestLength1()
    {
        var password = "12345678";
        Assert.True(Password.CheckLength(password, config));
    }
    [Fact]
    public void TestLength2()
    {
        var password = "12345";
        Assert.False(Password.CheckLength(password, config));
    }
    [Fact]
    public void RequiredDigit1()
    {
        var password = "1abcdefg";
        Assert.True(Password.CheckDigit(password, config));
    }

    [Fact]
    public void RequiredDigit2()
    {
        var password = "abcdefg";
        Assert.False(Password.CheckDigit(password, config));
    }

    [Fact]
    public void RequiredLowercase1()
    {
        var password = "1abcdefg";
        Assert.True(Password.CheckLowercase(password, config));
    }

    [Fact]
    public void RequiredLowercase2()
    {
        var password = "1ABCDEFG";
        Assert.False(Password.CheckLowercase(password, config));
    }

    [Fact]
    public void RequiredUppercase1()
    {
        var password = "1ABCDEFG";
        Assert.True(Password.CheckUppercase(password, config));
    }

    [Fact]
    public void RequiredUppercase2()
    {
        var password = "1abcdefg";
        Assert.False(Password.CheckUppercase(password, config));
    }

    [Fact]
    public void RequiredSpecial1()
    {
        var password = "1abcdefg!";
        Assert.True(Password.CheckSymbol(password, config));
    }

    [Fact]
    public void RequiredSpecial2()
    {
        var password = "1abcdefg";
        Assert.False(Password.CheckSymbol(password, config));
    }


    [Fact]
    public void RequiredPassword1()
    {
        var password = "1abcdefG!";
        Assert.True(Password.CheckPassword(password, config) == Password.PasswordProblem.None);
    }

    [Fact]
    public void RequiredPassword2()
    {
        var password = "1abcdefg";
        Assert.True(Password.CheckPassword(password, config) == (Password.PasswordProblem.Uppercase | Password.PasswordProblem.Special));
    }

    [Fact]
    public void RequiredPassword3()
    {
        var easy_config = new Password.Config();
        var password = "123456";
        Assert.True(Password.CheckPassword(password, easy_config) == Password.PasswordProblem.None);
    }


    [Fact]
    public void RequiredPasswordWithoutSpecial()
    {
        var without_special_config = config with { RequiredSpecial = false };
        var password = "1abcdefG";
        Assert.True(Password.CheckPassword(password, without_special_config) == Password.PasswordProblem.None);
    }
}