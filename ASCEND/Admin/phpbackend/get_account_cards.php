<?php
header('Content-Type: application/json');
require '../../db_connect.php';

// Get AccountID from request
$accountID = isset($_GET['account_id']) ? intval($_GET['account_id']) : 0;

if ($accountID <= 0) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid Account ID'
    ]);
    exit();
}

try {
    // Get account info
    $stmt = $conn->prepare("SELECT AccountID, AccountName, AccountEmail, AccountUsername FROM accounts WHERE AccountID = :accountID");
    $stmt->bindParam(':accountID', $accountID);
    $stmt->execute();
    $account = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$account) {
        echo json_encode([
            'success' => false,
            'error' => 'Account not found'
        ]);
        exit();
    }
    
    // Get all cards for this account
    $stmt = $conn->prepare("
        SELECT 
            CardID,
            CardNumber,
            CardBalance,
            CardType,
            AccountID
        FROM card
        WHERE AccountID = :accountID
        ORDER BY CardID ASC
    ");
    $stmt->bindParam(':accountID', $accountID);
    $stmt->execute();
    
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the cards for frontend
    $formattedCards = [];
    foreach ($cards as $card) {
        $formattedCards[] = [
            'id' => $card['CardID'],
            'number' => $card['CardNumber'],
            'balance' => floatval($card['CardBalance']),
            'type' => $card['CardType'] ?? 'Debit'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'account' => [
            'id' => $account['AccountID'],
            'name' => $account['AccountName'],
            'email' => $account['AccountEmail'],
            'username' => $account['AccountUsername']
        ],
        'cards' => $formattedCards
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>

