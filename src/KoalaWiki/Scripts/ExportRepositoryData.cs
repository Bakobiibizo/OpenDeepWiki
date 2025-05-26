using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using KoalaWiki.Core.DataAccess;
using KoalaWiki.Domains;
using KoalaWiki.Entities;
using KoalaWiki.Entities.DocumentFile;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace KoalaWiki.Scripts
{
    public class ExportRepositoryData
    {
        public static async Task ExportRepositoryDataToJson(IServiceProvider serviceProvider, string repoAddress, string outputPath)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<IKoalaWikiContext>();

                // Find the repository by address
                var repository = await dbContext.Warehouses
                    .AsNoTracking()
                    .FirstOrDefaultAsync(w => w.Address == repoAddress);

                if (repository == null)
                {
                    Console.WriteLine($"Repository with address {repoAddress} not found.");
                    return;
                }

                // Get document catalogs for this repository
                var documentCatalogs = await dbContext.DocumentCatalogs
                    .AsNoTracking()
                    .Where(dc => dc.WarehouseId == repository.Id && !dc.IsDeleted)
                    .ToListAsync();

                // Get documents for this repository
                var documents = await dbContext.Documents
                    .AsNoTracking()
                    .Where(di => di.WarehouseId == repository.Id)
                    .ToListAsync();

                // Get document file items for this repository
                var fileItems = await dbContext.DocumentFileItems
                    .AsNoTracking()
                    .Where(fi => documentCatalogs.Select(c => c.Id).Contains(fi.DocumentCatalogId))
                    .ToListAsync();

                // Create a comprehensive data object
                var repositoryData = new
                {
                    Repository = repository,
                    DocumentCatalogs = documentCatalogs,
                    Documents = documents,
                    FileItems = fileItems,
                    // Include any other related data you want to examine
                };

                // Serialize to JSON with indentation for readability
                var options = new JsonSerializerOptions
                {
                    WriteIndented = true,
                    ReferenceHandler = ReferenceHandler.Preserve,
                    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
                };

                string json = JsonSerializer.Serialize(repositoryData, options);
                
                // Ensure directory exists
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                
                // Write to file
                await File.WriteAllTextAsync(outputPath, json);
                
                Console.WriteLine($"Repository data exported to {outputPath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error exporting repository data: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
            }
        }
    }
}
