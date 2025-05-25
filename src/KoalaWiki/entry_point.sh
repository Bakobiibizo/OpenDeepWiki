#!/bin/sh
set -e

# Enable long path support in the container
echo "Enabling long path support..."

# Set the registry key to enable long paths
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f

# Set the .NET runtime to use long paths
export DOTNET_USE_POLLING_FILE_WATCHER=1
export DOTNET_HOST_PATH=/usr/bin/dotnet

# Set the COMPlus_EnableDiagnostics environment variable for .NET Core
export COMPlus_EnableDiagnostics=0

# Set the TMP and TEMP environment variables to a path that's less likely to hit long path issues
export TMP=/tmp
export TEMP=/tmp

echo "Starting KoalaWiki..."

exec dotnet KoalaWiki.dll "$@"