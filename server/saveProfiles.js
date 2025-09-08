// Simple Express server to save user input and generated agent profiles to the repo
// Usage: node server/saveProfiles.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json({ limit: '2mb' }));

const profilesDir = path.join(__dirname, '..', 'src', 'data', 'profiles');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitize(ts) {
  return ts.replace(/[:.]/g, '-');
}

app.post('/api/profiles', (req, res) => {
  try {
    ensureDir(profilesDir);
    const { userInput, agentProfiles } = req.body || {};
    const ts = sanitize(new Date().toISOString());

    if (userInput) {
      const userFile = path.join(profilesDir, `user_input_${ts}.json`);
      fs.writeFileSync(userFile, JSON.stringify(userInput, null, 2));
    }

    if (agentProfiles) {
      const agentFile = path.join(profilesDir, `agent_profiles_${ts}.json`);
      fs.writeFileSync(agentFile, JSON.stringify(agentProfiles, null, 2));
    }

    return res.json({ ok: true, savedAt: profilesDir });
  } catch (e) {
    console.error('Failed to save profiles:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  ensureDir(profilesDir);
  console.log(`Profile saver running on http://localhost:${PORT}`);
  console.log(`Saving to: ${profilesDir}`);
});
