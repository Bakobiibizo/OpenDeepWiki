#!/bin/sh
set -e

# Set the .NET runtime configuration
export DOTNET_USE_POLLING_FILE_WATCHER=1
export DOTNET_HOST_PATH=/usr/bin/dotnet

# Set the COMPlus_EnableDiagnostics environment variable for .NET Core
export COMPlus_EnableDiagnostics=0

# Set the TMP and TEMP environment variables to a path that's less likely to hit long path issues
export TMP=/tmp
export TEMP=/tmp

echo "Starting KoalaWiki..."

exec dotnet KoalaWiki.dll "$@"