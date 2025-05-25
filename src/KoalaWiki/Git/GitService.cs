using System.ComponentModel;
using LibGit2Sharp;

namespace KoalaWiki.Git;

public class GitService
{
    public static (string localPath, string organization) GetRepositoryPath(string repositoryUrl)
    {
        // 解析仓库地址
        var uri = new Uri(repositoryUrl);
        // 得到组织名和仓库名称
        var segments = uri.Segments;
        var organization = segments[1].Trim('/');
        var repositoryName = segments[2].Trim('/').Replace(".git", "");

        // 使用更短的路径来避免文件名过长问题
        // 使用组织名和仓库名的哈希值作为目录名
        var orgHash = Math.Abs(organization.GetHashCode()).ToString().Substring(0, 4);
        var repoHash = Math.Abs(repositoryName.GetHashCode()).ToString().Substring(0, 4);
        
        // 拼接本地路径，使用短路径
        var repositoryPath = Path.Combine(Constant.GitPath, $"{orgHash}_{organization}", $"{repoHash}_{repositoryName}");
        return (repositoryPath, organization);
    }

    public static (List<Commit> commits, string Sha) PullRepository(
        [Description("仓库地址")] string repositoryUrl,
        string commitId,
        string userName = "",
        string password = "")
    {
        var pullOptions = new PullOptions
        {
            FetchOptions = new FetchOptions()
            {
                CertificateCheck = (_, _, _) => true,
                CredentialsProvider = (_url, _user, _cred) =>
                    new UsernamePasswordCredentials
                    {
                        Username = userName,
                        Password = password
                    }
            }
        };

        // 先克隆
        if (!Directory.Exists(repositoryUrl))
        {
            var cloneOptions = new CloneOptions
            {
                FetchOptions =
                {
                    CertificateCheck = (_, _, _) => true,
                    CredentialsProvider = (_url, _user, _cred) =>
                        new UsernamePasswordCredentials
                        {
                            Username = userName,
                            Password = password
                        }
                }
            };
            Repository.Clone(repositoryUrl, repositoryUrl, cloneOptions);
        }
        
        if(!Directory.Exists(repositoryUrl))
        {
            throw new Exception("克隆失败");
        }

        // pull仓库
        using var repo = new Repository(repositoryUrl);

        var result = Commands.Pull(repo, new Signature("KoalaWiki", "239573049@qq.com", DateTimeOffset.Now),
            pullOptions);

        // commitId是上次提交id，根据commitId获取到到现在的所有提交记录
        if (!string.IsNullOrEmpty(commitId))
        {
            var commit = repo.Lookup<Commit>(commitId);
            if (commit != null)
            {
                // 获取从指定commitId到HEAD的所有提交记录
                var filter = new CommitFilter
                {
                    IncludeReachableFrom = repo.Head.Tip,
                    ExcludeReachableFrom = commit,
                    SortBy = CommitSortStrategies.Time
                };
                var commits = repo.Commits.QueryBy(filter).ToList();
                return (commits, repo.Head.Tip.Sha);
            }
        }

        return (repo.Commits.ToList(), repo.Head.Tip.Sha);
    }

    /// <summary>
    /// 拉取指定仓库
    /// </summary>
    /// <returns></returns>
    public static GitRepositoryInfo CloneRepository(
        [Description("仓库地址")] string repositoryUrl,
        string userName = "",
        string password = "",
        [Description("分支")] string branch = "master")
    {
        // 设置环境变量来处理长路径
        Environment.SetEnvironmentVariable("GIT_LONGPATHS", "true");
        
        // 禁用符号链接以避免文件名过长错误
        Environment.SetEnvironmentVariable("GIT_CONFIG_COUNT", "1");
        Environment.SetEnvironmentVariable("GIT_CONFIG_KEY_0", "core.symlinks");
        Environment.SetEnvironmentVariable("GIT_CONFIG_VALUE_0", "false");
        
        var (localPath, organization) = GetRepositoryPath(repositoryUrl);
        var names = repositoryUrl.Split('/');
        var repositoryName = names[^1].Replace(".git", "");
        localPath = Path.Combine(localPath, branch);

        // 强制删除并重新创建目录
        try
        {
            if (Directory.Exists(localPath))
            {
                Directory.Delete(localPath, true);
            }
            Directory.CreateDirectory(localPath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to prepare repository directory: {ex.Message}");
        }

        // 创建克隆选项
        var cloneOptions = new CloneOptions();
        cloneOptions.BranchName = branch;
        
        // 设置FetchOptions
        cloneOptions.FetchOptions.CertificateCheck = (_, _, _) => true;
        cloneOptions.FetchOptions.Depth = 0;

        // 设置认证信息（如果有）
        if (!string.IsNullOrEmpty(userName))
        {
            cloneOptions.FetchOptions.CredentialsProvider = (_url, _user, _cred) =>
                new UsernamePasswordCredentials
                {
                    Username = userName,
                    Password = password
                };
        }

        try
        {
            // 使用命令行直接克隆以禁用符号链接
            var processStartInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "git",
                Arguments = $"clone -c core.symlinks=false {repositoryUrl} {localPath} --branch {branch}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            if (!string.IsNullOrEmpty(userName) && !string.IsNullOrEmpty(password))
            {
                // 如果有认证信息，将其添加到URL中
                var uri = new Uri(repositoryUrl);
                var userInfo = Uri.EscapeDataString(userName) + ":" + Uri.EscapeDataString(password);
                var authenticatedUrl = $"{uri.Scheme}://{userInfo}@{uri.Host}{uri.PathAndQuery}";
                processStartInfo.Arguments = $"clone -c core.symlinks=false {authenticatedUrl} {localPath} --branch {branch}";
            }

            try
            {
                var process = System.Diagnostics.Process.Start(processStartInfo);
                process.WaitForExit();

                if (process.ExitCode != 0)
                {
                    var error = process.StandardError.ReadToEnd();
                    Console.WriteLine($"Git clone command failed: {error}");
                    // 如果命令行克隆失败，尝试使用 LibGit2Sharp
                    Repository.Clone(repositoryUrl, localPath, cloneOptions);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to start git process: {ex.Message}");
                // 如果命令行克隆失败，尝试使用 LibGit2Sharp
                Repository.Clone(repositoryUrl, localPath, cloneOptions);
            }

            // 获取仓库信息
            using var repo = new Repository(localPath);
            var branchName = repo.Head.FriendlyName;
            var version = repo.Head.Tip.Sha;
            var commitTime = repo.Head.Tip.Committer.When;
            var commitAuthor = repo.Head.Tip.Committer.Name;
            var commitMessage = repo.Head.Tip.Message;

            return new GitRepositoryInfo(localPath, repositoryName, organization, branchName, commitTime.ToString(),
                commitAuthor, commitMessage, version);
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error cloning repository: {e.Message}");
            
            // 尝试再次克隆
            try
            {
                // 确保目录干净
                if (Directory.Exists(localPath))
                {
                    Directory.Delete(localPath, true);
                }
                Directory.CreateDirectory(localPath);
                
                // 再次使用命令行克隆
                var processStartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "git",
                    Arguments = $"clone -c core.symlinks=false {repositoryUrl} {localPath} --branch {branch}",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                if (!string.IsNullOrEmpty(userName) && !string.IsNullOrEmpty(password))
                {
                    // 如果有认证信息，将其添加到URL中
                    var uri = new Uri(repositoryUrl);
                    var userInfo = Uri.EscapeDataString(userName) + ":" + Uri.EscapeDataString(password);
                    var authenticatedUrl = $"{uri.Scheme}://{userInfo}@{uri.Host}{uri.PathAndQuery}";
                    processStartInfo.Arguments = $"clone -c core.symlinks=false {authenticatedUrl} {localPath} --branch {branch}";
                }

                try
                {
                    var process = System.Diagnostics.Process.Start(processStartInfo);
                    process.WaitForExit();

                    if (process.ExitCode != 0)
                    {
                        var error = process.StandardError.ReadToEnd();
                        Console.WriteLine($"Second Git clone command failed: {error}");
                        // 如果命令行克隆失败，尝试使用 LibGit2Sharp
                        Repository.Clone(repositoryUrl, localPath, cloneOptions);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to start second git process: {ex.Message}");
                    // 如果命令行克隆失败，尝试使用 LibGit2Sharp
                    Repository.Clone(repositoryUrl, localPath, cloneOptions);
                }
                
                using var repo = new Repository(localPath);
                var branchName = repo.Head.FriendlyName;
                var version = repo.Head.Tip.Sha;
                var commitTime = repo.Head.Tip.Committer.When;
                var commitAuthor = repo.Head.Tip.Committer.Name;
                var commitMessage = repo.Head.Tip.Message;

                return new GitRepositoryInfo(localPath, repositoryName, organization, branchName, commitTime.ToString(),
                    commitAuthor, commitMessage, version);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed second attempt to clone repository: {ex.Message}");
                throw; // 向上抛出异常
            }
        }
    }
}
