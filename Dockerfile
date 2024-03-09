### STAGE 1: Build DotNet Core ###
FROM mcr.microsoft.com/dotnet/sdk:8.0-jammy-amd64 AS build-env

ARG APP_VER
ARG NET_VER

RUN apt-get update
RUN apt-get install curl gnupg -y
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install nodejs -y
RUN node -v
RUN npm -v

COPY src /app/src
COPY TicTacToe.sln /app/TicTacToe.sln
#COPY NuGet.config /app/NuGet.config
WORKDIR /app

RUN dotnet restore
RUN dotnet build

WORKDIR /app/src/TicTacToe

RUN echo ${APP_VER}
RUN dotnet publish -o /publish -c Release -r linux-x64 --no-self-contained /p:Version=$APP_VER /p:InformationalVersion=$APP_VER

### STAGE 2: Runtime ###
FROM mcr.microsoft.com/dotnet/aspnet:latest

# Set environment variables

WORKDIR /app
COPY --from=build-env /publish .

EXPOSE 8080 9080 11111-11200 30000-30200

ENTRYPOINT ["dotnet", "TicTacToe.dll"]