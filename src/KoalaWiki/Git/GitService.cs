using System.ComponentModel;
using LibGit2Sharp;

namespace KoalaWiki.Git;

public class GitService
{
    public static (string localPath, string organization) GetRepositoryPath(string repositoryUrl)
    {
        // Parse repository URL
        var uri = new Uri(repositoryUrl);
        // Get organization name and repository name
        var segments = uri.Segments;
        var organization = segments[1].Trim('/');
        var repositoryName = segments[2].Trim('/').Replace(".git", "");

        // Use shorter paths to avoid long filename issues
        // Use hash values of organization and repository names as directory names
        var orgHash = Math.Abs(organization.GetHashCode()).ToString().Substring(0, 4);
        var repoHash = Math.Abs(repositoryName.GetHashCode()).ToString().Substring(0, 4);
        
        // Combine local path, using short paths
        var repositoryPath = Path.Combine(Constant.GitPath, $"{orgHash}_{organization}", $"{repoHash}_{repositoryName}");
        return (repositoryPath, organization);
    }

    public static (List<Commit> commits, string Sha) PullRepository(
        [Description("Repository URL")] string repositoryUrl,
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

        var result = LibGit2Sharp.Commands.Pull(repo, new Signature("KoalaWiki", "239573049@qq.com", DateTimeOffset.Now),
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
        [Description("Repository URL")] string repositoryUrl,
        string userName = "",
        string password = "",
        [Description("Branch")] string branch = "master")
    {
        // Set environment variables to handle long paths
        Environment.SetEnvironmentVariable("GIT_LONGPATHS", "true");
        
        // Disable symlinks to avoid long filename errors
        Environment.SetEnvironmentVariable("GIT_CONFIG_COUNT", "1");
        Environment.SetEnvironmentVariable("GIT_CONFIG_KEY_0", "core.symlinks");
        Environment.SetEnvironmentVariable("GIT_CONFIG_VALUE_0", "false");
        
        var (localPath, organization) = GetRepositoryPath(repositoryUrl);
        var names = repositoryUrl.Split('/');
        var repositoryName = names[^1].Replace(".git", "");
        localPath = Path.Combine(localPath, branch);

        // Force delete and recreate directory
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

        // Create clone options
        var cloneOptions = new CloneOptions();
        cloneOptions.BranchName = branch;
        
        // Set FetchOptions
        cloneOptions.FetchOptions.CertificateCheck = (_, _, _) => true;
        cloneOptions.FetchOptions.Depth = 0;

        // Set authentication credentials (if provided)
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
            // Use command line to directly clone with symlinks disabled
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
                // If authentication credentials exist, add them to the URL
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
                    // If command line cloning fails, try using LibGit2Sharp
                    Repository.Clone(repositoryUrl, localPath, cloneOptions);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to start git process: {ex.Message}");
                // If command line cloning fails, try using LibGit2Sharp
                Repository.Clone(repositoryUrl, localPath, cloneOptions);
            }

            // Get repository information
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
            
            // Try cloning again
            try
            {
                // Ensure directory is clean
                if (Directory.Exists(localPath))
                {
                    Directory.Delete(localPath, true);
                }
                Directory.CreateDirectory(localPath);
                
                // Use command line to clone again
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
                    // If authentication credentials exist, add them to the URL
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
                        // If command line cloning fails, try using LibGit2Sharp
                        Repository.Clone(repositoryUrl, localPath, cloneOptions);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to start second git process: {ex.Message}");
                    // If command line cloning fails, try using LibGit2Sharp
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
                throw; // Rethrow the exception
            }
        }
    }
}
