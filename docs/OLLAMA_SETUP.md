# Ollama Setup Guide

This guide shows how to replace Claude API with self-hosted Ollama to eliminate AI inference costs.

## Overview

**Before:** GitHub Actions → Claude API ($$$) → Process news → Create issues  
**After:** GitHub Actions → Your Home Server (Ollama, free) → Process news → Create issues

**Cost savings:** ~$30-100/month → $0 (just electricity)

---

## Part 1: Home Server Setup

### 1.1 Install Ollama

On your home server (Linux/macOS):

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verify installation
ollama --version
```

For other systems, see: https://ollama.com/download

### 1.2 Pull a Model

Choose based on your hardware:

```bash
# Recommended: Good balance of speed/quality (4GB RAM)
ollama pull llama3.1:8b

# Better quality, slower (8GB RAM)
ollama pull qwen2.5:14b

# Fastest, lower quality (2GB RAM)
ollama pull llama3.2:3b
```

Test the model:

```bash
ollama run llama3.1:8b "Summarize this: Reuters reports Iran launched missiles at Israel today."
```

### 1.3 Configure Ollama for Remote Access

By default, Ollama only listens on localhost. Make it accessible:

**Option A: Systemd (Linux)**

```bash
# Edit service file
sudo systemctl edit ollama.service

# Add these lines:
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"

# Restart
sudo systemctl restart ollama
```

**Option B: Environment variable (macOS/manual)**

```bash
# Add to ~/.bashrc or ~/.zshrc
export OLLAMA_HOST=0.0.0.0:11434

# Restart Ollama
pkill ollama
ollama serve
```

Verify it's listening:

```bash
curl http://localhost:11434/api/tags
# Should return JSON with available models
```

---

## Part 2: Expose Ollama to Internet

GitHub Actions needs to reach your home server. Choose one method:

### Method A: Cloudflare Tunnel (Recommended - Free & Secure)

**Pros:** Free, automatic HTTPS, no port forwarding, no static IP needed  
**Cons:** Requires cloudflared daemon running

```bash
# Install cloudflared
# Linux:
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# macOS:
brew install cloudflare/cloudflare/cloudflared

# Start tunnel (quick mode - no account needed)
cloudflared tunnel --url http://localhost:11434
```

You'll see output like:
```
Your quick Tunnel has been created! Visit it at:
https://random-words-1234.trycloudflare.com
```

**Save this URL** - you'll need it for GitHub secrets.

**Make it persistent (optional):**

```bash
# Create systemd service (Linux)
sudo tee /etc/systemd/system/cloudflared-ollama.service > /dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel for Ollama
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:11434
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable cloudflared-ollama
sudo systemctl start cloudflared-ollama
```

### Method B: Tailscale (If GitHub Actions Runner is on Tailscale)

**Pros:** Secure, no public exposure  
**Cons:** Requires self-hosted GitHub Actions runner on Tailscale network

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Connect
sudo tailscale up

# Get your Tailscale IP
tailscale ip -4
# Example: 100.64.1.2
```

Use `http://100.64.1.2:11434` as your `OLLAMA_URL`.

### Method C: Port Forward + Dynamic DNS (Not Recommended)

**Pros:** Direct connection  
**Cons:** Exposes your home IP, requires router config, security risk

1. Set up dynamic DNS (DuckDNS, No-IP, etc.)
2. Forward port 11434 on your router to your server
3. Use `http://your-domain.duckdns.org:11434`

⚠️ **Security warning:** Add authentication or firewall rules to restrict access.

---

## Part 3: GitHub Integration

### 3.1 Add GitHub Secrets

Go to your repo: **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Name | Value | Example |
|------|-------|---------|
| `OLLAMA_URL` | Your tunnel/Tailscale URL | `https://random-words-1234.trycloudflare.com` |
| `OLLAMA_MODEL` | Model name | `llama3.1:8b` |

### 3.2 Test the Connection

Create a test workflow to verify connectivity:

```bash
# In your repo
mkdir -p .github/workflows
```

Create `.github/workflows/test-ollama.yml`:

```yaml
name: Test Ollama Connection

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Ollama API
        env:
          OLLAMA_URL: ${{ secrets.OLLAMA_URL }}
          OLLAMA_MODEL: ${{ secrets.OLLAMA_MODEL }}
        run: |
          echo "Testing connection to $OLLAMA_URL..."
          
          # Test API availability
          curl -f "$OLLAMA_URL/api/tags" || exit 1
          
          # Test model inference
          response=$(curl -s "$OLLAMA_URL/api/generate" \
            -d "{\"model\": \"$OLLAMA_MODEL\", \"prompt\": \"Say hello\", \"stream\": false}")
          
          echo "Response: $response"
          
          if echo "$response" | jq -e '.response' > /dev/null; then
            echo "✅ Ollama is working!"
          else
            echo "❌ Ollama test failed"
            exit 1
          fi
```

Run it: **Actions → Test Ollama Connection → Run workflow**

### 3.3 Update News Workflow

Modify `.github/workflows/news-cron.yml`:

**Before:**
```yaml
- name: Gather news — Wire services & Center
  uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    # ... rest of config
```

**After:**
```yaml
- name: Gather news — Wire services & Center
  env:
    OLLAMA_URL: ${{ secrets.OLLAMA_URL }}
    OLLAMA_MODEL: ${{ secrets.OLLAMA_MODEL }}
    SITE_URL: ${{ vars.SITE_URL }}
    GITHUB_REPOSITORY: ${{ github.repository }}
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    chmod +x scripts/news-agent-ollama.sh
    ./scripts/news-agent-ollama.sh
```

Repeat for other workflows:
- `.github/workflows/external-news.yml`
- `.github/workflows/telegram-news.yml`
- `.github/workflows/tweet-news.yml`

### 3.4 Customize News Sources (Optional)

To use different sources per workflow, pass them as environment variable:

```yaml
env:
  NEWS_SOURCES: "https://www.reuters.com/,https://apnews.com/"
  # ... other env vars
```

---

## Part 4: Testing & Troubleshooting

### 4.1 Test Locally

Before pushing to GitHub:

```bash
# Set environment variables
export OLLAMA_URL="http://localhost:11434"
export OLLAMA_MODEL="llama3.1:8b"
export SITE_URL="https://epicfuryops.info"
export GITHUB_REPOSITORY="FZ1010/OperationEpicFury"

# Run script
./scripts/news-agent-ollama.sh
```

### 4.2 Common Issues

**Issue: "Cannot connect to Ollama"**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check if tunnel is running
curl https://your-tunnel-url.trycloudflare.com/api/tags
```

**Issue: "Model not found"**
```bash
# List available models
ollama list

# Pull the model
ollama pull llama3.1:8b
```

**Issue: "Invalid JSON response"**

The LLM might not be following instructions. Try:
1. Use a better model (qwen2.5:14b instead of llama3.1:8b)
2. Increase temperature in script (change `"temperature": 0.3` to `0.1`)
3. Add more examples in the prompt

**Issue: "Timeout"**

Large models are slow. Increase timeout in script:
```bash
# In news-agent-ollama.sh, change:
curl -sf --max-time 30 "$url"
# to:
curl -sf --max-time 60 "$url"
```

### 4.3 Monitor Performance

Check Ollama logs:

```bash
# Linux (systemd)
sudo journalctl -u ollama -f

# macOS/manual
# Check terminal where you ran `ollama serve`
```

Check resource usage:

```bash
# CPU/RAM usage
htop

# GPU usage (if using GPU)
nvidia-smi
```

---

## Part 5: Advanced Configuration

### 5.1 Use GPU Acceleration

If your server has an NVIDIA GPU:

```bash
# Install CUDA drivers
# See: https://developer.nvidia.com/cuda-downloads

# Ollama will automatically use GPU
ollama run llama3.1:8b
# Should show "GPU: NVIDIA ..." in output
```

### 5.2 Run Multiple Models

For different quality/speed tradeoffs:

```bash
# Fast model for simple tasks
ollama pull llama3.2:3b

# Quality model for complex analysis
ollama pull qwen2.5:14b
```

Update workflow to use different models:

```yaml
# For simple news scraping
env:
  OLLAMA_MODEL: "llama3.2:3b"

# For detailed analysis
env:
  OLLAMA_MODEL: "qwen2.5:14b"
```

### 5.3 Add Authentication

Protect your Ollama endpoint:

**Option A: Use Cloudflare Access (free tier)**

1. Create Cloudflare account
2. Set up Access policy for your tunnel
3. Add service token to GitHub secrets

**Option B: Add nginx reverse proxy with basic auth**

```bash
# Install nginx
sudo apt install nginx

# Configure proxy with auth
sudo tee /etc/nginx/sites-available/ollama > /dev/null <<EOF
server {
    listen 8080;
    location / {
        auth_basic "Ollama API";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:11434;
    }
}
EOF

# Create password
sudo htpasswd -c /etc/nginx/.htpasswd ollama

# Enable site
sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

Update GitHub secret:
```
OLLAMA_URL=http://ollama:password@your-tunnel-url:8080
```

---

## Part 6: Cost Comparison

### Claude API (Current)
- **Cost per request:** ~$0.50-2.00 (depending on prompt size)
- **Requests per day:** ~6 (cron every 4h)
- **Monthly cost:** ~$90-360

### Ollama (Self-hosted)
- **Hardware:** Existing home server
- **Electricity:** ~$5-10/month (24/7 operation)
- **Internet:** $0 (existing connection)
- **Monthly cost:** ~$5-10

**Savings:** $80-350/month

---

## Part 7: Maintenance

### Keep Ollama Updated

```bash
# Update Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Update models
ollama pull llama3.1:8b
```

### Monitor Uptime

Set up a simple health check:

```bash
# Add to crontab
crontab -e

# Add line:
*/5 * * * * curl -sf http://localhost:11434/api/tags > /dev/null || systemctl restart ollama
```

### Backup Configuration

```bash
# Backup Ollama models (optional, can re-download)
tar -czf ollama-models-backup.tar.gz ~/.ollama/models

# Backup cloudflared config
cp -r ~/.cloudflared ~/cloudflared-backup
```

---

## Rollback Plan

If Ollama doesn't work well, you can easily revert:

1. **Keep Claude workflows:** Don't delete the old workflow files, just rename them
2. **Switch back:** Rename files back and re-enable Claude
3. **Hybrid approach:** Use Ollama for simple tasks, Claude for complex ones

---

## Support

**Ollama Issues:**
- GitHub: https://github.com/ollama/ollama/issues
- Discord: https://discord.gg/ollama

**Cloudflare Tunnel Issues:**
- Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Community: https://community.cloudflare.com/

**Script Issues:**
- Check GitHub Actions logs
- Test locally first
- Enable debug mode: `set -x` in script

---

## Next Steps

1. ✅ Install Ollama on home server
2. ✅ Pull a model
3. ✅ Expose via Cloudflare Tunnel
4. ✅ Add GitHub secrets
5. ✅ Test connection with test workflow
6. ✅ Update one news workflow
7. ✅ Monitor for 24 hours
8. ✅ Update remaining workflows
9. ✅ Remove Claude API credentials (optional)

Good luck! 🚀
