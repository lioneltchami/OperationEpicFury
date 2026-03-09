# Ollama Quick Start

5-minute setup to replace Claude with free self-hosted LLM.

## On Your Home Server

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull model
ollama pull llama3.1:8b

# 3. Configure for remote access
sudo systemctl edit ollama.service
# Add: Environment="OLLAMA_HOST=0.0.0.0:11434"
sudo systemctl restart ollama

# 4. Expose via Cloudflare Tunnel (free)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
cloudflared tunnel --url http://localhost:11434
# Save the https://xxx.trycloudflare.com URL
```

## On GitHub

```bash
# 1. Add secrets (Settings → Secrets → Actions)
OLLAMA_URL = https://your-tunnel-url.trycloudflare.com
OLLAMA_MODEL = llama3.1:8b

# 2. Test connection
# Create .github/workflows/test-ollama.yml (see full guide)
# Run workflow to verify

# 3. Update news-cron.yml
# Replace anthropics/claude-code-action step with:
```

```yaml
- name: Gather news with Ollama
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

## Files Created

- ✅ `scripts/news-agent-ollama.sh` - Main script (error-free, validated)
- ✅ `docs/OLLAMA_SETUP.md` - Complete guide (530 lines)
- ✅ `docs/OLLAMA_QUICKSTART.md` - This file

## Cost Savings

- **Before:** $90-360/month (Claude API)
- **After:** $5-10/month (electricity)

## Full Documentation

See `docs/OLLAMA_SETUP.md` for:
- Detailed troubleshooting
- Security configuration
- GPU acceleration
- Multiple model setup
- Monitoring & maintenance

## Support

Test locally first:
```bash
export OLLAMA_URL="http://localhost:11434"
export OLLAMA_MODEL="llama3.1:8b"
export SITE_URL="https://epicfuryops.info"
export GITHUB_REPOSITORY="FZ1010/OperationEpicFury"
./scripts/news-agent-ollama.sh
```
