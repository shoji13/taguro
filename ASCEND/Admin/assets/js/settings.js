// Sidebar toggle functionality
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const app = document.querySelector('.app');

if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('minimized');
        if (app) {
            app.classList.toggle('sidebar-minimized');
        }
    });
}

// Load current user (name + initials) into toolbar - always show logged-in admin user
async function loadCurrentUserToolbar() {
    try {
        const response = await fetch('phpbackend/get_current_user.php');
        const data = await response.json();
        if (data && data.success) {
            const nameEl = document.getElementById('userName');
            const avatarEl = document.getElementById('userAvatar');
            // Use AccountName if available, otherwise fallback to username
            const displayName = data.name || data.username || 'User';
            if (nameEl) nameEl.textContent = displayName;
            if (data.initials && avatarEl) {
                avatarEl.textContent = data.initials;
            } else if (avatarEl && displayName) {
                // Fallback: generate initials from name
                const names = displayName.split(' ');
                const initials = names.map(n => n[0]).join('').toUpperCase().substring(0, 2);
                avatarEl.textContent = initials;
            }
        } else {
            console.error('Failed to load user:', data);
        }
    } catch (e) {
        console.error('Error loading toolbar user:', e);
    }
}

// Load user on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCurrentUserToolbar);
} else {
    loadCurrentUserToolbar();
}

// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.querySelector('.toggle-switch input[type="checkbox"]');
    if (darkModeToggle) {
        // Load saved dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        darkModeToggle.checked = savedDarkMode;
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
        }
        
        darkModeToggle.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            localStorage.setItem('darkMode', isDark);
            // Trigger storage event for other tabs/pages
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'darkMode',
                newValue: isDark.toString()
            }));
            if (isDark) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        });
    }
});

// Profile modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const profilePill = document.querySelector('.pill[title="Profile"]');
    const profileModalOverlay = document.getElementById('profileModalOverlay');
    const profileModalClose = document.getElementById('profileModalClose');

    // Open profile modal when clicking profile pill
    if (profilePill && profileModalOverlay) {
        profilePill.style.cursor = 'pointer';
        profilePill.addEventListener('click', async () => {
            await loadProfileData();
            profileModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close profile modal
    if (profileModalClose && profileModalOverlay) {
        profileModalClose.addEventListener('click', () => {
            profileModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close modal when clicking overlay
    if (profileModalOverlay) {
        profileModalOverlay.addEventListener('click', (e) => {
            if (e.target === profileModalOverlay) {
                profileModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});

// Load and display profile data
async function loadProfileData() {
    try {
        const response = await fetch('phpbackend/get_current_user.php');
        const data = await response.json();
        
        const profileInfo = document.getElementById('profileInfo');
        if (!profileInfo) return;
        
        if (data && data.success) {
            profileInfo.innerHTML = `
                <div class="profile-details" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="profile-avatar" style="text-align: center; margin-bottom: 10px;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--grad); display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: white; margin: 0 auto;">
                            ${data.initials || 'U'}
                        </div>
                    </div>
                    <div class="detail-item" style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Account ID</div>
                        <div style="font-size: 16px; font-weight: 600; color: var(--text);">${data.id || 'N/A'}</div>
                    </div>
                    <div class="detail-item" style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Full Name</div>
                        <div style="font-size: 16px; font-weight: 600; color: var(--text);">${data.name || 'N/A'}</div>
                    </div>
                    <div class="detail-item" style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Username</div>
                        <div style="font-size: 16px; font-weight: 600; color: var(--text);">${data.username || 'N/A'}</div>
                    </div>
                    <div class="detail-item" style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Email</div>
                        <div style="font-size: 16px; font-weight: 600; color: var(--text);">${data.email || 'N/A'}</div>
                    </div>
                    <div class="detail-item" style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Role</div>
                        <div style="font-size: 16px; font-weight: 600; color: var(--text);">${data.role || 'N/A'}</div>
                    </div>
                </div>
            `;
        } else {
            profileInfo.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Failed to load profile data.</div>';
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        const profileInfo = document.getElementById('profileInfo');
        if (profileInfo) {
            profileInfo.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Error loading profile data.</div>';
        }
    }
}

// Edit Profile Modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const editProfileBtn = document.querySelector('.settings-item[href="#"]');
    const editProfileModalOverlay = document.getElementById('editProfileModalOverlay');
    const editProfileModalClose = document.getElementById('editProfileModalClose');
    const cancelEditProfile = document.getElementById('cancelEditProfile');
    const editProfileForm = document.getElementById('editProfileForm');

    // Open edit profile modal
    if (editProfileBtn && editProfileBtn.textContent.includes('Edit profile') && editProfileModalOverlay) {
        editProfileBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            // Load current user data into form
            await loadEditProfileData();
            editProfileModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close edit profile modal
    if (editProfileModalClose && editProfileModalOverlay) {
        editProfileModalClose.addEventListener('click', () => {
            editProfileModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (cancelEditProfile && editProfileModalOverlay) {
        cancelEditProfile.addEventListener('click', () => {
            editProfileModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close modal when clicking overlay
    if (editProfileModalOverlay) {
        editProfileModalOverlay.addEventListener('click', (e) => {
            if (e.target === editProfileModalOverlay) {
                editProfileModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Handle form submission
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveProfileChanges();
        });
    }

    // Change password modal functionality
    const changePasswordBtn = Array.from(document.querySelectorAll('.settings-item')).find(
        item => item.textContent.includes('Change Password')
    );
    const changePasswordModalOverlay = document.getElementById('changePasswordModalOverlay');
    const changePasswordModalClose = document.getElementById('changePasswordModalClose');
    const cancelChangePassword = document.getElementById('cancelChangePassword');
    const changePasswordForm = document.getElementById('changePasswordForm');

    // Open change password modal
    if (changePasswordBtn && changePasswordModalOverlay) {
        changePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Reset form
            if (changePasswordForm) {
                changePasswordForm.reset();
            }
            changePasswordModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close change password modal
    if (changePasswordModalClose && changePasswordModalOverlay) {
        changePasswordModalClose.addEventListener('click', () => {
            changePasswordModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
            if (changePasswordForm) {
                changePasswordForm.reset();
            }
        });
    }

    if (cancelChangePassword && changePasswordModalOverlay) {
        cancelChangePassword.addEventListener('click', () => {
            changePasswordModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
            if (changePasswordForm) {
                changePasswordForm.reset();
            }
        });
    }

    // Close modal when clicking overlay
    if (changePasswordModalOverlay) {
        changePasswordModalOverlay.addEventListener('click', (e) => {
            if (e.target === changePasswordModalOverlay) {
                changePasswordModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
                if (changePasswordForm) {
                    changePasswordForm.reset();
                }
            }
        });
    }

    // Password toggle functionality
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const targetId = toggle.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    toggle.textContent = '🙈';
                } else {
                    input.type = 'password';
                    toggle.textContent = '👁️';
                }
            }
        });
    });

    // Handle change password form submission
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await changePassword();
        });
    }
});

// Change password function
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match!', 'error');
        return;
    }

    // Validate password length
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters long!', 'error');
        return;
    }

    try {
        const response = await fetch('phpbackend/change_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        const data = await response.json();
        
        if (data && data.success) {
            showNotification('Password changed successfully!', 'success');
            // Close modal
            const changePasswordModalOverlay = document.getElementById('changePasswordModalOverlay');
            if (changePasswordModalOverlay) {
                changePasswordModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            // Reset form
            const changePasswordForm = document.getElementById('changePasswordForm');
            if (changePasswordForm) {
                changePasswordForm.reset();
            }
        } else {
            showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Error changing password. Please try again.', 'error');
    }
}

// Load current user data into edit form
async function loadEditProfileData() {
    try {
        const response = await fetch('phpbackend/get_current_user.php');
        const data = await response.json();
        
        if (data && data.success) {
            document.getElementById('editFullName').value = data.name || '';
            document.getElementById('editUsername').value = data.username || '';
            document.getElementById('editEmail').value = data.email || '';
        }
    } catch (error) {
        console.error('Error loading profile data for edit:', error);
    }
}

// Save profile changes
async function saveProfileChanges() {
    try {
        const formData = {
            fullName: document.getElementById('editFullName').value,
            username: document.getElementById('editUsername').value,
            email: document.getElementById('editEmail').value
        };

        const response = await fetch('phpbackend/update_profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data && data.success) {
            showNotification('Profile updated successfully!', 'success');
            // Close modal
            const editProfileModalOverlay = document.getElementById('editProfileModalOverlay');
            if (editProfileModalOverlay) {
                editProfileModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            // Reload user data in toolbar
            loadCurrentUserToolbar();
        } else {
            showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showNotification('Error updating profile. Please try again.', 'error');
    }
}

// Notification system
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}