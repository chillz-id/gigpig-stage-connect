#!/bin/bash

# Claude Multi-Agent Launcher
# Manages multiple Claude Code instances with different contexts

REPO_PATH="/mnt/f/AISUPERTOOLS/gigpig-stage-connect-fresh"
SESSION_DIR="$HOME/.claude-sessions"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create session directory
mkdir -p "$SESSION_DIR"

show_menu() {
    clear
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}    Claude Multi-Agent Controller${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo
    echo "1) Launch Frontend Claude (UI/Components)"
    echo "2) Launch Backend Claude (API/Hooks)"  
    echo "3) Launch Testing Claude (Tests/QA)"
    echo "4) Launch All Agents"
    echo "5) Show Agent Status"
    echo "6) Sync Agent Knowledge"
    echo "7) Merge Agent Work"
    echo "0) Exit"
    echo
}

launch_frontend_claude() {
    echo -e "${GREEN}Launching Frontend Claude...${NC}"
    cd "$REPO_PATH"
    
    # Switch context
    cp CLAUDE-FRONTEND.md CLAUDE.md
    
    # Create or switch to branch
    git checkout -b feature/frontend-work 2>/dev/null || git checkout feature/frontend-work
    
    echo -e "${YELLOW}Frontend Claude Instructions:${NC}"
    echo "- Work only on UI components and pages"
    echo "- Branch: feature/frontend-work"
    echo "- Check .agent-comms/backend-updates/ for API changes"
    echo
    echo -e "${GREEN}Starting Claude...${NC}"
    
    # Store session info
    echo "frontend|$(pwd)|$(git branch --show-current)|$(date)" > "$SESSION_DIR/frontend.session"
    
    # Launch in new terminal if possible
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd $REPO_PATH && claude; exec bash"
    else
        claude
    fi
}

launch_backend_claude() {
    echo -e "${GREEN}Launching Backend Claude...${NC}"
    cd "$REPO_PATH"
    
    # Switch context
    cp CLAUDE-BACKEND.md CLAUDE.md
    
    # Create or switch to branch
    git checkout -b feature/backend-work 2>/dev/null || git checkout feature/backend-work
    
    echo -e "${YELLOW}Backend Claude Instructions:${NC}"
    echo "- Work only on hooks, APIs, and integrations"
    echo "- Branch: feature/backend-work"
    echo "- Check .agent-comms/frontend-updates/ for UI needs"
    echo
    echo -e "${GREEN}Starting Claude...${NC}"
    
    # Store session info
    echo "backend|$(pwd)|$(git branch --show-current)|$(date)" > "$SESSION_DIR/backend.session"
    
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd $REPO_PATH && claude; exec bash"
    else
        claude
    fi
}

launch_testing_claude() {
    echo -e "${GREEN}Launching Testing Claude...${NC}"
    cd "$REPO_PATH"
    
    # Switch context
    cp CLAUDE-TESTING.md CLAUDE.md
    
    # Create or switch to branch
    git checkout -b feature/test-work 2>/dev/null || git checkout feature/test-work
    
    echo -e "${YELLOW}Testing Claude Instructions:${NC}"
    echo "- Work only on tests and quality assurance"
    echo "- Branch: feature/test-work"
    echo "- Monitor both frontend and backend updates"
    echo
    echo -e "${GREEN}Starting Claude...${NC}"
    
    # Store session info
    echo "testing|$(pwd)|$(git branch --show-current)|$(date)" > "$SESSION_DIR/testing.session"
    
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd $REPO_PATH && claude; exec bash"
    else
        claude
    fi
}

launch_all_agents() {
    echo -e "${BLUE}Launching all Claude agents...${NC}"
    sleep 1
    launch_frontend_claude
    sleep 2
    launch_backend_claude
    sleep 2
    launch_testing_claude
    echo -e "${GREEN}All agents launched!${NC}"
}

show_agent_status() {
    echo -e "${BLUE}Agent Status Report${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    
    cd "$REPO_PATH"
    
    # Check each agent branch
    for branch in feature/frontend-work feature/backend-work feature/test-work; do
        if git show-ref --verify --quiet refs/heads/$branch; then
            echo -e "\n${GREEN}$branch:${NC}"
            git log $branch --oneline -5 --pretty=format:"  %h %s (%cr)" 2>/dev/null || echo "  No commits yet"
        fi
    done
    
    echo -e "\n\n${YELLOW}Recent Updates:${NC}"
    find .agent-comms -name "*.md" -mtime -1 -type f | while read file; do
        echo "  📄 $file ($(date -r "$file" '+%Y-%m-%d %H:%M'))"
    done
}

sync_agent_knowledge() {
    echo -e "${BLUE}Syncing agent knowledge...${NC}"
    cd "$REPO_PATH"
    
    # Run the sync script
    if [ -f "agent-sync.js" ]; then
        node agent-sync.js &
        SYNC_PID=$!
        echo -e "${GREEN}Sync process started (PID: $SYNC_PID)${NC}"
        echo "Press Ctrl+C to stop"
        wait $SYNC_PID
    else
        echo -e "${RED}agent-sync.js not found!${NC}"
    fi
}

merge_agent_work() {
    echo -e "${BLUE}Merging agent work to dev branch...${NC}"
    cd "$REPO_PATH"
    
    # Ensure we're on dev
    git checkout dev || { echo -e "${RED}Failed to checkout dev branch${NC}"; return; }
    
    # Pull latest
    git pull origin dev
    
    # Merge each agent branch
    for branch in feature/frontend-work feature/backend-work feature/test-work; do
        if git show-ref --verify --quiet refs/heads/$branch; then
            echo -e "\n${YELLOW}Merging $branch...${NC}"
            git merge $branch --no-ff -m "Merge $branch into dev" || {
                echo -e "${RED}Merge conflict! Resolve manually${NC}"
                return
            }
        fi
    done
    
    echo -e "${GREEN}All branches merged! Don't forget to push:${NC}"
    echo "  git push origin dev"
}

# Main loop
while true; do
    show_menu
    read -p "Select option: " choice
    
    case $choice in
        1) launch_frontend_claude ;;
        2) launch_backend_claude ;;
        3) launch_testing_claude ;;
        4) launch_all_agents ;;
        5) show_agent_status; read -p "Press Enter to continue..." ;;
        6) sync_agent_knowledge ;;
        7) merge_agent_work; read -p "Press Enter to continue..." ;;
        0) echo "Exiting..."; exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}"; sleep 1 ;;
    esac
done