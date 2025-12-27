#!/bin/bash
# System Resource Monitoring Script
# Prevents crashes by monitoring memory and CPU usage
# Created: 2025-10-22

LOG_FILE="/var/log/resource-monitor.log"
ALERT_THRESHOLD_MEM=85  # Alert if memory usage exceeds 85%
ALERT_THRESHOLD_CPU=90  # Alert if CPU usage exceeds 90%
MAX_POSTIZ_MEM=1536     # Max 1.5GB for Postiz (in MB)

# Create log file if it doesn't exist
touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/resource-monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check total system memory
check_system_memory() {
    local mem_percent=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    local mem_used=$(free -h | grep Mem | awk '{print $3}')
    local mem_total=$(free -h | grep Mem | awk '{print $2}')

    log "System Memory: $mem_used / $mem_total (${mem_percent}%)"

    if [ "$mem_percent" -gt "$ALERT_THRESHOLD_MEM" ]; then
        log "⚠️  WARNING: High memory usage detected (${mem_percent}%)!"
        return 1
    fi
    return 0
}

# Check CPU usage
check_cpu() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    local cpu_int=${cpu_usage%.*}

    log "CPU Usage: ${cpu_int}%"

    if [ "$cpu_int" -gt "$ALERT_THRESHOLD_CPU" ]; then
        log "⚠️  WARNING: High CPU usage detected (${cpu_int}%)!"
        return 1
    fi
    return 0
}

# Check Postiz container resources
check_postiz() {
    if ! docker ps -q -f name=postiz-app >/dev/null 2>&1; then
        log "ℹ️  Postiz container not running"
        return 0
    fi

    local postiz_mem=$(docker stats --no-stream --format "{{.MemUsage}}" postiz-app | awk '{print $1}' | sed 's/MiB//')
    local postiz_cpu=$(docker stats --no-stream --format "{{.CPUPerc}}" postiz-app | sed 's/%//')

    log "Postiz: ${postiz_mem}MB RAM, ${postiz_cpu}% CPU"

    # Check if Postiz exceeds memory limit
    if (( $(echo "$postiz_mem > $MAX_POSTIZ_MEM" | bc -l) )); then
        log "⚠️  Postiz exceeding memory limit (${postiz_mem}MB > ${MAX_POSTIZ_MEM}MB)"
        log "🔄 Restarting Postiz to free memory..."
        cd /root/postiz && docker compose restart postiz-app
        log "✅ Postiz restarted"
        return 1
    fi

    return 0
}

# Check for zombie processes
check_zombies() {
    local zombie_count=$(ps aux | awk '{print $8}' | grep -c Z)
    if [ "$zombie_count" -gt 0 ]; then
        log "⚠️  Found $zombie_count zombie processes"
        return 1
    fi
    return 0
}

# Main monitoring function
monitor() {
    log "=== Resource Monitor Check ==="

    local issues=0

    check_system_memory || ((issues++))
    check_cpu || ((issues++))
    check_postiz || ((issues++))
    check_zombies || ((issues++))

    if [ "$issues" -eq 0 ]; then
        log "✅ All systems healthy"
    else
        log "⚠️  Detected $issues issue(s)"
    fi

    log "=== Check Complete ==="
    echo ""
}

# Run monitoring check
monitor

# Show summary
echo ""
echo "📊 Resource Monitor Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
free -h
echo ""
echo "Top 5 Memory Consumers:"
ps aux --sort=-%mem | head -6 | awk '{printf "%-10s %5s %5s  %s\n", $11, $3"%", $4"%", $2}'
echo ""
echo "Docker Container Stats:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "No Docker containers running"
echo ""
echo "💡 Log file: $LOG_FILE"
