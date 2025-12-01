document.addEventListener("DOMContentLoaded", () => {

  const myAccountView = document.getElementById('myAccountView');
  const transactionView = document.getElementById('transactionHistoryView');
  const accountsContainer = document.getElementById('accountsContainer');
  const accountsNav = document.getElementById('accountsNav');
  let allTransactions = [];

  // Load account and transactions
  function loadAccountData() {
    fetch('get_account.php')
      .then(res => res.json())
      .then(data => {
        if(!data.success) return alert(data.message);

        // Update profile
        document.querySelector('.profile span').textContent = data.profile.AccountName;
        allTransactions = data.transactions;

        // Render cards
        accountsContainer.innerHTML = '';
        data.cards.forEach(card => {
          const cardHTML = document.createElement('div');
          cardHTML.classList.add('account-card');
          cardHTML.innerHTML = `
            <div class="account-info">
              <div class="account-icon">🏦</div>
              <div class="account-details">
                <p class="account-type">${card.CardType}</p>
                <p class="account-number">${card.CardNumber}</p>
                <p>Available Balance 
                  <span class="balance">PHP ${parseFloat(card.CardBalance).toLocaleString('en-PH',{minimumFractionDigits:2})}</span>
                </p>
              </div>
            </div>
          `;
          // Click card → show transactions
          cardHTML.addEventListener('click', () => {
            showTransactions(card.CardNumber); // pass card number to filter
          });
          accountsContainer.appendChild(cardHTML);
        });
      })
      .catch(err => console.error(err));
  }

  // Show transactions for selected card
  function showTransactions(cardNumber) {
    myAccountView.style.display = 'none';
    transactionView.style.display = 'block';

    const txList = document.querySelector('.transaction-list');
    txList.innerHTML = '';

    // Filter transactions related to this card
    const filteredTx = allTransactions.filter(tx => 
        tx.BankName === cardNumber // or use CardID if available
    );

    if (filteredTx.length === 0) {
        // Show no transactions message
        txList.innerHTML = `<p style="text-align:center; padding:20px; color:#555;">No transactions yet</p>`;
        return;
    }

    filteredTx.forEach(tx => {
        const amount = parseFloat(tx.TransactionAmount).toLocaleString('en-PH',{minimumFractionDigits:2});
        const isSent = tx.AccountIDSender == tx.AccountIDSender;
        const sign = isSent ? '-' : '+';

        const txHTML = document.createElement('div');
        txHTML.classList.add('transaction-item');
        txHTML.innerHTML = `
            <div class="trans-left">
                <span class="calendar">📅</span>
                <div>
                    <p class="date">${new Date(tx.TransactionDate).toLocaleDateString()}</p>
                    <p class="desc">${tx.TransactionActivity}<br>Ref: TX${tx.TransactionID} — ${new Date(tx.TransactionDate).toLocaleTimeString()}</p>
                </div>
            </div>
            <div class="trans-right">${sign}${amount}</div>
        `;
        txList.appendChild(txHTML);
    });
}


  // Navbar → back to accounts
  if(accountsNav){
    accountsNav.addEventListener('click',(e)=>{
      e.preventDefault();
      transactionView.style.display='none';
      myAccountView.style.display='block';
    });
  }


  const backToAccountsBtn = document.getElementById('backToAccounts');

  if(backToAccountsBtn){
    backToAccountsBtn.addEventListener('click', () => {
      transactionView.style.display = 'none';
      myAccountView.style.display = 'block';
    });
  }


  loadAccountData();
});
