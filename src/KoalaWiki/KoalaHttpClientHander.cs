using System.Diagnostics;
using System.Net;
using System.Security.Authentication;
using System.Text.Json;
using Newtonsoft.Json;
using Serilog;

namespace KoalaWiki;

public sealed class KoalaHttpClientHandler : HttpClientHandler
{
    public KoalaHttpClientHandler()
    {
        // Completely disable SSL certificate validation for all requests
        ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true;
        
        // Disable cookies and JWT token handling
        UseCookies = false;
        AllowAutoRedirect = true;
        AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;
        
        // Additional settings to bypass SSL/TLS issues
        SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13;
        CheckCertificateRevocationList = false;
        MaxConnectionsPerServer = 100;
        
        // Set a long timeout for long-running operations
        // HttpClientHandler doesn't have a Timeout property, it's on HttpClient
    }
    
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Add API key as authorization header for OpenAI API calls
            if (request.RequestUri?.Host.Contains("text-synai.ngrok.dev") == true && 
                !request.Headers.Contains("Authorization") && 
                OpenAIOptions.ChatApiKey != null)
            {
                request.Headers.Add("Authorization", $"Bearer {OpenAIOptions.ChatApiKey}");
            }
            
            // Force HTTP instead of HTTPS to bypass SSL issues
            if (request.RequestUri != null && request.RequestUri.Scheme == "https")
            {
                var uriBuilder = new UriBuilder(request.RequestUri)
                {
                    Scheme = "http",
                    Port = request.RequestUri.IsDefaultPort ? 80 : request.RequestUri.Port
                };
                
                request.RequestUri = uriBuilder.Uri;
            }
            
            Log.Logger.Information("HTTP {Method} {Uri}", request.Method, request.RequestUri);
            
            // Process request content if it exists
            if (request.Content != null)
            {
                string content = await request.Content.ReadAsStringAsync(cancellationToken);
                if (!string.IsNullOrEmpty(content))
                {
                    try
                    {
                        var json = JsonConvert.DeserializeObject<dynamic>(content);
                        
                        // Add max_token from max_completion_tokens
                        if (json != null && json.max_completion_tokens != null)
                        {
                            var maxToken = json.max_completion_tokens;
                            if (maxToken != null)
                            {
                                json.max_tokens = maxToken;
                                json.max_completion_tokens = null;
                            }
                            
                            var model = $"{json.model}";
                            
                            if (model.StartsWith("qwen3", StringComparison.CurrentCultureIgnoreCase))
                            {
                                // 关闭推理模式
                                json.enable_thinking = false;
                            }
                            
                            // Rewrite request body
                            request.Content = new StringContent(
                                JsonConvert.SerializeObject(json),
                                System.Text.Encoding.UTF8, 
                                "application/json"
                            );
                        }
                        else if (json != null && json.model != null)
                        {
                            var model = $"{json.model}";
                            
                            if (model.StartsWith("qwen3", StringComparison.CurrentCultureIgnoreCase))
                            {
                                // 关闭推理模式
                                json.enable_thinking = false;
                                
                                // Rewrite request body
                                request.Content = new StringContent(
                                    JsonConvert.SerializeObject(json),
                                    System.Text.Encoding.UTF8, 
                                    "application/json"
                                );
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Log.Logger.Warning("Failed to process request content: {Error}", ex.Message);
                        // Continue with the original content if parsing fails
                    }
                }
            }
            
            // Start timing
            var stopwatch = Stopwatch.StartNew();
            
            // Send request with retry logic
            HttpResponseMessage response = null;
            int maxRetries = 3;
            int currentRetry = 0;
            
            while (currentRetry < maxRetries)
            {
                try
                {
                    // Send request
                    response = await base.SendAsync(request, cancellationToken).ConfigureAwait(false);
                    break; // Success, exit the retry loop
                }
                catch (Exception ex) when (ex is HttpRequestException || 
                                          ex is IOException || 
                                          ex.InnerException is IOException ||
                                          ex.Message.Contains("SSL") ||
                                          ex.Message.Contains("TLS"))
                {
                    currentRetry++;
                    if (currentRetry >= maxRetries)
                    {
                        // If we've exhausted retries, rethrow the exception
                        throw;
                    }
                    
                    Log.Logger.Warning("HTTP request failed (attempt {Attempt}/{MaxRetries}): {Error}. Retrying...", 
                        currentRetry, maxRetries, ex.Message);
                    
                    // Wait before retrying (exponential backoff)
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, currentRetry)), cancellationToken);
                }
            }
            
            // Stop timing
            stopwatch.Stop();
            
            // If response has an error, output error information
            if (response != null && !response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                Log.Logger.Error(
                    "HTTP {Method} {Uri} => {StatusCode} in {ElapsedMilliseconds}ms, Error: {Error}",
                    request.Method,
                    request.RequestUri,
                    (int)response.StatusCode,
                    stopwatch.ElapsedMilliseconds,
                    errorContent
                );
                return response;
            }
            
            // Log success
            if (response != null)
            {
                Log.Logger.Information(
                    "HTTP {Method} {Uri} => {StatusCode} in {ElapsedMilliseconds}ms",
                    request.Method,
                    request.RequestUri,
                    (int)response.StatusCode,
                    stopwatch.ElapsedMilliseconds
                );
            }
            
            return response;
        }
        catch (Exception ex)
        {
            Log.Logger.Error("Unhandled exception in HTTP handler: {Error}", ex.ToString());
            throw;
        }
    }
}
