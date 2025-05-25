using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.RegularExpressions;
using FastService;
using KoalaWiki.Core.DataAccess;
using KoalaWiki.Domains.Users;
using KoalaWiki.Dto;
using KoalaWiki.Infrastructure;
using KoalaWiki.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Octokit;
using User = KoalaWiki.Domains.Users.User;

namespace KoalaWiki.Services;

/// <summary>
/// 认证服务
/// </summary>
[Tags("Auth")]
[Filter(typeof(ResultFilter))]
public class AuthService(
    IKoalaWikiContext dbContext,
    JwtOptions jwtOptions,
    ILogger<AuthService> logger,
    IConfiguration configuration,
    IHttpContextAccessor httpContextAccessor) : FastApi
{
    /// <summary>
    /// 用户登录
    /// </summary>
    /// <param name="username">用户名</param>
    /// <param name="password">密码</param>
    /// <returns>登录结果</returns>
    public async Task<LoginDto> LoginAsync(
        string username, string password)
    {
        try
        {
            // 查询用户
            var user = await dbContext.Users
                .FirstOrDefaultAsync(u => u.Name == username || u.Email == username);

            // 用户不存在
            if (user == null)
            {
                return new LoginDto(false, string.Empty, null, null, "用户不存在");
            }

            // 验证密码
            if (password != user.Password)
            {
                return new LoginDto(false, string.Empty, null, null, "密码错误");
            }

            // 更新登录信息
            user.LastLoginAt = DateTime.UtcNow;
            user.LastLoginIp = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
            dbContext.Users.Update(user);
            await dbContext.SaveChangesAsync();
            
            user.Password = string.Empty; // 清空密码

            // 生成JWT令牌
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken(user);

            return new LoginDto(true, token, refreshToken, user, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "用户登录失败");
            return new LoginDto(false, string.Empty, null, null, "登录失败，请稍后再试");
        }
    }

    /// <summary>
    /// 用户注册
    /// </summary>
    /// <param name="username">用户名</param>
    /// <param name="email">邮箱</param>
    /// <param name="password">密码</param>
    /// <returns>注册结果</returns>
    public async Task<(bool Success, string? ErrorMessage)> RegisterAsync(string username, string email,
        string password)
    {
        try
        {
            // 验证用户名格式
            if (!Regex.IsMatch(username, @"^[a-zA-Z0-9_-]{3,16}$"))
            {
                return (false, "用户名格式不正确，只能包含字母、数字、下划线和连字符，长度3-16位");
            }

            // 验证邮箱格式
            if (!Regex.IsMatch(email, @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"))
            {
                return (false, "邮箱格式不正确");
            }

            // 验证密码强度
            if (password.Length < 6)
            {
                return (false, "密码长度不能小于6位");
            }

            // 检查用户名是否已存在
            var existingUsername = await dbContext.Users.AnyAsync(u => u.Name == username);
            if (existingUsername)
            {
                return (false, "用户名已存在");
            }

            // 检查邮箱是否已存在
            var existingEmail = await dbContext.Users.AnyAsync(u => u.Email == email);
            if (existingEmail)
            {
                return (false, "邮箱已被注册");
            }

            // 创建用户
            var user = new User
            {
                Id = Guid.NewGuid().ToString("N"),
                Name = username,
                Email = email,
                Password = Guid.NewGuid().ToString(), // 随机密码
                CreatedAt = DateTime.UtcNow,
                Role = "user" // 默认角色
            };

            // 保存用户
            await dbContext.Users.AddAsync(user);
            await dbContext.SaveChangesAsync();

            return (true, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "用户注册失败");
            return (false, "注册失败，请稍后再试");
        }
    }

    /// <summary>
    /// GitHub登录
    /// </summary>
    /// <param name="code">授权码</param>
    /// <returns>登录结果</returns>
    public async Task<(bool Success, string Token, string? RefreshToken, User? User, string? ErrorMessage)>
        GitHubLoginAsync(string code)
    {
        try
        {
            var clientId = configuration["GitHub:ClientId"];
            var clientSecret = configuration["GitHub:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                return (false, string.Empty, null, null, "GitHub配置错误");
            }

            // 获取访问令牌
            var client = new GitHubClient(new ProductHeaderValue("KoalaWiki"));
            var request = new OauthTokenRequest(clientId, clientSecret, code);
            var token = await client.Oauth.CreateAccessToken(request);

            if (string.IsNullOrEmpty(token.AccessToken))
            {
                return (false, string.Empty, null, null, "GitHub授权失败");
            }

            // 设置访问令牌
            client.Credentials = new Credentials(token.AccessToken);

            // 获取用户信息
            var githubUser = await client.User.Current();

            // 查询用户是否存在
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == githubUser.Email);

            // 用户不存在，自动注册
            if (user == null && !string.IsNullOrEmpty(githubUser.Email))
            {
                user = new User
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Name = githubUser.Login,
                    Email = githubUser.Email,
                    Password = Guid.NewGuid().ToString(), // 随机密码
                    Avatar = githubUser.AvatarUrl,
                    CreatedAt = DateTime.UtcNow,
                    Role = "user" // 默认角色
                };

                // 保存用户
                await dbContext.Users.AddAsync(user);
                await dbContext.SaveChangesAsync();
            }
            else if (user == null)
            {
                return (false, string.Empty, null, null, "GitHub账号未绑定邮箱，无法登录");
            }

            // 更新登录信息
            user.LastLoginAt = DateTime.UtcNow;
            user.LastLoginIp = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
            await dbContext.SaveChangesAsync();

            // 生成JWT令牌
            var jwtToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken(user);

            return (true, jwtToken, refreshToken, user, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GitHub登录失败");
            return (false, string.Empty, null, null, "GitHub登录失败，请稍后再试");
        }
    }

    /// <summary>
    /// 谷歌邮箱登录
    /// </summary>
    /// <param name="idToken">ID令牌</param>
    /// <returns>登录结果</returns>
    public async Task<(bool Success, string Token, string? RefreshToken, User? User, string? ErrorMessage)>
        GoogleLoginAsync(string idToken)
    {
        try
        {
            // 验证Google ID令牌
            var payload = await ValidateGoogleIdToken(idToken);
            if (payload == null)
            {
                return (false, string.Empty, null, null, "Google认证失败");
            }

            // 获取邮箱
            var email = payload.Email;
            if (string.IsNullOrEmpty(email))
            {
                return (false, string.Empty, null, null, "无法获取Google邮箱");
            }

            // 查询用户是否存在
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);

            // 用户不存在，自动注册
            if (user == null)
            {
                // 生成用户名
                var username = email.Split('@')[0];
                var existingUsername = await dbContext.Users.AnyAsync(u => u.Name == username);
                if (existingUsername)
                {
                    username = $"{username}{Guid.NewGuid().ToString("N").Substring(0, 6)}";
                }

                user = new User
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Name = username,
                    Email = email,
                    Password = Guid.NewGuid().ToString(), // 随机密码
                    Avatar = payload.Picture,
                    CreatedAt = DateTime.UtcNow,
                    Role = "user" // 默认角色
                };

                // 保存用户
                await dbContext.Users.AddAsync(user);
                await dbContext.SaveChangesAsync();
            }

            // 更新登录信息
            user.LastLoginAt = DateTime.UtcNow;
            user.LastLoginIp = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
            await dbContext.SaveChangesAsync();

            // 生成JWT令牌
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken(user);

            return (true, token, refreshToken, user, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Google登录失败");
            return (false, string.Empty, null, null, "Google登录失败，请稍后再试");
        }
    }

    /// <summary>
    /// 刷新令牌
    /// </summary>
    /// <param name="refreshToken">刷新令牌</param>
    /// <returns>刷新结果</returns>
    public async Task<(bool Success, string Token, string? RefreshToken, string? ErrorMessage)> RefreshTokenAsync(
        string refreshToken)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = jwtOptions.GetSymmetricSecurityKey();

            // 验证刷新令牌
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(5) // Allow 5 minutes clock skew
            };

            try
            {
                var principal = tokenHandler.ValidateToken(refreshToken, validationParameters, out _);
                var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);

                // 查询用户
                var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    return (false, string.Empty, null, "用户不存在");
                }

                // 生成新的JWT令牌
                var newToken = GenerateJwtToken(user);
                var newRefreshToken = GenerateRefreshToken(user);

                return (true, newToken, newRefreshToken, null);
            }
            catch (SecurityTokenException)
            {
                return (false, string.Empty, null, "无效的刷新令牌");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "刷新令牌失败");
            return (false, string.Empty, null, "刷新令牌失败，请重新登录");
        }
    }

    /// <summary>
    /// 生成JWT令牌
    /// </summary>
    /// <param name="user">用户</param>
    /// <returns>JWT令牌</returns>
    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = jwtOptions.GetSymmetricSecurityKey();
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(jwtOptions.ExpireMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtOptions.Issuer,
            audience: jwtOptions.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// 生成刷新令牌
    /// </summary>
    /// <param name="user">用户</param>
    /// <returns>刷新令牌</returns>
    private string GenerateRefreshToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };

        var key = jwtOptions.GetSymmetricSecurityKey();
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(jwtOptions.RefreshExpireMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtOptions.Issuer,
            audience: jwtOptions.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// 验证Google ID令牌
    /// </summary>
    /// <param name="idToken">ID令牌</param>
    /// <returns>验证结果</returns>
    private async Task<GooglePayload?> ValidateGoogleIdToken(string idToken)
    {
        try
        {
            var clientId = configuration["Google:ClientId"];
            if (string.IsNullOrEmpty(clientId))
            {
                return null;
            }

            // 这里简化了Google ID令牌验证过程
            // 实际应用中应使用Google API客户端库进行验证
            // 或者调用Google OAuth2 TokenInfo端点

            // 模拟验证成功，返回解析的payload
            // 实际应用中需要实现完整的验证逻辑
            var tokenParts = idToken.Split('.');
            if (tokenParts.Length != 3)
            {
                return null;
            }

            var payloadJson = System.Text.Encoding.UTF8.GetString(
                Convert.FromBase64String(tokenParts[1].PadRight(4 * ((tokenParts[1].Length + 3) / 4), '=')
                    .Replace('-', '+').Replace('_', '/')));

            var payload = System.Text.Json.JsonSerializer.Deserialize<GooglePayload>(payloadJson);
            return payload;
        }
        catch
        {
            return null;
        }
    }
}

/// <summary>
/// Google Payload
/// </summary>
public class GooglePayload
{
    /// <summary>
    /// 邮箱
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 是否验证邮箱
    /// </summary>
    public bool EmailVerified { get; set; }

    /// <summary>
    /// 名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 头像
    /// </summary>
    public string Picture { get; set; } = string.Empty;
}