<?php
header('Content-Type: application/json');
require '../../db_connect.php';

try {
    // Get all accounts with their total balance from cards
    $stmt = $conn->prepare("
        SELECT 
            a.AccountID,
            a.AccountName,
            a.AccountEmail,
            a.AccountUsername,
            a.AccountRole,
            COALESCE(SUM(c.CardBalance), 0) as TotalBalance
        FROM accounts a
        LEFT JOIN card c ON a.AccountID = c.AccountID
        WHERE a.AccountRole = 'User'
        GROUP BY a.AccountID, a.AccountName, a.AccountEmail, a.AccountUsername, a.AccountRole
        ORDER BY a.AccountName ASC
    ");
    $stmt->execute();
    
    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the accounts for frontend
    $formattedAccounts = [];
    foreach ($accounts as $account) {
        $formattedAccounts[] = [
            'id' => $account['AccountID'],
            'name' => $account['AccountName'],
            'email' => $account['AccountEmail'],
            'username' => $account['AccountUsername'],
            'balance' => floatval($account['TotalBalance'])
        ];
    }
    
    echo json_encode([
        'success' => true,
        'accounts' => $formattedAccounts
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>

