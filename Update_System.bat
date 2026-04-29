@echo off
title Updating Visual Arts System
echo ==================================================
echo Building the new frontend interface...
echo ==================================================
call npm run build
echo.
echo ==================================================
echo Copying the updated interface to PortableApp...
echo ==================================================
rmdir /s /q PortableApp\dist
xcopy /E /I /Y dist PortableApp\dist
echo.
echo Update complete! You can now run Start_System.bat inside PortableApp.
pause
