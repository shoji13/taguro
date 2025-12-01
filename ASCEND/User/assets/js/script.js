// Get elements
const logoutBtn = document.getElementById('logoutBtn');
const myAccountView = document.getElementById('myAccountView');
const transactionView = document.getElementById('transactionHistoryView');
const accountCard = document.getElementById('accountCard');
const accountsNav = document.getElementById('accountsNav');

// Logout alert
logoutBtn.addEventListener('click', () => {
  alert('You have been logged out successfully!');
});


// Dropdown toggle logic
const dropdown = document.querySelector('.dropdown');
const dropbtn = dropdown.querySelector('.dropbtn');

// Toggle dropdown on click
dropbtn.addEventListener('click', (e) => {
  e.preventDefault();
  dropdown.classList.toggle('active');
});

// Close when clicking outside
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

// Close when clicking an item inside dropdown
document.querySelectorAll('.dropdown-content a').forEach(link => {
  link.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });
});



// Click account card → show transaction history
accountCard.addEventListener('click', () => {
  myAccountView.style.display = 'none';
  transactionView.style.display = 'block';
});

// Click "Accounts" in navbar → back to My Account
accountsNav.addEventListener('click', (e) => {
  e.preventDefault();
  transactionView.style.display = 'none';
  myAccountView.style.display = 'block';
});
