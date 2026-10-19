@echo off
echo ================================================================================
echo                    POS SYSTEM - BUILD FOR CLIENT DELIVERY
echo ================================================================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/4] Building Docker image...
echo This may take 5-10 minutes...
echo.
docker build -t pos-system:latest .

if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Saving Docker image to file...
echo This may take a few minutes...
echo.
docker save -o client-delivery/pos-system.tar pos-system:latest

if errorlevel 1 (
    echo.
    echo ERROR: Failed to save image!
    pause
    exit /b 1
)

echo.
echo [3/4] Calculating file size...
for %%A in (client-delivery\pos-system.tar) do set size=%%~zA
set /a sizeMB=%size% / 1048576
echo Image size: %sizeMB% MB

echo.
echo [4/4] Creating delivery package...
echo.

REM Create a zip file if 7zip is available, otherwise just inform user
where 7z >nul 2>&1
if %errorlevel% equ 0 (
    7z a -tzip client-delivery-package.zip client-delivery\*
    echo.
    echo SUCCESS! Package created: client-delivery-package.zip
) else (
    echo.
    echo SUCCESS! Files ready in: client-delivery\
    echo.
    echo To create a ZIP file, manually compress the client-delivery folder.
)

echo.
echo ================================================================================
echo                              DELIVERY CONTENTS
echo ================================================================================
echo.
echo   client-delivery\
echo   ├── docker-compose.yml   (Docker configuration)
echo   ├── .env                 (Settings file)
echo   ├── pos-system.tar       (Application image - %sizeMB% MB)
echo   └── README.txt           (Installation instructions)
echo.
echo ================================================================================
echo                            WHAT TO GIVE CLIENT
echo ================================================================================
echo.
echo   1. Copy the entire "client-delivery" folder to a USB drive
echo   2. Give the USB drive to the client
echo   3. Client follows README.txt instructions
echo.
echo   NOTE: Client does NOT need your source code!
echo         They only get the compiled Docker image.
echo.
echo ================================================================================
pause
