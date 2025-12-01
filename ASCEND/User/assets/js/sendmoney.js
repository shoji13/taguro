const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', () => {
  alert('You have been logged out successfully!');
});

// Dropdown toggle
const dropdown = document.querySelector('.dropdown');
const dropbtn = dropdown.querySelector('.dropbtn');
dropbtn.addEventListener('click', e => {
  e.preventDefault();
  dropdown.classList.toggle('active');
});
document.addEventListener('click', e => {
  if (!dropdown.contains(e.target)) dropdown.classList.remove('active');
});
document.querySelectorAll('.dropdown-content a').forEach(link => {
  link.addEventListener('click', () => dropdown.classList.remove('active'));
});

function showSection(section) {
  const sections = {
    own: "ownAccountSection",
    ascend: "ascendAccountSection",
    otherBanks: "otherBanksSection"
  };
  Object.values(sections).forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById(sections[section]).classList.remove("hidden");
}

// Fetch user accounts and populate dropdowns
let userAccounts = [];

async function loadAccounts() {
  const res = await fetch('get_user_accounts.php');
  const data = await res.json(); // get the JSON object

  if (!data.success) {
    alert(data.message);
    return;
  }

  userAccounts = data.accounts; // <- get the actual array

  if (userAccounts.length <= 1) {
    document.getElementById("ownAccountSection").style.display = 'none';
  }

  ['ownFromAccount','ascendFromAccount','otherFromAccount'].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '';
    userAccounts.forEach(acc => {
      const option = document.createElement('option');
      option.value = acc.AccountID;
      option.text = `${acc.CardType} ${acc.CardNumber} (PHP ${parseFloat(acc.CardBalance).toLocaleString('en-PH',{minimumFractionDigits:2})})`;
      option.dataset.balance = acc.CardBalance;
      select.appendChild(option);
    });
  });
}


loadAccounts();

// Handle "Own Account" form submission
document.getElementById('ownAccountForm').addEventListener('submit', async e => {
  e.preventDefault();

  const from = document.getElementById('ownFromAccount').value;
  const to = document.getElementById('ownToAccount').value;
  const amount = parseFloat(document.getElementById('ownAmount').value);
  const remarks = document.querySelector("#ownAccountForm input[placeholder='Add Note']").value;

  if (!from || !to || !amount || amount <= 0) return alert("Please fill all fields correctly.");
  if (from === to) return alert("Cannot transfer to the same account.");

  try {
    const res = await fetch('send_money.php', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromAccountID: from, toAccountID: to, amount, remarks })
    });

    const result = await res.json();
    if (result.success) {
      alert('Transaction successful!');

      // Update balances immediately
      const fromOption = document.querySelector(`#ownFromAccount option[value='${from}']`);
      const toOption = document.querySelector(`#ownToAccount option[value='${to}']`);

      let newFromBalance = parseFloat(fromOption.dataset.balance) - amount;
      let newToBalance = parseFloat(toOption.dataset.balance) + amount;

      fromOption.dataset.balance = newFromBalance;
      fromOption.text = `${fromOption.text.split(' (')[0]} (PHP ${newFromBalance.toLocaleString('en-PH', {minimumFractionDigits:2})})`;

      toOption.dataset.balance = newToBalance;
      toOption.text = `${toOption.text.split(' (')[0]} (PHP ${newToBalance.toLocaleString('en-PH', {minimumFractionDigits:2})})`;

      document.getElementById('ownAmount').value = '';
      document.querySelector("#ownAccountForm input[placeholder='Add Note']").value = '';
    } else {
      alert('Transaction failed: ' + result.message);
    }

  } catch(err) {
    alert('Transaction error: ' + err.message);
  }
});

// Populate From and To accounts
function populateOwnAccounts() {
  const fromSelect = document.getElementById('ownFromAccount');
  const toSelect = document.getElementById('ownToAccount');

  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';

  userAccounts.forEach(acc => {
    // From account options
    const optionFrom = document.createElement('option');
    optionFrom.value = acc.AccountID;
    optionFrom.text = `${acc.CardType} ${acc.CardNumber} (PHP ${parseFloat(acc.CardBalance).toLocaleString('en-PH', {minimumFractionDigits:2})})`;
    optionFrom.dataset.balance = acc.CardBalance;
    fromSelect.appendChild(optionFrom);
  });

  function updateToAccounts() {
    const selectedFrom = fromSelect.value;
    toSelect.innerHTML = '';

    userAccounts
      .filter(acc => acc.AccountID !== selectedFrom)
      .forEach(acc => {
        const optionTo = document.createElement('option');
        optionTo.value = acc.AccountID; // still use AccountID to identify
        // Show CardNumber prominently
        optionTo.text = `Card: ${acc.CardNumber} (${acc.CardType}) - Balance: PHP ${parseFloat(acc.CardBalance).toLocaleString('en-PH', {minimumFractionDigits:2})}`;
        optionTo.dataset.balance = acc.CardBalance;
        toSelect.appendChild(optionTo);
      });
  }

  updateToAccounts();
  fromSelect.addEventListener('change', updateToAccounts);
}

// Initialize after loading accounts
loadAccounts().then(() => populateOwnAccounts());
