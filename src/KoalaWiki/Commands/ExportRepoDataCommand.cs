using System;
using System.CommandLine;
using System.CommandLine.NamingConventionBinder;
using System.IO;
using System.Threading.Tasks;
using KoalaWiki.Scripts;
using Microsoft.Extensions.DependencyInjection;

namespace KoalaWiki.Commands
{
    public class ExportRepoDataCommand : Command
    {
        private readonly IServiceProvider _serviceProvider;

        public ExportRepoDataCommand(IServiceProvider serviceProvider)
            : base("export-repo-data", "Export repository data to a JSON file for analysis")
        {
            _serviceProvider = serviceProvider;

            // Add required arguments
            AddArgument(new Argument<string>("address", "Repository address (URL)"));
            
            var outputArg = new Argument<string>("output", () => Path.Combine(Environment.CurrentDirectory, "repo-data.json"), "Output file path");
            AddArgument(outputArg);

            // Set the command handler
            this.Handler = CommandHandler.Create<string, string>(HandleCommand);
        }

        private async Task HandleCommand(string address, string output)
        {
            Console.WriteLine($"Exporting repository data for: {address}");
            Console.WriteLine($"Output file: {output}");

            try
            {
                await ExportRepositoryData.ExportRepositoryDataToJson(_serviceProvider, address, output);
                Console.WriteLine("Export completed successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error exporting repository data: {ex.Message}");
            }
        }
    }
}
