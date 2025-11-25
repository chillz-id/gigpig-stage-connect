#!/bin/bash
set -e

echo "=== N8N SSL Certificate Setup Helper ==="
echo ""
echo "INSTRUCTIONS:"
echo "1. Update your DNS TXT record:"
echo "   Name: _acme-challenge.n8n"
echo "   Value: Tef_MDHTNoAEx7GUCq57GGAHlbXtO2RnbBvfeMZ0PqM"
echo ""
echo "2. Wait for DNS propagation (checking now...)"
echo ""

# Wait for TXT record
for i in {1..30}; do
    TXT=$(dig +short TXT _acme-challenge.n8n.standupsydney.com 2>/dev/null | tr -d '"')
    if [ "$TXT" = "Tef_MDHTNoAEx7GUCq57GGAHlbXtO2RnbBvfeMZ0PqM" ]; then
        echo "✓ TXT record verified!"
        break
    fi
    echo "Attempt $i: Still waiting... (current: $TXT)"
    sleep 5
done

echo ""
echo "3. Now run this command manually in another terminal:"
echo "   sudo certbot certonly --manual --preferred-challenges dns -d n8n.standupsydney.com --email admin@standupsydney.com --agree-tos"
echo ""
echo "4. When prompted, press Enter to continue"
echo ""
echo "5. After certificate is obtained, run:"
echo "   sudo /root/agents/update-nginx-ssl.sh"
