const logoutBtn = document.getElementById('logoutBtn');
const transferForm = document.getElementById('transferForm');
const amountInput = document.getElementById('amountInput');

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

function showSection(section) {
  const sections = {
    own: "ownAccountSection",
    ascend: "ascendAccountSection",
    otherBanks: "otherBanksSection"
  };

  Object.values(sections).forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });

  document.getElementById(sections[section]).classList.remove("hidden");
}


// Handle form submission
transferForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const amount = amountInput.value.trim();
  if (amount === "" || isNaN(amount)) {
    alert("Please enter a valid amount.");
    return;
  }

  alert(`You have successfully transferred PHP ${parseFloat(amount).toFixed(2)} to your Checking account.`);
  transferForm.reset();
});
