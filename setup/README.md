# Dev - WSL

1. Install WSL
2. Install Docker (choose for WSL)
3. Launch WSL
4. Create /usr/src/RiggedBot and grant access.  Then copy git folder there.
```bash
sudo mkdir /usr/src/RiggedBot
sudo chown -R $(whoami):$(whoami) /usr/src/RiggedBot
```
5. Setup VS Code of WSL remote development.
4. Follow setup instructions in Linux, but don't set up git pull
5. IP for pgAdmin on my machine is http://172.19.95.204:8080

# Linux setup
```bash
# install nodemon
npm install -g nodemon

# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install the Docker packages
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify that the installation is successful by running the hello-world image:
sudo docker run hello-world

# Set up docker compose
mkdir /usr/src/RiggedBot
# copy docker-compose.yml to the server at /srv/docker (edit passwords)
cd /usr/src/RiggedBot/docker
# run docker compose
sudo docker compose up --detach --wait
docker compose ps
# view the logs
docker logs -f docker-discord-app-1
```
Set up gh via: https://github.com/cli/cli/blob/trunk/docs/install_linux.md#debian
Then clone the repo
``` bash
cd /usr/src
gh repo clone lanybaggins/RiggedBot
```

# Database

1. For production, connect over SSH tunnel
``` powershell
& ssh -i "$env:documents\Source\Oracle Keys\ssh-key-2025-08-13.key" -L 8081:localhost:8080 ubuntu@my.ip.add.ress
```
TIP: Add that tunnel to SecureCRT for easier use in the future
2. Go to pgAdmin in your browser.
  Dev: http://172.19.95.204:8080 (use ifconfig to determine WSL IP)
  Production: http://localhost:8081
3. Log into pgAdmin
4. Add the server.  Register -> Server.  Add a name.  Connection host name is "db".
5. Create a new database named "riggedbot".


