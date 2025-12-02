<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

if (!isset($_SESSION['AccountID'])) {
    echo json_encode(['success'=>false,'message'=>'User not logged in']);
    exit;
}

$user_id = $_SESSION['AccountID'];

try {
    // Fetch profile
    $stmt = $conn->prepare("
        SELECT AccountID, AccountName, AccountEmail, AccountUsername, AccountRole
        FROM accounts
        WHERE AccountID = :id
    ");
    $stmt->bindParam(':id',$user_id);
    $stmt->execute();
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    // Fetch user's cards
    $stmt_cards = $conn->prepare("
        SELECT CardID, CardNumber, CardBalance, CardType
        FROM card
        WHERE AccountID = :id
    ");
    $stmt_cards->bindParam(':id',$user_id);
    $stmt_cards->execute();
    $cards = $stmt_cards->fetchAll(PDO::FETCH_ASSOC);

    // Convert card list to array of IDs
    $cardIDs = array_column($cards, 'CardID');

    if (count($cardIDs) > 0) {
        // Prepare placeholders (?, ?, ?)
        $placeholders = implode(',', array_fill(0, count($cardIDs), '?'));

        // Fetch ALL related transactions
        $stmt_tx = $conn->prepare("
            SELECT TransactionID, TransactionActivity, TransactionAmount, 
                   CardIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate
            FROM transaction
            WHERE CardIDSender IN ($placeholders)
               OR AccountIDReciever = ?
            ORDER BY TransactionDate DESC
        ");
        
        // Merge cardIDs and user_id (for AccountIDReciever)
        $params = array_merge($cardIDs, [$user_id]);
        $stmt_tx->execute($params);
        $transactions = $stmt_tx->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $transactions = [];
    }

    echo json_encode([
        'success' => true,
        'profile' => $account,
        'cards' => $cards,
        'transactions' => $transactions
    ]);

} catch(PDOException $e) {
    echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
