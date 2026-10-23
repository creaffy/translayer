# DISCONTINUED ❌
Since we no longer maintain zombslib, in order to use this project, you would need to dump protocol mappings from both the Windows and Android yourself. This task could render itself quite complex and it may be necessary to use AI reverse-engineering tools to get it done.
Join our [Discord server](https://discord.gg/invite/E5QWPx6TrX) if you need help.

Thanks for stopping by. <br/>
_\~ xor&pray_

# Translayer
Middleware for ZombsRoyale.io - translates Windows packets into Android ones using [zombslib](https://github.com/creaffy/zombslib). Essentially a platform spoofer.

# Advantages
- Android clients don't need to send anticheat packets so pretending to be one is effectively a full bypass.
- Since 2023, you cannot use "device" (for exmaple ones generated via `/api/validate/device`) accounts on PC/Web. Using Translayer allows you to do so.

# Usage
1. Fix protocol mappings and POW generation.
2. Build and run Translayer. It will start 3 listeners:
   - Port 3002: Mason Service proxy
   - Port 3003: TCP gameserver proxy
   - Port 3004: UDP gameserver proxy
3. Mod your Zombs Royale client and force it to connect to `localhost:3002` instead of the real Mason Service.

That's it.

# Disclaimer
This project is unofficial and not affiliated with Zombs Royale or Endgame. Use responsibly and at your own risk.
