﻿using Newtonsoft.Json;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Text;
namespace LoginAndSignUp;
public class Password
{

    public const string SYMBOLS = @"!@#$%^&*()_+{}|:<>?";

    public record class Config
    {
        public int MinLength { get; init; } = 6;
        public bool RequiredDigit { get; init; } = false;
        public bool RequiredLowercase { get; init; } = false;
        public bool RequiredUppercase { get; init; } = false;
        public string RequiredSymbols { get; init; } = string.Empty;

        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }
    }

    [Flags]
    public enum PasswordProblem : byte
    {
        None = 0,
        Length = 1,
        Digit = 2,
        Lowercase = 4,
        Uppercase = 8,
        Symbol = 16,
    }

    public static Config DefaultConfig { get; } = new();

    public static bool CheckLength(string password, Config? config = null)
    {
        if (config is null)
        {
            config = new Config();
        }
        return password.Length >= config.MinLength;
    }

    public static bool CheckDigit(string password, Config? config = null)
    {
        if (config is null)
        {
            config = new Config();
        }
        if (config.RequiredDigit)
        {
            return password.Any(char.IsDigit);
        }
        return true;
    }

    public static bool CheckLowercase(string password, Config? config = null)
    {
        if (config is null)
        {
            config = new Config();
        }
        if (config.RequiredLowercase)
        {
            return password.Any(char.IsLower);
        }
        return true;
    }

    public static bool CheckUppercase(string password, Config? config = null)
    {
        if (config is null)
        {
            config = new Config();
        }
        if (config.RequiredUppercase)
        {
            return password.Any(char.IsUpper);
        }
        return true;
    }

    public static bool CheckSymbol(string password, Config? config = null)
    {
        if (config is null)
        {
            config = new Config();
        }
        if (config.RequiredSymbols != string.Empty)
        {
            return password.Any(c => config.RequiredSymbols.Contains(c));
        }
        return true;
    }

    public static PasswordProblem CheckPassword(string password, Config? config = null)
    {
        if (config is null)
        {
            config = new Config();
        }

        var problems = PasswordProblem.None;

        if (!CheckLength(password, config))
        {
            problems |= PasswordProblem.Length;
        }

        if (!CheckDigit(password, config))
        {
            problems |= PasswordProblem.Digit;
        }

        if (!CheckLowercase(password, config))
        {
            problems |= PasswordProblem.Lowercase;
        }

        if (!CheckUppercase(password, config))
        {
            problems |= PasswordProblem.Uppercase;
        }

        if (!CheckSymbol(password, config))
        {
            problems |= PasswordProblem.Symbol;
        }

        return problems;

    }



    public static string HashPassword(string text)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(text));
            return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
        }
    }
}

public class Email
{
    public const string EMAIL_REGEX_STRING = @"^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$";
    static readonly Regex REGEX = new(EMAIL_REGEX_STRING);

    public static bool IsValid(string email)
    {
        return REGEX.Match(email).Success;
        // OR
        //     var addr = new System.Net.Mail.MailAddress(email);
        //     return addr.Address == email;
    }

    public static int GenerateVerificationCode(int length = 4)
    {
        return Random.Shared.Next((int)Math.Pow(10, length - 1), (int)(Math.Pow(10, length) - 1));
    }

    public static void SendVerificationCode(string email)
    {

    }
}



