### STAGE 1: Build DotNet Core ###
FROM mcr.microsoft.com/dotnet/sdk:latest AS build-env

ARG APP_VER
ARG NET_VER

COPY src /app/src
COPY TicTacToe.sln /app/TicTacToe.sln
#COPY NuGet.config /app/NuGet.config
WORKDIR /app

RUN dotnet restore

WORKDIR /app/src/TicTacToe

RUN echo ${APP_VER}
RUN dotnet publish -o /publish -c Release -r linux-x64 --no-self-contained /p:Version=$APP_VER /p:InformationalVersion=$APP_VER

### STAGE 2: Runtime ###
FROM mcr.microsoft.com/dotnet/aspnet:latest

# Set environment variables

WORKDIR /app
COPY --from=build-env /publish .

EXPOSE 8080 9080 11111

ENTRYPOINT ["dotnet", "TicTacToe.dll"]