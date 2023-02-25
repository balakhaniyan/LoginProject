using LoginAndSignUp;
namespace LoginAndSignUpTest;

public class EmailUnitTest
{
    [Fact]
    public void TestEmail1()
    {
        var email = "data@gmail.com";
        Assert.True(Email.IsValid(email));
    }
    [Fact]
    public void TestEmail2()
    {
        var email = "123@set.com";
        Assert.True(Email.IsValid(email));
    }

    [Fact]
    public void TestVerificationCode()
    {
        var code = Email.GenerateVerificationCode();
        Assert.True(code >= 1000 && code <= 9999);
    }
}