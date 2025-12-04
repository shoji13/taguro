 const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const app = document.querySelector('.app');
    if(menuBtn){
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('minimized');
        app.classList.toggle('sidebar-minimized');
      });
    }

    // Load current user (name + initials) into toolbar - always show logged-in admin user
    async function loadCurrentUserToolbar() {
      try {
        const response = await fetch('phpbackend/get_current_user.php');
        const data = await response.json();
        if (data.success) {
          const nameEl = document.getElementById('userName');
          const avatarEl = document.getElementById('userAvatar');
          // Use AccountName if available, otherwise fallback to username
          const displayName = data.name || data.username || 'User';
          if (nameEl) nameEl.textContent = displayName;
          if (data.initials && avatarEl) avatarEl.textContent = data.initials;
        }
      } catch (e) {
        console.error('Error loading toolbar user:', e);
      }
    }

    document.addEventListener('DOMContentLoaded', loadCurrentUserToolbar);

    // Fetch available balance from PHP backend
    async function loadAvailableBalance() {
      try {
        const response = await fetch('phpbackend/get_available_balance.php');
        const data = await response.json();
        
        if (data.success) {
          const balance = parseFloat(data.available_balance);
          const formattedBalance = balance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          document.getElementById('availableBalance').textContent = `₱${formattedBalance}`;
        } else {
          console.error('Error loading balance:', data.error);
          document.getElementById('availableBalance').textContent = '₱0.00';
        }
      } catch (error) {
        console.error('Error fetching available balance:', error);
        document.getElementById('availableBalance').textContent = '₱0.00';
      }
    }

    // Load balance when page loads
    loadAvailableBalance();

    // Fetch transactions from PHP backend
    async function loadTransactions() {
      try {
        const response = await fetch('phpbackend/get_transactions.php');
        const data = await response.json();
        
        if (data.success && data.transactions) {
          const container = document.getElementById('transactionsContainer');
          container.innerHTML = ''; // Clear existing content
          
          if (data.transactions.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No transactions found</div>';
            return;
          }
          
          // Limit to 6 most recent transactions
          const recentTransactions = data.transactions.slice(0, 6);
          
          recentTransactions.forEach(tx => {
            const txElement = document.createElement('div');
            txElement.className = 'tx';
            
            const formattedAmount = tx.amount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            
            const amountClass = tx.isDeposit ? 'plus' : 'minus';
            const amountSign = tx.isDeposit ? '+' : '-';
            
            txElement.innerHTML = `
              <div class="pfp">${tx.initial}</div>
              <div class="meta">
                <div class="name">${tx.name}</div>
                <div class="date">${tx.date}</div>
              </div>
              <div class="amt ${amountClass}">${amountSign}₱${formattedAmount}</div>
            `;
            
            container.appendChild(txElement);
          });
        } else {
          console.error('Error loading transactions:', data.error);
          document.getElementById('transactionsContainer').innerHTML = 
            '<div style="text-align: center; padding: 20px; color: #666;">Error loading transactions</div>';
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        document.getElementById('transactionsContainer').innerHTML = 
          '<div style="text-align: center; padding: 20px; color: #666;">Error loading transactions</div>';
      }
    }

    // Load transactions when page loads
    loadTransactions();

    // Fetch accounts count from PHP backend
    async function loadAccountsCount() {
      try {
        const response = await fetch('phpbackend/get_accounts_count.php');
        const data = await response.json();
        
        if (data.success) {
          document.getElementById('activeAccountsCount').textContent = data.total_accounts;
        } else {
          console.error('Error loading accounts count:', data.error);
          document.getElementById('activeAccountsCount').textContent = '0';
        }
      } catch (error) {
        console.error('Error fetching accounts count:', error);
        document.getElementById('activeAccountsCount').textContent = '0';
      }
    }

    // Load accounts count when page loads
    loadAccountsCount();

    // Fetch cards count from PHP backend
    async function loadCardsCount() {
      try {
        const response = await fetch('phpbackend/get_cards_count.php');
        const data = await response.json();
        
        if (data.success) {
          document.getElementById('cardsCount').textContent = data.total_cards;
        } else {
          console.error('Error loading cards count:', data.error);
          document.getElementById('cardsCount').textContent = '0';
        }
      } catch (error) {
        console.error('Error fetching cards count:', error);
        document.getElementById('cardsCount').textContent = '0';
      }
    }

    // Load cards count when page loads
    loadCardsCount();

    // Fetch transaction totals (Deposit and Withdraw) from PHP backend
    async function loadTransactionTotals() {
      try {
        const response = await fetch('phpbackend/get_transaction_totals.php');
        const data = await response.json();
        
        if (data.success) {
          // Format and display total deposit
          const totalDeposit = parseFloat(data.total_deposit);
          const formattedDeposit = totalDeposit.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          const depositEl = document.getElementById('totalDeposit');
          if (depositEl) {
            depositEl.textContent = `₱${formattedDeposit}`;
          }
          
          // Format and display total withdraw
          const totalWithdraw = parseFloat(data.total_withdraw);
          const formattedWithdraw = totalWithdraw.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          const withdrawEl = document.getElementById('totalWithdraw');
          if (withdrawEl) {
            withdrawEl.textContent = `₱${formattedWithdraw}`;
          }
          
          // Update donut chart with real data
          updateDonutChart(totalDeposit, totalWithdraw);
        } else {
          console.error('Error loading transaction totals:', data.error);
          const depositEl = document.getElementById('totalDeposit');
          const withdrawEl = document.getElementById('totalWithdraw');
          if (depositEl) depositEl.textContent = '₱0.00';
          if (withdrawEl) withdrawEl.textContent = '₱0.00';
          updateDonutChart(0, 0);
        }
      } catch (error) {
        console.error('Error fetching transaction totals:', error);
        const depositEl = document.getElementById('totalDeposit');
        const withdrawEl = document.getElementById('totalWithdraw');
        if (depositEl) depositEl.textContent = '₱0.00';
        if (withdrawEl) withdrawEl.textContent = '₱0.00';
        updateDonutChart(0, 0);
      }
    }

    // Update donut chart based on deposit and withdraw totals
    function updateDonutChart(deposit, withdraw) {
      const pieElement = document.querySelector('.pie');
      if (!pieElement) return;
      
      const total = deposit + withdraw;
      
      // If no transactions, show empty state
      if (total === 0) {
        pieElement.style.background = 'conic-gradient(#ffd2a9 0 100%)';
        return;
      }
      
      // Calculate percentages
      const depositPercent = (deposit / total) * 100;
      const withdrawPercent = (withdraw / total) * 100;
      
      // Update the conic gradient based on actual percentages
      // Deposits: #ff8a3d (darker orange)
      // Withdrawals: #ffd2a9 (lighter orange)
      pieElement.style.background = `conic-gradient(#ff8a3d 0 ${depositPercent}%, #ffd2a9 ${depositPercent}% 100%)`;
    }

    // Load transaction totals when page loads
    loadTransactionTotals();

    // Fetch current user information from PHP backend
    async function loadCurrentUser() {
      try {
        const response = await fetch('phpbackend/get_current_user.php');
        const data = await response.json();
        
        if (data.success) {
          // Update display name - use AccountName if available, otherwise username
          const displayName = data.name || data.username || 'User';
          const nameEl = document.getElementById('userName');
          if (nameEl && displayName) {
            nameEl.textContent = displayName;
          }
          
          // Update avatar initials
          if (data.initials) {
            const avatarEl = document.getElementById('userAvatar');
            if (avatarEl) {
              avatarEl.textContent = data.initials;
            }
          }
        } else {
          console.error('Error loading user info:', data.error);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    }

    // Load current user when page loads
    loadCurrentUser();