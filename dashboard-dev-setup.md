# Easy Dashboard Development Setup 🚀

## Option 1: Live Edit on Server (Easiest!)
```bash
# SSH to your server
ssh developer@170.64.252.55

# Edit directly on server with nano
nano ~/agents/cyberpunk-standalone.js

# After making changes, just restart:
pm2 restart cyberpunk

# See changes instantly at http://170.64.252.55:3001
```

## Option 2: Local Development + Auto Deploy
Set up a simple watch script that auto-deploys when you save:

### Create deploy script locally:
```bash
#!/bin/bash
# save as: deploy-dashboard.sh

echo "🚀 Deploying dashboard..."
scp cyberpunk-standalone.js developer@170.64.252.55:~/agents/
ssh developer@170.64.252.55 "pm2 restart cyberpunk"
echo "✅ Dashboard updated!"
```

### Make it executable:
```bash
chmod +x deploy-dashboard.sh
```

### Deploy with one command:
```bash
./deploy-dashboard.sh
```

## Option 3: VS Code Remote SSH (Best!)
1. Install "Remote - SSH" extension in VS Code
2. Connect to: `developer@170.64.252.55`
3. Open folder: `/root/agents`
4. Edit `cyberpunk-standalone.js` with full VS Code features
5. Terminal in VS Code: `pm2 restart cyberpunk`

## Quick Edits Cheat Sheet

### Change Colors:
```javascript
// Find this section at top:
--cyber-yellow: #FFEB0B;  // Change to any hex
--cyber-cyan: #25E1ED;    // Change to any hex
--cyber-magenta: #ED1E79; // Change to any hex
```

### Change Agent Names:
```javascript
// Search for:
<div class="agent-name">NETRUNNER_01</div>
// Change to:
<div class="agent-name">GIGACHAD_01</div>
```

### Add New Log Entry:
```javascript
// Find executeTask() function, add:
newEntry.innerHTML = `
  <span class="log-time">[EPIC]</span>
  <span class="log-message">Your message here</span>
`;
```

### Change Background Animation Speed:
```css
// Find:
animation: grid-move 20s linear infinite;
// Change 20s to any speed (lower = faster)
```

## Pro Tips 🎯

1. **Test changes quickly**: Keep browser tab open, just refresh after `pm2 restart`

2. **Backup before big changes**:
   ```bash
   cp cyberpunk-standalone.js cyberpunk-standalone.backup.js
   ```

3. **Add custom sections**: The file is self-contained HTML, just add new `<div>` blocks

4. **Change fonts**: Replace the Google Fonts URL at top with any font you like

5. **Make it yours**: Since it's all in one file, you can edit HTML, CSS, and JS all together!

No more git pulls, no more conflicts - just edit and restart! 🔥