#!/bin/bash
echo "Monitoring DNS TXT record update..."
echo "Target value: Tef_MDHTNoAEx7GUCq57GGAHlbXtO2RnbBvfeMZ0PqM"
echo ""

for i in {1..60}; do
    TXT=$(dig +short TXT _acme-challenge.n8n.standupsydney.com | tr -d '"')
    TIMESTAMP=$(date '+%H:%M:%S')
    echo "[$TIMESTAMP] Check $i: $TXT"

    if [ "$TXT" = "Tef_MDHTNoAEx7GUCq57GGAHlbXtO2RnbBvfeMZ0PqM" ]; then
        echo ""
        echo "✓ TXT record updated successfully!"
        exit 0
    fi

    if [ $i -lt 60 ]; then
        sleep 10
    fi
done

echo ""
echo "TXT record has not updated yet. Please verify the change in your DNS provider."
exit 1
