#!/bin/bash

# Script to export repository data from the database using SQLite
# Usage: ./export-repo-data.sh <repository_url>

if [ -z "$1" ]; then
  echo "Error: Repository URL is required"
  echo "Usage: ./export-repo-data.sh <repository_url>"
  exit 1
fi

REPO_URL="$1"
OUTPUT_FILE="repo-data-$(date +%Y%m%d%H%M%S).json"

# Find the SQLite database file
DB_PATH=$(find ./data -name "*.db" | head -n 1)

if [ -z "$DB_PATH" ]; then
  echo "Error: No SQLite database file found in the data directory"
  echo "Available files in data directory:"
  ls -la data/
  exit 1
fi

echo "Exporting data for repository: $REPO_URL"
echo "Using database: $DB_PATH"
echo "Output will be saved to: $OUTPUT_FILE"

# Create temporary files for our queries
TMP_REPO_INFO=$(mktemp)
TMP_CATALOGS=$(mktemp)
TMP_ITEMS=$(mktemp)
TMP_FILES=$(mktemp)
TMP_OVERVIEWS=$(mktemp)

# Clean up temporary files when script exits
trap "rm -f $TMP_REPO_INFO $TMP_CATALOGS $TMP_ITEMS $TMP_FILES $TMP_OVERVIEWS" EXIT

# Step 1: Find the repository by URL
echo "Finding repository in database..."
REPO_ID=$(sqlite3 "$DB_PATH" "SELECT Id FROM Warehouses WHERE Address = '$REPO_URL';")

if [ -z "$REPO_ID" ]; then
  echo "Error: Repository not found with URL: $REPO_URL"
  echo "Available repositories:"
  sqlite3 "$DB_PATH" "SELECT Id, Address, Name, Status FROM Warehouses LIMIT 10;"
  exit 1
fi

echo "Found repository with ID: $REPO_ID"

# Step 2: Export repository info
echo "Exporting repository information..."
sqlite3 -json "$DB_PATH" "SELECT * FROM Warehouses WHERE Id = '$REPO_ID';" > "$TMP_REPO_INFO"

# Step 3: Export document catalogs (sections and subsections)
echo "Exporting document catalogs..."
sqlite3 -json "$DB_PATH" "SELECT * FROM DocumentCatalogs WHERE WarehouseId = '$REPO_ID' AND IsDeleted = 0;" > "$TMP_CATALOGS"

# Step 4: Export document items (actual content)
echo "Exporting document items..."
sqlite3 -json "$DB_PATH" "SELECT * FROM Documents WHERE WarehouseId = '$REPO_ID';" > "$TMP_ITEMS"

# Step 5: Get catalog IDs for file items query
CATALOG_IDS=$(sqlite3 "$DB_PATH" "SELECT Id FROM DocumentCatalogs WHERE WarehouseId = '$REPO_ID' AND IsDeleted = 0;" | awk '{print "'\''" $0 "'\''" }' | tr '\n' ',' | sed 's/,$//')

# Step 6: Export file items if there are catalogs
if [ ! -z "$CATALOG_IDS" ]; then
  echo "Exporting file items..."
  echo "Catalog IDs: $CATALOG_IDS"
  # Create a temporary SQL file for the complex query
  TMP_SQL=$(mktemp)
  echo "SELECT * FROM DocumentFileItems WHERE DocumentCatalogId IN ($CATALOG_IDS);" > "$TMP_SQL"
  sqlite3 -json "$DB_PATH" < "$TMP_SQL" > "$TMP_FILES"
  rm "$TMP_SQL"
else
  echo "No document catalogs found, skipping file items export"
  echo "[]" > "$TMP_FILES"
fi

# Step 7: Extract document IDs from catalogs and query document overviews
echo "Extracting document overviews..."
DOCUMENT_IDS=$(sqlite3 "$DB_PATH" "SELECT DISTINCT DucumentId FROM DocumentCatalogs WHERE WarehouseId = '$REPO_ID' AND IsDeleted = 0;" | awk '{print "'\''" $0 "'\''" }' | tr '\n' ',' | sed 's/,$//')

if [ ! -z "$DOCUMENT_IDS" ]; then
  echo "Found document IDs: $DOCUMENT_IDS"
  # Create a temporary SQL file for the query
  TMP_SQL=$(mktemp)
  echo "SELECT * FROM DocumentOverviews WHERE DocumentId IN ($DOCUMENT_IDS);" > "$TMP_SQL"
  sqlite3 -json "$DB_PATH" < "$TMP_SQL" > "$TMP_OVERVIEWS"
  rm "$TMP_SQL"
else
  echo "No document IDs found, skipping document overviews export"
  echo "[]" > "$TMP_OVERVIEWS"
fi

# Step 8: Combine all data into a single JSON file
echo "Combining data into final JSON output..."
cat > "$OUTPUT_FILE" << EOF
{
  "repository": $(cat "$TMP_REPO_INFO"),
  "documentCatalogs": $(cat "$TMP_CATALOGS"),
  "documents": $(cat "$TMP_ITEMS"),
  "documentFileItems": $(cat "$TMP_FILES"),
  "documentOverviews": $(cat "$TMP_OVERVIEWS")
}
EOF

echo "Export completed successfully!"
echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "You can examine the data with: cat $OUTPUT_FILE | jq"
