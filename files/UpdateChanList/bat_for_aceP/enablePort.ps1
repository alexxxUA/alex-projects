(Get-Content C:\Users\$env:username\AppData\Roaming\ACEStream\player\lua\http\.hosts) | ForEach-Object { $_ -replace "#192.168", "192.168" } | Set-Content C:\Users\$env:username\AppData\Roaming\ACEStream\player\lua\http\.hosts