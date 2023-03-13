[Index(nameof(DeviceId), IsUnique = true)]
public class Login
{
    [Key]
    public int Id { get; set; }
    [Required]
    public string UserId { get; set; } = string.Empty;

    public User? User { get; set; }

    public DateTime ExpirationDate { get; set; } = DateTime.Now;

    public bool Ended { get; set; } = false;

    [Required]
    public string DeviceId { get; set; } = string.Empty;
}