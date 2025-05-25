using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace KoalaWiki.Options;

/// <summary>
/// JWT配置选项
/// </summary>
public class JwtOptions
{
    /// <summary>
    /// 配置名称
    /// </summary>
    public const string Name = "Jwt";
    
    /// <summary>
    /// 密钥
    /// </summary>
    public string Secret { get; set; } = string.Empty;
    
    /// <summary>
    /// 颁发者
    /// </summary>
    public string Issuer { get; set; } = string.Empty;
    
    /// <summary>
    /// 接收者
    /// </summary>
    public string Audience { get; set; } = string.Empty;
    
    /// <summary>
    /// 过期时间（分钟）
    /// </summary>
    public int ExpireMinutes { get; set; } = 60 * 24; // 默认1天
    
    /// <summary>
    /// 刷新令牌过期时间（分钟）
    /// </summary>
    public int RefreshExpireMinutes { get; set; } = 60 * 24 * 7; // 默认7天
    
    /// <summary>
    /// 获取签名凭证
    /// </summary>
    public SymmetricSecurityKey GetSymmetricSecurityKey()
    {
        // Change from UTF8 encoding to Base64 decoding
        return new SymmetricSecurityKey(Convert.FromBase64String(Secret));
    }
    
    /// <summary>
    /// 安全密钥
    /// </summary>
    public SymmetricSecurityKey SecurityKey => new(Encoding.UTF8.GetBytes(Secret));

    /// <summary>
    /// 签名凭据
    /// </summary>
    public SigningCredentials SigningCredentials => new(SecurityKey, SecurityAlgorithms.HmacSha512);
    
    /// <summary>
    /// 初始化配置
    /// </summary>
// In JwtOptions.cs
public static JwtOptions InitConfig(IConfiguration configuration)
{
    var options = configuration.GetSection(Name).Get<JwtOptions>() ?? new JwtOptions();
    
    if (string.IsNullOrEmpty(options.Secret))
    {
        // Generate new secure key
        var key = new byte[32];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(key);
        options.Secret = Convert.ToBase64String(key);
    }
    else 
    {
        // Validate existing secret
        try
        {
            Convert.FromBase64String(options.Secret);
        }
        catch
        {
            // Regenerate if invalid
            var key = new byte[32];
            using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(key);
            options.Secret = Convert.ToBase64String(key);
        }
        
        
    }
    return options;
}
}