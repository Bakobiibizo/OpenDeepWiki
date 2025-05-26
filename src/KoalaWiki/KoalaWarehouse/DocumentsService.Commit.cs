using System.Text.RegularExpressions;
using LibGit2Sharp;
using Microsoft.SemanticKernel;
using Newtonsoft.Json;
using Serilog;

namespace KoalaWiki.KoalaWarehouse;

public partial class DocumentsService
{
    /// <summary>
    /// 生成更新日志
    /// </summary>
    public async Task<List<CommitResultDto>> GenerateUpdateLogAsync(string gitPath,
        string readme, string gitRepositoryUrl, string branch, Kernel kernel)
    {
        Log.Logger.Information("GenerateUpdateLogAsync started for repository: {Repository}, Branch: {Branch}", gitRepositoryUrl, branch);
        
        // Ensure branch is not null or empty
        if (string.IsNullOrEmpty(branch))
        {
            branch = "main"; // Default to main if branch is not specified
            Log.Logger.Warning("Branch parameter is null or empty, defaulting to 'main'");
        }
        
        string commitMessage = string.Empty;
        
        try 
        {
            // 读取git log
            using var repo = new Repository(gitPath, new RepositoryOptions());
            Log.Logger.Information("Opened Git repository at path: {GitPath}", gitPath);

            var log = repo.Commits
                .OrderByDescending(x => x.Committer.When)
                .Take(20)
                .OrderBy(x => x.Committer.When)
                .ToList();
                
            Log.Logger.Information("Retrieved {CommitCount} commits from repository", log.Count);

            foreach (var commit in log)
            {
                commitMessage += "提交人：" + commit.Committer.Name + "\n提交内容\n<message>\n" + commit.Message +
                             "<message>";

                commitMessage += "\n提交时间：" + commit.Committer.When.ToString("yyyy-MM-dd HH:mm:ss") + "\n";
            }
        }
        catch (Exception ex)
        {
            Log.Logger.Error(ex, "Error accessing git repository at path: {GitPath}", gitPath);
            return new List<CommitResultDto>();
        }

        var plugin = kernel.Plugins["CodeAnalysis"]["CommitAnalyze"];
        Log.Logger.Information("Invoking CommitAnalyze plugin with git_branch: {Branch}", branch);

        var str = string.Empty;
        try
        {
            await foreach (var item in kernel.InvokeStreamingAsync(plugin, new KernelArguments()
                           {
                               ["readme"] = readme ?? string.Empty,
                               ["git_repository"] = gitRepositoryUrl ?? string.Empty,
                               ["commit_message"] = commitMessage,
                               ["git_branch"] = branch // Fixed variable name to match what the plugin expects
                           }))
            {
                str += item;
            }
            
            Log.Logger.Information("Received response from CommitAnalyze plugin, length: {Length} characters", str?.Length ?? 0);
        }
        catch (Exception ex)
        {
            Log.Logger.Error(ex, "Error invoking CommitAnalyze plugin");
            return new List<CommitResultDto>();
        }

        try
        {
            // First, try to extract content within <changelog> tags
            var regex = new Regex(@"<changelog>(.*?)</changelog>",
                RegexOptions.Singleline);
            
            var match = regex.Match(str);

            if (match.Success)
            {
                // 提取到的内容
                str = match.Groups[1].Value;
                Log.Logger.Information("Successfully extracted content from <changelog> tags");
            }
            else
            {
                Log.Logger.Warning("No <changelog> tags found in response");
            }
            
            // Clean up the string to ensure it's valid JSON
            str = str.Trim();
            Log.Logger.Information("Cleaned string for JSON parsing, first 100 chars: {StringPreview}", 
                str.Length > 100 ? str.Substring(0, 100) + "..." : str);
            
            // Check if the string starts with '[' for a JSON array
            if (!str.StartsWith("["))
            {
                // If not, try to find a JSON array within the string
                var jsonArrayRegex = new Regex(@"\[.*\]", RegexOptions.Singleline);
                var jsonMatch = jsonArrayRegex.Match(str);
                
                if (jsonMatch.Success)
                {
                    str = jsonMatch.Value;
                    Log.Logger.Information("Found JSON array within response using regex");
                }
                else
                {
                    // If no JSON array found, create a default empty array
                    Log.Logger.Warning("No valid JSON array found in AI response. Creating default empty array.");
                    return new List<CommitResultDto>();
                }
            }
            
            // Try to deserialize the JSON
            var result = JsonConvert.DeserializeObject<List<CommitResultDto>>(str);
            
            // If deserialization returns null, return an empty list
            if (result == null)
            {
                Log.Logger.Warning("JSON deserialization returned null. Creating default empty array.");
                return new List<CommitResultDto>();
            }
            
            Log.Logger.Information("Successfully deserialized JSON to {Count} CommitResultDto objects", result.Count);
            return result;
        }
        catch (Exception ex)
        {
            // Log the exception and the content that caused it
            Log.Logger.Error(ex, "Error parsing JSON from AI response. Content: {Content}", 
                str.Length > 500 ? str.Substring(0, 500) + "..." : str);
            
            // Return an empty list as fallback
            return new List<CommitResultDto>();
        }
    }

    public class CommitResultDto
    {
        public DateTime date { get; set; }

        public string title { get; set; }

        public string description { get; set; }
    }
}
