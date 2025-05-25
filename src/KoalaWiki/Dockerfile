FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER root
WORKDIR /app

# Install Git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
ARG TARGETARCH
WORKDIR /src
COPY ["src/KoalaWiki/KoalaWiki.csproj", "src/KoalaWiki/"]
COPY ["NuGet.Config", "."]
RUN dotnet restore "src/KoalaWiki/KoalaWiki.csproj" -a $TARGETARCH
COPY . .
WORKDIR "/src/src/KoalaWiki"
RUN dotnet build "./KoalaWiki.csproj" -c $BUILD_CONFIGURATION -a $TARGETARCH -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./KoalaWiki.csproj" -c $BUILD_CONFIGURATION -a $TARGETARCH -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Copy entry point script and make it executable
COPY entry_point.sh /app/entry_point.sh
RUN chmod +x /app/entry_point.sh

# Run the entry point script
ENTRYPOINT ["/app/entry_point.sh"]

 