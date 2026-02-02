# Keiyaku

**Leave management for small teams. Self-hosted. Simple.**

---

## What This Is

Keiyaku is a web app for tracking employee leave. Your team logs in, requests time off, managers approve it. That's it.

**Current Features:**
- Request leave (annual, sick, etc.)
- Managers approve/decline requests
- See your leave balance
- Team calendar (who's out when)
- Works on phone and desktop

**Coming Soon:**
- Timesheets for contractors
- Invoice generation
- Document storage

---

## What You Need

- A server (Hetzner VPS ~€5/month)
- Domain name (optional but recommended)
- 30 minutes to set it up

---

## Quick Deploy (Hetzner VPS)

### 1. Get a Server

**Hetzner Cloud:**
1. Sign up at [hetzner.com/cloud](https://www.hetzner.com/cloud)
2. Create a project
3. Add server:
   - **Location:** Closest to you
   - **Image:** Ubuntu 24.04
   - **Type:** CX11 (1 vCPU, 2GB RAM) - €4.51/month
   - **Volume:** 20GB (included)
4. Add your SSH key
5. Create

### 2. Connect & Install

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Bun (for running the app)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Create app directory
mkdir -p /opt/keiyaku
cd /opt/keiyaku

# Clone the repo
git clone https://github.com/yourusername/keiyaku.git .

# Create environment file
cat > .env << 'EOF'
DATABASE_URL=postgresql://keiyaku:your-password@localhost:5432/keiyaku
BETTER_AUTH_SECRET=your-random-secret-here
BETTER_AUTH_URL=http://localhost:3000
ENCRYPTION_KEY=your-32-char-encryption-key
NODE_ENV=production
EOF

# Start PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_USER=keiyaku \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DB=keiyaku \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# Install dependencies
bun install

# Run database setup
bun run db:migrate
bun run db:seed

# Build for production
bun run build
```

### 3. Run It

**Option A: Simple (with PM2)**

```bash
# Install PM2
npm install -g pm2

# Start the app
pm2 start bun --name "keiyaku" -- run start

# Save PM2 config
pm2 save
pm2 startup
```

**Option B: With Docker Compose**

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://keiyaku:your-password@postgres:5432/keiyaku
      - BETTER_AUTH_SECRET=your-secret
      - NODE_ENV=production
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=keiyaku
      - POSTGRES_PASSWORD=your-password
      - POSTGRES_DB=keiyaku
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Run
docker-compose up -d
```

### 4. Add Domain (Optional)

```bash
# Install Caddy (easiest option)
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy

# Create Caddyfile
cat > /etc/caddy/Caddyfile << 'EOF'
your-domain.com {
    reverse_proxy localhost:3000
}
EOF

# Restart Caddy
systemctl restart caddy
```

### 5. First Login

1. Go to `http://your-server-ip:3000` (or your domain)
2. Login with:
   - Email: `admin@keiyaku.local`
   - Password: `admin123`
3. **Change the password immediately**
4. Add your team in Settings → People

---

## Data Security

**What we do:**
- Passwords hashed with bcrypt
- Sessions in HTTP-only cookies
- Database encrypted at rest (if you enable it)
- HTTPS when you add a domain
- No data leaves your server

**What you should do:**
- Use strong passwords
- Enable HTTPS (see step 4)
- Back up your database regularly
- Keep your server updated

**Compliance:**
- GDPR-ready (you control all data)
- Data stays in your chosen region
- Can be deleted anytime

---

## Backup Your Data

```bash
# Backup database
docker exec postgres pg_dump -U keiyaku keiyaku > backup-$(date +%Y%m%d).sql

# Or automated daily backup
crontab -e
# Add: 0 2 * * * docker exec postgres pg_dump -U keiyaku keiyaku > /opt/backups/keiyaku-$(date +\%Y\%m\%d).sql
```

---

## Update to New Version

```bash
cd /opt/keiyaku
git pull
bun install
bun run db:migrate
bun run build
pm2 restart keiyaku
```

---

## Need Help?

- **Docs:** See `docs/deepwiki/` for detailed technical docs
- **Issues:** [GitHub Issues](https://github.com/yourusername/keiyaku/issues)
- **Discord:** [Join our server](https://discord.gg/keiyaku)

---

**Total monthly cost: ~€5** (Hetzner CX11)

*Keiyaku — Japanese for "contract". Because employment is a two-way agreement.*
