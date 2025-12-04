const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const app = document.querySelector('.app');

if(menuBtn){
  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('minimized');
    app.classList.toggle('sidebar-minimized');
  });
}

// Store all accounts for filtering
let allAccounts = [];

// Display accounts in table
function displayAccounts(accounts) {
  const tbody = document.getElementById('accountsTableBody');
  tbody.innerHTML = ''; // Clear existing content
  
  if (accounts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">No accounts found</td></tr>';
    return;
  }
  
  accounts.forEach(account => {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.setAttribute('data-account-id', account.id);
    
    const formattedBalance = account.balance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    row.innerHTML = `
      <td>${account.username || account.name}</td>
      <td>${account.email}</td>
      <td>₱${formattedBalance}</td>
    `;
    
    // Add click event to show modal
    row.addEventListener('click', () => {
      // Persist selected account as current context for other pages
      try { localStorage.setItem('current_account_id', account.id); } catch (e) {}
      showAccountModal(account.id);
    });
    
    tbody.appendChild(row);
  });
}

// Filter accounts based on search term
function filterAccounts(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    displayAccounts(allAccounts);
    return;
  }
  
  const term = searchTerm.toLowerCase().trim();
  const filtered = allAccounts.filter(account => {
    const username = (account.username || '').toLowerCase();
    const email = (account.email || '').toLowerCase();
    const name = (account.name || '').toLowerCase();
    
    return username.includes(term) || email.includes(term) || name.includes(term);
  });
  
  displayAccounts(filtered);
}

// Fetch accounts from PHP backend
async function loadAccounts() {
  try {
    const response = await fetch('phpbackend/get_accounts.php');
    const data = await response.json();
    
    if (data.success && data.accounts) {
      allAccounts = data.accounts;
      displayAccounts(allAccounts);
    } else {
      console.error('Error loading accounts:', data.error);
      document.getElementById('accountsTableBody').innerHTML = 
        '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">Error loading accounts</td></tr>';
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    document.getElementById('accountsTableBody').innerHTML = 
      '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">Error loading accounts</td></tr>';
  }
}

// Load accounts when page loads
loadAccounts();

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    filterAccounts(e.target.value);
  });
}

// Fetch current user information from PHP backend - always show logged-in admin user
async function loadCurrentUser() {
  try {
    const response = await fetch('phpbackend/get_current_user.php');
    const data = await response.json();
    if (data.success) {
      const nameEl = document.getElementById('userName');
      const avatarEl = document.getElementById('userAvatar');
      // Use AccountName if available, otherwise fallback to username
      const displayName = data.name || data.username || 'User';
      if (nameEl && displayName) nameEl.textContent = displayName;
      if (data.initials && avatarEl) avatarEl.textContent = data.initials;
    } else {
      console.error('Error loading user info:', data.error);
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
}

// Load current user when page loads
document.addEventListener('DOMContentLoaded', loadCurrentUser);

// Modal functionality
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const cardsList = document.getElementById('cardsList');
const accountInfo = document.getElementById('accountInfo');
const modalAccountName = document.getElementById('modalAccountName');

// Close modal
function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Open modal
function openModal() {
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Event listeners for modal
if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    closeModal();
  }
});

// Fetch and display account cards
async function showAccountModal(accountID) {
  try {
    // Show loading state
    accountInfo.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';
    cardsList.innerHTML = '';
    openModal();
    
    const response = await fetch(`phpbackend/get_account_cards.php?account_id=${accountID}`);
    const data = await response.json();
    
    if (data.success) {
      // Display account info
      modalAccountName.textContent = `${data.account.name}'s Cards`;
      accountInfo.innerHTML = `
        <div class="account-details">
          <div class="detail-item">
            <span class="detail-label">Username:</span>
            <span class="detail-value">${data.account.username}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${data.account.email}</span>
          </div>
        </div>
      `;
      
      // Display cards
      if (data.cards && data.cards.length > 0) {
        cardsList.innerHTML = data.cards.map(card => {
          const formattedBalance = card.balance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          
          const cardTypeClass = card.type.toLowerCase() === 'credit' ? 'card-credit' : 'card-debit';
          
          return `
            <div class="card-item ${cardTypeClass}">
              <div class="card-header">
                <span class="card-type-badge">${card.type}</span>
                <span class="card-id">Card #${card.id}</span>
              </div>
              <div class="card-number-display">${formatCardNumber(card.number)}</div>
              <div class="card-balance">₱${formattedBalance}</div>
            </div>
          `;
        }).join('');
      } else {
        cardsList.innerHTML = '<div class="no-cards">No cards found for this account</div>';
      }
    } else {
      accountInfo.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444;">Error: ${data.error}</div>`;
      cardsList.innerHTML = '';
    }
  } catch (error) {
    console.error('Error fetching account cards:', error);
    accountInfo.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Error loading cards</div>';
    cardsList.innerHTML = '';
  }
}

// Format card number (show last 4 digits, match actual length)
function formatCardNumber(number) {
  const numStr = String(number);
  if (numStr.length <= 4) {
    return numStr;
  }
  
  // Get the last 4 digits
  const lastFour = numStr.slice(-4);
  const visibleLength = numStr.length - 4;
  
  // Create asterisks matching the actual length
  // Group by 4 digits for better readability
  let formatted = '';
  let remaining = visibleLength;
  
  while (remaining > 0) {
    if (remaining >= 4) {
      formatted += '**** ';
      remaining -= 4;
    } else {
      formatted += '*'.repeat(remaining);
      remaining = 0;
    }
  }
  
  return formatted.trim() + ' ' + lastFour;
}

