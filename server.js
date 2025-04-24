const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// TikTok API Configuration
const TIKTOK_CONFIG = {
    clientKey: 'YOUR_CLIENT_KEY',
    clientSecret: 'YOUR_CLIENT_SECRET',
    redirectUri: 'http://localhost:3000/callback'
};

// Store tokens (in production, use a proper database)
const tokenStore = new Map();

// OAuth Callback Route
app.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    
    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
            client_key: TIKTOK_CONFIG.clientKey,
            client_secret: TIKTOK_CONFIG.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: TIKTOK_CONFIG.redirectUri
        });

        const { access_token, open_id } = tokenResponse.data;
        
        // Get user info
        const userResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        // Store the token
        tokenStore.set(open_id, access_token);

        // Redirect back to the frontend with the user data
        res.redirect(`http://localhost:3000?user=${encodeURIComponent(JSON.stringify(userResponse.data))}`);
    } catch (error) {
        console.error('OAuth Error:', error);
        res.redirect('http://localhost:3000?error=authentication_failed');
    }
});

// API Routes
app.post('/api/video/upload', async (req, res) => {
    const { open_id, video_url, title, description } = req.body;
    
    try {
        const access_token = tokenStore.get(open_id);
        if (!access_token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const response = await axios.post('https://open.tiktokapis.com/v2/video/upload/', {
            video_url,
            title,
            description
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Video Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

app.get('/api/analytics/:open_id', async (req, res) => {
    const { open_id } = req.params;
    
    try {
        const access_token = tokenStore.get(open_id);
        if (!access_token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const response = await axios.get('https://open.tiktokapis.com/v2/user/analytics/', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 