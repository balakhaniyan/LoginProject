global using System.ComponentModel.DataAnnotations;
public class User
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required]
    public string Email { get; set; } = string.Empty;
    [Required]
    public string UserName { get; set; } = string.Empty;
    [Required]
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}