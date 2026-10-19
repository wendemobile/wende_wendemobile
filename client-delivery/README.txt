================================================================================
                         POS SYSTEM - INSTALLATION GUIDE
                      (Supports OFFLINE LAN + ONLINE Tailscale)
================================================================================

REQUIREMENTS:
- Windows 10/11 or macOS or Linux
- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- 4GB RAM minimum
- 2GB free disk space
- For ONLINE mode: Tailscale installed (https://tailscale.com/download)

================================================================================
                         NETWORK SETUP OPTIONS
================================================================================

This system supports TWO modes:

MODE 1: OFFLINE/LAN MODE (No Internet Required)
   - Server and client computers connected via LAN cable or WiFi router
   - Uses static IP addresses
   - Access via: http://192.168.1.100:3000
   - Camera/barcode scanning will NOT work (requires HTTPS)

MODE 2: ONLINE MODE (Tailscale HTTPS)
   - Access from anywhere via internet
   - Uses Tailscale for secure HTTPS
   - Access via: https://machine.tailxxxxx.ts.net
   - Camera/barcode scanning WORKS (HTTPS enabled)

================================================================================
                    MODE 1: OFFLINE/LAN SETUP
================================================================================

STEP 1: Configure Server Computer Static IP
   
   On the SERVER computer (where Docker runs):
   
   Windows:
   1. Open Control Panel > Network and Sharing Center
   2. Click on your network connection (Ethernet)
   3. Click Properties > Internet Protocol Version 4 (TCP/IPv4)
   4. Select "Use the following IP address"
   5. Enter:
      - IP address: 192.168.1.100
      - Subnet mask: 255.255.255.0
      - Default gateway: 192.168.1.1 (or leave empty for direct cable)
   6. Click OK

STEP 2: Configure Client Computer Static IP
   
   On each CLIENT computer:
   
   Windows:
   1. Open Control Panel > Network and Sharing Center
   2. Click on your network connection (Ethernet)
   3. Click Properties > Internet Protocol Version 4 (TCP/IPv4)
   4. Select "Use the following IP address"
   5. Enter:
      - IP address: 192.168.1.101 (use 102, 103, etc. for more clients)
      - Subnet mask: 255.255.255.0
      - Default gateway: 192.168.1.1 (or leave empty for direct cable)
   6. Click OK

STEP 3: Edit .env File (on Server)
   
   Open .env file in Notepad and set:
   
   SERVER_LAN_IP=192.168.1.100
   NEXTAUTH_URL=http://192.168.1.100:3000

STEP 4: Start the System (on Server)
   
   Open Command Prompt and run:
   
   cd path\to\client-delivery
   docker load -i pos-system.tar
   docker compose up -d

STEP 5: Access from Client Computers
   
   On any client computer, open browser and go to:
   
   http://192.168.1.100:3000
   
   Default Login:
   - Username: admin
   - Password: admin123

================================================================================
                    MODE 2: ONLINE/TAILSCALE SETUP
================================================================================

STEP 1: Install Tailscale
   - Download from: https://tailscale.com/download
   - Install and login with your account
   - Note your machine name (e.g., tomg.tail572bbf.ts.net)

STEP 2: Edit .env File
   
   Open .env file and set:
   
   NEXTAUTH_URL=https://tomg.tail572bbf.ts.net
   TAILSCALE_DOMAIN=tomg.tail572bbf.ts.net

STEP 3: Start the System
   
   docker compose up -d

STEP 4: Enable HTTPS with Tailscale
   
   tailscale serve --bg http://localhost:3000

STEP 5: Access the System
   
   https://tomg.tail572bbf.ts.net

================================================================================
                    RECOMMENDED IP ADDRESSES
================================================================================

For a typical setup with 1 server + multiple clients:

SERVER COMPUTER (runs Docker):
   IP Address: 192.168.1.100
   Subnet Mask: 255.255.255.0
   Gateway: 192.168.1.1 (or empty)

CLIENT COMPUTER 1 (Cashier):
   IP Address: 192.168.1.101
   Subnet Mask: 255.255.255.0
   Gateway: 192.168.1.1 (or empty)

CLIENT COMPUTER 2 (Salesman):
   IP Address: 192.168.1.102
   Subnet Mask: 255.255.255.0
   Gateway: 192.168.1.1 (or empty)

CLIENT COMPUTER 3 (Manager):
   IP Address: 192.168.1.103
   Subnet Mask: 255.255.255.0
   Gateway: 192.168.1.1 (or empty)

================================================================================
                         DAILY OPERATIONS
================================================================================

START THE SYSTEM (Server):
   docker compose up -d

STOP THE SYSTEM (Server):
   docker compose down

VIEW LOGS:
   docker compose logs -f

RESTART:
   docker compose restart

================================================================================
                         SWITCHING MODES
================================================================================

To switch from LAN to Tailscale mode (or vice versa):

1. Stop the system: docker compose down
2. Edit .env file with new NEXTAUTH_URL
3. Start the system: docker compose up -d
4. For Tailscale: Run: tailscale serve --bg http://localhost:3000

================================================================================
                              BACKUP DATA
================================================================================

BACKUP DATABASE:
   docker exec pos-db pg_dump -U pos_user pos_db > backup.sql

RESTORE DATABASE:
   docker exec -i pos-db psql -U pos_user pos_db < backup.sql

================================================================================
                              TROUBLESHOOTING
================================================================================

PROBLEM: "Cannot connect from client computer"
SOLUTION: 
   1. Check both computers have correct static IPs
   2. Ping server from client: ping 192.168.1.100
   3. Check Windows Firewall allows port 3000
   4. Disable firewall temporarily to test

PROBLEM: "Camera not working"
SOLUTION: 
   Camera requires HTTPS. Use Tailscale mode for camera/barcode scanning.
   LAN mode (HTTP) does not support camera access.

PROBLEM: "Login not working"
SOLUTION: 
   1. Check NEXTAUTH_URL in .env matches how you access the site
   2. Restart: docker compose down && docker compose up -d
   3. Clear browser cache

PROBLEM: "Connection refused"
SOLUTION:
   1. Make sure Docker is running
   2. Check containers: docker ps
   3. Check logs: docker compose logs app

================================================================================
                         WINDOWS FIREWALL
================================================================================

If clients cannot connect, allow port 3000 in Windows Firewall:

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" > "New Rule"
4. Select "Port" > Next
5. Select "TCP" and enter "3000" > Next
6. Select "Allow the connection" > Next
7. Check all profiles > Next
8. Name it "POS System" > Finish

================================================================================
                                 SUPPORT
================================================================================

For technical support, contact your system administrator.

================================================================================
