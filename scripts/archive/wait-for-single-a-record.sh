#!/bin/bash
echo "Waiting for DNS to show ONLY 170.64.252.55..."
echo "Please remove the AWS A records (15.197.142.173 and 3.33.152.147) from your DNS provider"
echo ""

for i in {1..60}; do
    DNS_RECORDS=$(dig +short n8n.standupsydney.com A | sort)
    COUNT=$(echo "$DNS_RECORDS" | wc -l)
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$TIMESTAMP] Attempt $i:"
    echo "$DNS_RECORDS" | sed 's/^/  /'
    echo ""

    if [ "$DNS_RECORDS" = "170.64.252.55" ]; then
        echo "✓ DNS now shows only 170.64.252.55!"
        echo "Ready to proceed with SSL certificate."
        exit 0
    fi

    if [ $i -lt 60 ]; then
        sleep 10
    fi
done

echo "Still seeing multiple A records. Please verify DNS provider changes."
exit 1
