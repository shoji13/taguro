<?php
header('Content-Type: application/json');
require '../../db_connect.php';

try {
    // Get recent transactions with account names
    // The transaction table uses CardIDSender and joins through card table
    // Also check for AccountIDReciever if it exists
    $stmt = $conn->prepare("
        SELECT 
            t.TransactionID,
            t.TransactionActivity,
            t.TransactionAmount,
            t.TransactionDate,
            t.CardIDSender,
            t.AccountIDReciever,
            senderCard.AccountID as SenderAccountID,
            sender.AccountName as SenderName,
            receiver.AccountName as ReceiverName
        FROM transaction t
        LEFT JOIN card senderCard ON t.CardIDSender = senderCard.CardID
        LEFT JOIN accounts sender ON senderCard.AccountID = sender.AccountID
        LEFT JOIN accounts receiver ON t.AccountIDReciever = receiver.AccountID
        ORDER BY t.TransactionDate DESC
        LIMIT 6
    ");
    $stmt->execute();
    
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the transactions for frontend
    $formattedTransactions = [];
    foreach ($transactions as $tx) {
        // Determine if it's a deposit or withdrawal
        // If TransactionActivity contains keywords, use that, otherwise determine by amount direction
        $activity = strtolower($tx['TransactionActivity'] ?? '');
        $isDeposit = false;
        $displayName = '';
        
        // Determine transaction type and display name
        if (strpos($activity, 'deposit') !== false || strpos($activity, 'receive') !== false || strpos($activity, 'credit') !== false) {
            $isDeposit = true;
            $displayName = $tx['ReceiverName'] ?: ($tx['SenderName'] ?: 'System');
        } elseif (strpos($activity, 'withdraw') !== false || strpos($activity, 'send') !== false || strpos($activity, 'debit') !== false || strpos($activity, 'pay') !== false) {
            $isDeposit = false;
            $displayName = $tx['SenderName'] ?: 'System';
        } else {
            // Default: if there's a receiver, it's a deposit; if there's a sender, it's a withdrawal
            if ($tx['AccountIDReciever'] && !$tx['SenderAccountID']) {
                $isDeposit = true;
                $displayName = $tx['ReceiverName'] ?: 'System';
            } else {
                $isDeposit = false;
                $displayName = $tx['SenderName'] ?: 'System';
            }
        }
        
        // Get first letter of name for avatar
        $initial = !empty($displayName) ? strtoupper(substr($displayName, 0, 1)) : '?';
        
        // Format date
        $date = date('M d, Y', strtotime($tx['TransactionDate']));
        
        $formattedTransactions[] = [
            'id' => $tx['TransactionID'],
            'name' => $displayName,
            'initial' => $initial,
            'date' => $date,
            'amount' => floatval($tx['TransactionAmount']),
            'isDeposit' => $isDeposit,
            'activity' => $tx['TransactionActivity']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'transactions' => $formattedTransactions
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
