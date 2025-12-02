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
    $stmt->bindParam(':id', $user_id);
    $stmt->execute();
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    // Fetch user's cards
    $stmt_cards = $conn->prepare("
        SELECT CardID, CardNumber, CardBalance, CardType
        FROM card
        WHERE AccountID = :id
    ");
    $stmt_cards->bindParam(':id', $user_id);
    $stmt_cards->execute();
    $cards = $stmt_cards->fetchAll(PDO::FETCH_ASSOC);

    // Fetch all transactions related to the user's cards
    $transactions = [];
    if (count($cards) > 0) {
        $cardIDs = array_column($cards, 'CardID');
        $cardNumbers = array_column($cards, 'CardNumber');

        $placeholdersID = implode(',', array_fill(0, count($cardIDs), '?'));
        $placeholdersNum = implode(',', array_fill(0, count($cardNumbers), '?'));

        $stmt_tx = $conn->prepare("
            SELECT TransactionID, TransactionActivity, TransactionAmount, 
                   CardIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate, RecieverName
            FROM transaction
            WHERE CardIDSender IN ($placeholdersID)
               OR AccountIDReciever IN ($placeholdersNum)
            ORDER BY TransactionDate DESC
        ");

        $params = array_merge($cardIDs, $cardNumbers);
        $stmt_tx->execute($params);
        $transactions = $stmt_tx->fetchAll(PDO::FETCH_ASSOC);
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
?>
