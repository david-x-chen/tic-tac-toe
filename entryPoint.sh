#!/bin/bash
envsubst < /app/wwwroot/assets/config/config.template.json > /app/wwwroot/assets/config/config.json && dotnet /app/TicTacToe.dll