<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

if (!isset($_SESSION['AccountID'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$from = $data['fromCardID'];
$recipientCardNum = $data['recipientCardNumber']; // input card number
$recipientName = $data['recipientName'];
$amount = $data['amount'];
$remarks = $data['remarks'] ?? '';

if (!$from || !$recipientCardNum || !$recipientName || !$amount || $amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

try {
    $conn->beginTransaction();

    // Lock sender balance
    $stmt = $conn->prepare("SELECT CardBalance FROM card WHERE CardID = :id FOR UPDATE");
    $stmt->bindParam(':id', $from);
    $stmt->execute();
    $senderBalance = $stmt->fetchColumn();

    if ($senderBalance === false || $senderBalance < $amount) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => 'Insufficient balance']);
        exit;
    }

    // Validate recipient card
    $stmt = $conn->prepare("
        SELECT card.CardID, card.CardNumber, accounts.AccountName
        FROM card 
        INNER JOIN accounts ON card.AccountID = accounts.AccountID
        WHERE card.CardNumber = :cardNum
    ");
    $stmt->bindParam(':cardNum', $recipientCardNum);
    $stmt->execute();
    $recipient = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$recipient) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => 'Recipient not found']);
        exit;
    }

    $recipientCardID = $recipient['CardID'];
    $recipientCardNumber = $recipient['CardNumber']; // ✔ use this
    $recipientOwnerName = $recipient['AccountName'];

    // Update balances
    $stmt = $conn->prepare("UPDATE card SET CardBalance = CardBalance - :amt WHERE CardID = :id");
    $stmt->bindParam(':amt', $amount);
    $stmt->bindParam(':id', $from);
    $stmt->execute();

    $stmt = $conn->prepare("UPDATE card SET CardBalance = CardBalance + :amt WHERE CardID = :id");
    $stmt->bindParam(':amt', $amount);
    $stmt->bindParam(':id', $recipientCardID);
    $stmt->execute();

    // Insert transaction log (receiver = CARD NUMBER)
    $stmt = $conn->prepare("
        INSERT INTO transaction 
        (TransactionActivity, TransactionAmount, CardIDSender, AccountIDReciever, BankName, TransactionRemarks, TransactionDate, RecieverName)
        VALUES ('Send to ASCEND', :amt, :sender, :receiverCardNum, 'ASCEND', :remarks, NOW(), :recName)
    ");
    $stmt->bindParam(':amt', $amount);
    $stmt->bindParam(':sender', $from);
    $stmt->bindParam(':receiverCardNum', $recipientCardNumber); // ✔ CORRECT: store card number
    $stmt->bindParam(':remarks', $remarks);
    $stmt->bindParam(':recName', $recipientOwnerName);
    $stmt->execute();

    $conn->commit();

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
