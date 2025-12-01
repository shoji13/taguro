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
    // Fetch account info
    $stmt = $conn->prepare("
        SELECT AccountID, AccountName, AccountEmail, AccountUsername, AccountRole
        FROM accounts
        WHERE AccountID = :id
    ");
    $stmt->bindParam(':id',$user_id);
    $stmt->execute();
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    // Fetch all cards
    $stmt_cards = $conn->prepare("
        SELECT CardID, CardNumber, CardBalance, CardType
        FROM card
        WHERE AccountID = :id
    ");
    $stmt_cards->bindParam(':id',$user_id);
    $stmt_cards->execute();
    $cards = $stmt_cards->fetchAll(PDO::FETCH_ASSOC);

    // Fetch all transactions for this account
    $stmt_tx = $conn->prepare("
        SELECT TransactionID, TransactionActivity, TransactionAmount, AccountIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate
        FROM transaction
        WHERE AccountIDSender = :id OR AccountIDReciever = :id
        ORDER BY TransactionDate DESC
    ");
    $stmt_tx->bindParam(':id',$user_id);
    $stmt_tx->execute();
    $transactions = $stmt_tx->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'=>true,
        'profile'=>$account,
        'cards'=>$cards,
        'transactions'=>$transactions
    ]);

} catch(PDOException $e) {
    echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
?>
