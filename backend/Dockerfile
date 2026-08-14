# Stage 1: Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy nuget config and project file for layer caching
COPY ["nuget.config", "./"]
COPY ["SchoolManagement.Api/SchoolManagement.Api.csproj", "SchoolManagement.Api/"]
RUN dotnet restore "SchoolManagement.Api/SchoolManagement.Api.csproj"

# Copy all source files and publish release
COPY . .
WORKDIR "/src/SchoolManagement.Api"
RUN dotnet publish "SchoolManagement.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Final runtime container
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Configuration for web server ports
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_HTTP_PORTS=8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "SchoolManagement.Api.dll"]
