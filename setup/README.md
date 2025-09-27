# Dev - WSL

1. Install WSL
2. Install Docker (choose for WSL)
3. Launch WSL
4. Follow setup instructions in Linux.
5. Setup VS Code for WSL remote development.

# Linux setup

```bash
#Set up gh via: https://github.com/cli/cli/blob/trunk/docs/install_linux.md#debian
(type -p wget >/dev/null || (sudo apt update && sudo apt install wget -y)) \
  && sudo mkdir -p -m 755 /etc/apt/keyrings \
  && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  && cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && sudo mkdir -p -m 755 /etc/apt/sources.list.d \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && sudo apt update \
  && sudo apt install gh -y

# Log in to gh.  Choose Github.com; HTTPS; No, do not use GitHub credentials; Paste an authentication token; paste auth token
gh auth login
# Set git to use gh for authentication
gh auth setup-git
# Clone the repo
cd /usr/src
gh repo clone lanybaggins/RiggedBot

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
cd /usr/src/RiggedBot/docker
nano .env
# Paste the following.  Change the passwords.  Set prod to dev if running in development.
: '
COMPOSE_PROFILES=prod
COMPOSE_PROJECT_NAME=riggedbot
POSTGRES_PASSWORD=mysecretpassword
PGADMIN_DEFAULT_PASSWORD=mysecretpassword
'

# Set up Discord API key
nano /usr/src/RiggedBot/discord/.env
: '
TOKEN = MYKEYHERE
'

# run docker compose
cd /usr/src/RiggedBot/docker
sudo docker compose up --detach --wait

# view running containers
docker compose ps

# view the logs
cd /usr/src/RiggedBot/docker
docker logs -f riggedbot-riggedbotapp-1

```

# Database

1. Add a port forwarding setting in SecureCRT connection for connecting to the remote db.  Local port 5433; remote port 5432.
2. Go to the dev pgAdmin in your browser. http://172.19.95.204:8081 (use ifconfig to determine WSL IP)
3. Log into pgAdmin
4. Add the dev server.  Register -> Server.
* Name:              riggedbotdev
* Host name/address: db
* Port:              5432
* Username:          admin
* Password:          password saved in docker/.env
5. Add the prod server.  Register -> Server.
* Name:              riggedbot
* Host name/address: localhost
* Port:              5453
* Username:          admin
* Password:          password saved in docker/.env
5. Create a new database named "riggedbot".


