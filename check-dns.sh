#!/bin/bash
echo "Monitoring DNS propagation for n8n.standupsydney.com..."
echo "Target IP: 170.64.252.55"
echo ""

for i in {1..30}; do
    DNS=$(dig +short n8n.standupsydney.com | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] Attempt $i: $DNS"

    if [ "$DNS" = "170.64.252.55" ]; then
        echo ""
        echo "✓ DNS propagated successfully!"
        exit 0
    fi

    if [ $i -lt 30 ]; then
        sleep 10
    fi
done

echo ""
echo "DNS has not propagated yet. Current IP: $DNS"
echo "You may need to wait longer or check your DNS provider settings."
exit 1
