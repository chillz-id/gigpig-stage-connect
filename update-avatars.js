// Quick update script to add cyberpunk avatars to the dashboard

// In cyberpunk-realtime.js, update the agentAvatars object to use actual images:

const agentAvatars = {
  frontend: 'https://i.imgur.com/YN8XNCD.jpg',  // Neon hacker girl
  backend: 'https://i.imgur.com/8HShNNv.jpg',   // Cyber daemon mask
  testing: 'https://i.imgur.com/xL4Sflt.jpg'    // GIGACHAD cyberpunk
};

// Alternative cool cyberpunk avatars you can use:
const alternativeAvatars = {
  // Option 1 - Cyberpunk characters
  frontend: 'https://i.pinimg.com/236x/4f/2e/50/4f2e5066b6e60d97f8252361c3fd4b97.jpg',
  backend: 'https://i.pinimg.com/236x/7c/ee/86/7cee860003dc0622bddb782bb0c994d7.jpg',
  testing: 'https://i.pinimg.com/236x/43/e7/40/43e740342d45e59e933c866539453737.jpg',
  
  // Option 2 - Glitch art style
  frontend: 'https://i.pinimg.com/236x/ef/29/04/ef2904e6144d9c3e9c8da98c96dcb604.jpg',
  backend: 'https://i.pinimg.com/236x/b9/65/31/b96531487407d0d5dcb55e639dcd8026.jpg',
  testing: 'https://i.pinimg.com/236x/2d/1d/d6/2d1dd60b6e7cc59461e9e335d998dd4d.jpg',
  
  // Option 3 - Robot/AI themed
  frontend: 'https://cdn.pixabay.com/photo/2024/02/28/16/37/cyberpunk-8602495_640.jpg',
  backend: 'https://cdn.pixabay.com/photo/2024/01/24/17/10/ai-generated-8530046_640.png',
  testing: 'https://cdn.pixabay.com/photo/2023/04/11/01/27/ai-generated-7915308_640.jpg'
};

// Update the createAgentCard function to use real images:
/*
Replace this line:
<div style="font-size: 30px; text-align: center; line-height: 60px;">\${agentAvatars[id]}</div>

With this:
<img src="\${agentAvatars[id]}" alt="\${agent.name}" style="width: 100%; height: 100%; object-fit: cover; filter: saturate(1.5) contrast(1.2);">

The filter adds extra cyberpunk vibrancy!
*/

// Add some cool CSS animations for the avatars:
const avatarAnimations = `
.agent-avatar {
  position: relative;
  overflow: hidden;
}

.agent-avatar img {
  transition: all 0.3s ease;
}

.agent-avatar:hover img {
  transform: scale(1.1);
  filter: saturate(2) contrast(1.3) hue-rotate(10deg);
}

/* Glitch effect on busy agents */
.agent-card.busy .agent-avatar img {
  animation: glitch 2s infinite;
}

@keyframes glitch {
  0%, 100% { 
    filter: saturate(1.5) contrast(1.2); 
  }
  20% { 
    filter: saturate(3) contrast(2) hue-rotate(90deg);
    transform: scale(1.02) translateX(2px);
  }
  40% { 
    filter: saturate(0.5) contrast(3) hue-rotate(-90deg);
    transform: scale(0.98) translateY(-2px);
  }
  60% {
    filter: saturate(2) contrast(1.5) hue-rotate(180deg);
    transform: scale(1.01) translateX(-1px);
  }
}

/* Scanning effect overlay */
.agent-avatar::after {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(37, 225, 237, 0.3) 50%,
    transparent 100%
  );
  animation: scan-avatar 3s ease-in-out infinite;
}

@keyframes scan-avatar {
  0%, 100% { top: -100%; }
  50% { top: 100%; }
}
`;

// You can also use these sick resources for avatars:
// - https://robohash.org/NETRUNNER01?set=set4 (Cyberpunk robots)
// - https://avatars.dicebear.com/api/bottts/DAEMON02.svg (Tech avatars)
// - https://api.multiavatar.com/GIGACHAD420.png (Unique avatars)