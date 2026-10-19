# Connect AWS Lightsail to GitHub Actions for Auto-Deploy

This guide walks you through connecting your Lightsail instance to GitHub Actions so that every push to `main` (that touches `crm-backend/`) triggers an automatic deployment.

---

## Quick setup: Deploy key + GitHub Secrets + EC2 (from scratch)

Use this if you **don’t have a deploy key yet** and want one.

### Step 1: Create a deploy key on your computer

On your **local machine** (Windows PowerShell, Git Bash, or WSL):

**Windows PowerShell** (empty passphrase is tricky; use one of these):

```powershell
# Option A: No -N flag; when prompted "Enter passphrase" and "Same passphrase again", press Enter both times
ssh-keygen -t ed25519 -C "github-actions-lightsail-deploy" -f lightsail_deploy_key
```

```powershell
# Option B: Explicit empty passphrase (PowerShell)
ssh-keygen -t ed25519 -C "github-actions-lightsail-deploy" -f lightsail_deploy_key -N '""'
```

**Git Bash / WSL / Linux / macOS:**

```bash
ssh-keygen -t ed25519 -C "github-actions-lightsail-deploy" -f lightsail_deploy_key -N ""
```

You’ll get two files:

- **`lightsail_deploy_key`** → private key (keep this secret; you’ll put it in GitHub Secrets).
- **`lightsail_deploy_key.pub`** → public key (you’ll add this on the EC2 server).

### Step 2: On the EC2 / Lightsail server

SSH in with your **existing** key (the one you use today, e.g. Lightsail default):

```bash
ssh -i /path/to/your-current-key.pem ec2-user@<PUBLIC_IP>
```

Then on the server run these **one by one**:

```bash
# 1. Create app directory
mkdir -p /home/ec2-user/landing/crm-backend

# 2. Ensure .ssh exists and add the deploy public key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

In `nano`, **go to the end of the file**, paste the **entire content** of `lightsail_deploy_key.pub` (one line, starts with `ssh-ed25519 ...`), save (Ctrl+O, Enter) and exit (Ctrl+X).

```bash
# 3. Optional: fix permissions
chmod 600 ~/.ssh/authorized_keys
```

Then install Node (if not already), PM2, and put your `.env` in the app folder:

```bash
# 4. Node (Amazon Linux – one of these)
sudo yum install -y nodejs
# OR with nvm:
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# source ~/.bashrc && nvm install 20

# 5. PM2
sudo npm install -g pm2

# 6. Create .env in app folder (edit with your real values)
nano /home/ec2-user/landing/crm-backend/.env
```

Paste your production env vars, save and exit. Then log out from the server.

### Step 3: Add GitHub Secrets

1. On GitHub: open your **repository** → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add these **three** secrets:

| Secret name | What to put there |
|-------------|-------------------|
| **LIGHTSAIL_HOST** | The **public IP** of your instance (e.g. `3.110.45.123`). Find it in Lightsail console on the instance page. |
| **LIGHTSAIL_USER** | Exactly: `ec2-user` |
| **LIGHTSAIL_SSH_PRIVATE_KEY** | Open the file **`lightsail_deploy_key`** (the **private** key, no `.pub`) in a text editor. Copy **everything** from `-----BEGIN OPENSSH PRIVATE KEY-----` through `-----END OPENSSH PRIVATE KEY-----` and paste as the secret value. No extra spaces at start/end. |

After this, trigger a deploy (push to `main` or run the workflow from the Actions tab). The first run will sync code, run `npm install`, and start/restart `pm2` with name `crm-backend`.

---

## 1. Prerequisites on the Lightsail Instance

### 1.1 Create the app directory

SSH into your Lightsail instance and create the `landing/crm-backend` folder:

```bash
ssh -i /path/to/your-key.pem ec2-user@<YOUR_LIGHTSAIL_IP>
mkdir -p /home/ec2-user/landing/crm-backend
```

The workflow expects the app at **`/home/ec2-user/landing/crm-backend`** (user `ec2-user`, then `landing`, then `crm-backend`).

### 1.2 Install Node.js (if not already)

**Amazon Linux (ec2-user):**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

Or use the Amazon Linux Node.js package if available:

```bash
sudo yum install -y nodejs
```

### 1.3 Install PM2 (recommended for keeping the app running)

```bash
sudo npm install -g pm2
```

### 1.4 Create `.env` on the server

Copy your production `.env` to the server (only once, or when you change config). The workflow does **not** overwrite `.env`:

```bash
# On your machine, from the repo root:
scp -i /path/to/your-key.pem crm-backend/.env ec2-user@<LIGHTSAIL_IP>:/home/ec2-user/landing/crm-backend/.env
```

Or create it manually on the server with your DB and other production values.

---

## 2. Get the SSH Key for GitHub Actions

GitHub Actions will SSH into Lightsail using a **private key**. You can use the **Lightsail default key** or a **dedicated deploy key**.

### Option A: Use the Lightsail default key pair

1. In **AWS Lightsail** → **Account** → **SSH keys** (or the key you chose when creating the instance).
2. **Download** the default private key (e.g. `LightsailDefaultKey-*.pem`).
3. Open the `.pem` file in a text editor and copy the **entire** contents (including `-----BEGIN ...` and `-----END ...`).
4. This is the value you will put in the `LIGHTSAIL_SSH_PRIVATE_KEY` secret below.

### Option B: Use a dedicated deploy key (recommended)

1. On your **local machine** (or a safe place), generate a new key pair:

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-lightsail" -f lightsail_deploy_key -N ""
   # On Windows PowerShell use: -N '""'  or omit -N and press Enter when asked for passphrase
   ```

2. Add the **public** key to Lightsail:
   - Lightsail console → **Account** → **SSH keys** → **Create new key** / **Import**, or
   - On the **instance**: append `lightsail_deploy_key.pub` to `~/.ssh/authorized_keys` on the server.

3. Copy the **private** key (`lightsail_deploy_key`) content. This will be `LIGHTSAIL_SSH_PRIVATE_KEY`.

---

## 3. Add GitHub Secrets

1. Open your repo on **GitHub** → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add:

| Secret name                   | Description                          | Example / format                    |
|------------------------------|--------------------------------------|------------------------------------|
| `LIGHTSAIL_HOST`             | Public IP or hostname of the instance | `3.110.xx.xx` or `your-instance.region.cs.amazonlightsail.com` |
| `LIGHTSAIL_USER`             | SSH username on the instance        | `ec2-user` |
| `LIGHTSAIL_SSH_PRIVATE_KEY`  | Full private key (PEM or OpenSSH)   | Entire contents of the `.pem` or private key file |
| `VITE_API_BASE_URL` *(opt)*  | Backend API URL for Vite build      | `http://3.110.xx.xx:8000` or `https://api.yourdomain.com` |

- **LIGHTSAIL_HOST**: In Lightsail, open your instance and copy the **Public IP** (or use the instance DNS name).
- **LIGHTSAIL_USER**: The user you use with `ssh user@host` (use `ec2-user` for your setup).
- **LIGHTSAIL_SSH_PRIVATE_KEY**: Paste the full private key; do **not** add extra spaces or newlines at the start/end.
- **VITE_API_BASE_URL**: (Optional) In GitHub **Settings** → **Secrets and variables** → **Actions** (Secret or Variable). Vite bakes this into the frontend build. Defaults to `http://localhost:8000` if not set.

---

## 4. Nginx Setup for Frontend

The workflow builds the frontend on the GitHub runner and uploads the compiled `dist/` directory to:
```bash
/home/ec2-user/landing/crm-frontend/dist
```

To configure Nginx on Lightsail:

1. Install and enable Nginx (if not already):
   ```bash
   sudo yum install -y nginx
   sudo systemctl enable nginx
   ```

2. Configure Nginx:
   Edit or create `/etc/nginx/conf.d/crm.conf`:
   ```nginx
   server {
       listen 80;
       server_name _;

       # Frontend SPA static build
       location / {
           root /home/ec2-user/landing/crm-frontend/dist;
           index index.html index.htm;
           try_files $uri $uri/ /index.html;
       }

       # Backend API proxy
       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

3. Test and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 5. First Deploy and Verifying

1. Push a change under `crm-backend/` to `main` (or run the workflow manually: **Actions** → **Deploy CRM Backend to Lightsail** → **Run workflow**).
2. In **Actions**, open the latest run and confirm all steps succeed.
3. On the server, check that the app is running:

   ```bash
   pm2 list
   pm2 logs crm-backend
   ```

   Or, if you use systemd:

   ```bash
   sudo systemctl status crm-backend
   ```

---

## 6. Security Checklist

- [ ] Use a **dedicated deploy key** (Option B) and limit it to this instance.
- [ ] Do **not** commit `.env` or any real secrets; keep them only in GitHub Secrets and on the server.
- [ ] Restrict **Lightsail firewall** (in the instance’s “Networking” tab) to only the ports you need (e.g. 22 for SSH, 80/443 for the app).
- [ ] Prefer **SSH key** login only; disable password auth on the instance if possible.

---

## Summary

| Step | What to do |
|------|------------|
| 1 | On Lightsail: create `/home/ec2-user/landing/crm-backend`, install Node + PM2, add `.env`. |
| 2 | Get the SSH private key (Lightsail default key or a new deploy key). |
| 3 | In GitHub: add secrets `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `LIGHTSAIL_SSH_PRIVATE_KEY`. |
| 4 | Push to `main` (with changes under `crm-backend/`) or run the workflow manually. |

After this, every qualifying push to `main` will sync the `crm-backend` code to Lightsail, run `npm install`, and restart the app via PM2 (or systemd if you configure it).
