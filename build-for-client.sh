#!/bin/bash

echo "================================================================================"
echo "                   POS SYSTEM - BUILD FOR CLIENT DELIVERY"
echo "================================================================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "[1/4] Building Docker image..."
echo "This may take 5-10 minutes..."
echo ""
docker build -t pos-system:latest .

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Build failed!"
    exit 1
fi

echo ""
echo "[2/4] Saving Docker image to file..."
echo "This may take a few minutes..."
echo ""
docker save -o client-delivery/pos-system.tar pos-system:latest

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to save image!"
    exit 1
fi

echo ""
echo "[3/4] Calculating file size..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    SIZE=$(stat -f%z client-delivery/pos-system.tar)
else
    SIZE=$(stat -c%s client-delivery/pos-system.tar)
fi
SIZE_MB=$((SIZE / 1048576))
echo "Image size: ${SIZE_MB} MB"

echo ""
echo "[4/4] Creating delivery package..."
echo ""

# Create zip if available
if command -v zip &> /dev/null; then
    cd client-delivery
    zip -r ../client-delivery-package.zip *
    cd ..
    echo ""
    echo "SUCCESS! Package created: client-delivery-package.zip"
else
    echo ""
    echo "SUCCESS! Files ready in: client-delivery/"
    echo ""
    echo "To create a ZIP file: zip -r client-delivery-package.zip client-delivery/*"
fi

echo ""
echo "================================================================================"
echo "                             DELIVERY CONTENTS"
echo "================================================================================"
echo ""
echo "  client-delivery/"
echo "  ├── docker-compose.yml   (Docker configuration)"
echo "  ├── .env                 (Settings file)"
echo "  ├── pos-system.tar       (Application image - ${SIZE_MB} MB)"
echo "  └── README.txt           (Installation instructions)"
echo ""
echo "================================================================================"
echo "                           WHAT TO GIVE CLIENT"
echo "================================================================================"
echo ""
echo "  1. Copy the entire 'client-delivery' folder to a USB drive"
echo "  2. Give the USB drive to the client"
echo "  3. Client follows README.txt instructions"
echo ""
echo "  NOTE: Client does NOT need your source code!"
echo "        They only get the compiled Docker image."
echo ""
echo "================================================================================"
