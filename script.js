// Store connected TikTok accounts
let connectedAccounts = [];

// DOM Elements
const addAccountBtn = document.querySelector('.add-account-btn');
const connectBtn = document.querySelector('.connect-btn');
const modal = document.getElementById('tiktok-login-modal');
const closeModalBtn = document.querySelector('.close-modal');
const accountsGrid = document.querySelector('.accounts-grid');
const emptyState = document.querySelector('.empty-state');
const loginFrame = document.querySelector('.tiktok-login-frame');
const videoUploadModal = document.getElementById('video-upload-modal');
const uploadArea = document.querySelector('.upload-area');
const fileInput = document.querySelector('.file-input');
const uploadSubmitBtn = document.querySelector('.upload-submit-btn');
const cancelBtn = document.querySelector('.cancel-btn');

// Event Listeners
addAccountBtn.addEventListener('click', openTikTokLogin);
connectBtn.addEventListener('click', openTikTokLogin);
closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Video Upload Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
});
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
});
uploadSubmitBtn.addEventListener('click', uploadVideo);
cancelBtn.addEventListener('click', () => {
    videoUploadModal.classList.remove('active');
    resetUploadForm();
});

// Functions
function openTikTokLogin() {
    modal.classList.add('active');
    const authUrl = `http://localhost:3000/auth/tiktok`;
    loginFrame.src = authUrl;
}

function closeModal() {
    modal.classList.remove('active');
    loginFrame.src = '';
}

function handleFileSelect(file) {
    if (!file) return;
    
    if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadArea.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <p>${file.name}</p>
                <p class="upload-hint">Click to change video</p>
            `;
            // Store the file for upload
            uploadArea.dataset.file = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please select a video file');
    }
}

async function uploadVideo() {
    const file = uploadArea.dataset.file;
    const title = document.getElementById('video-title').value;
    const description = document.getElementById('video-description').value;
    const privacy = document.getElementById('video-privacy').value;
    const openId = document.querySelector('.account-card.active')?.dataset.openId;

    if (!file || !title || !openId) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        // First, upload the video to a temporary storage
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('privacy', privacy);
        formData.append('open_id', openId);

        const response = await fetch('http://localhost:3000/api/video/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload video');
        }

        const data = await response.json();
        alert('Video uploaded successfully!');
        videoUploadModal.classList.remove('active');
        resetUploadForm();
    } catch (error) {
        console.error('Upload Error:', error);
        alert('Failed to upload video. Please try again.');
    }
}

function resetUploadForm() {
    uploadArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Drag and drop your video here</p>
        <p class="upload-hint">or</p>
        <button class="upload-btn">Select Video</button>
    `;
    document.getElementById('video-title').value = '';
    document.getElementById('video-description').value = '';
    document.getElementById('video-privacy').value = 'public';
    delete uploadArea.dataset.file;
}

function addAccount(account) {
    connectedAccounts.push(account);
    updateAccountsDisplay();
    saveAccounts();
}

function updateAccountsDisplay() {
    accountsGrid.innerHTML = '';
    
    if (connectedAccounts.length === 0) {
        accountsGrid.appendChild(emptyState);
        return;
    }

    connectedAccounts.forEach(account => {
        const accountCard = createAccountCard(account);
        accountsGrid.appendChild(accountCard);
    });
}

function createAccountCard(account) {
    const card = document.createElement('div');
    card.className = 'account-card';
    card.dataset.openId = account.open_id;
    card.innerHTML = `
        <div class="account-header">
            <img src="${account.avatar_url}" alt="${account.username}" class="account-avatar">
            <div class="account-info">
                <h3>@${account.username}</h3>
                <div class="account-stats">
                    <span><i class="fas fa-users"></i> ${account.follower_count.toLocaleString()} followers</span>
                    <span><i class="fas fa-user-friends"></i> ${account.following_count.toLocaleString()} following</span>
                </div>
            </div>
        </div>
        <div class="account-actions">
            <button class="action-btn view-profile">
                <i class="fas fa-eye"></i> View Profile
            </button>
            <button class="action-btn manage">
                <i class="fas fa-cog"></i> Manage
            </button>
            <button class="action-btn post-video">
                <i class="fas fa-video"></i> Post Video
            </button>
            <button class="action-btn analytics">
                <i class="fas fa-chart-line"></i> Analytics
            </button>
        </div>
    `;

    const viewProfileBtn = card.querySelector('.view-profile');
    const manageBtn = card.querySelector('.manage');
    const postVideoBtn = card.querySelector('.post-video');
    const analyticsBtn = card.querySelector('.analytics');

    viewProfileBtn.addEventListener('click', () => {
        window.open(`https://www.tiktok.com/@${account.username}`, '_blank');
    });

    manageBtn.addEventListener('click', () => {
        openAccountManagement(account);
    });

    postVideoBtn.addEventListener('click', () => {
        card.classList.add('active');
        videoUploadModal.classList.add('active');
    });

    analyticsBtn.addEventListener('click', () => {
        fetchAnalytics(account.open_id);
    });

    return card;
}

async function fetchAnalytics(openId) {
    try {
        const response = await fetch(`http://localhost:3000/api/analytics/${openId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        displayAnalytics(data);
    } catch (error) {
        console.error('Analytics Error:', error);
        alert('Failed to fetch analytics. Please try again.');
    }
}

function displayAnalytics(data) {
    // Create and show analytics modal
    const analyticsModal = document.createElement('div');
    analyticsModal.className = 'modal active';
    analyticsModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Account Analytics</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="analytics-container">
                    <div class="analytics-card">
                        <h4>Video Views</h4>
                        <p class="analytics-value">${data.video_views.toLocaleString()}</p>
                    </div>
                    <div class="analytics-card">
                        <h4>Profile Views</h4>
                        <p class="analytics-value">${data.profile_views.toLocaleString()}</p>
                    </div>
                    <div class="analytics-card">
                        <h4>Likes</h4>
                        <p class="analytics-value">${data.likes.toLocaleString()}</p>
                    </div>
                    <div class="analytics-card">
                        <h4>Comments</h4>
                        <p class="analytics-value">${data.comments.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(analyticsModal);
    analyticsModal.querySelector('.close-modal').addEventListener('click', () => {
        analyticsModal.remove();
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const savedAccounts = localStorage.getItem('tiktokAccounts');
    if (savedAccounts) {
        connectedAccounts = JSON.parse(savedAccounts);
        updateAccountsDisplay();
    }
});

function saveAccounts() {
    localStorage.setItem('tiktokAccounts', JSON.stringify(connectedAccounts));
}

// Add event listener to save accounts when they change
const observer = new MutationObserver(saveAccounts);
observer.observe(accountsGrid, { childList: true }); 