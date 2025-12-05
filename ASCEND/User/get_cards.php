<?php
session_start();
header('Content-Type: application/json');
require '../db_connect.php';

if (!isset($_SESSION['AccountID'])) {
    echo json_encode([]); // no account logged in
    exit;
}

$accountID = $_SESSION['AccountID'];

// Fetch cards owned by this account along with account holder name
$stmt = $conn->prepare("
    SELECT c.CardID, c.CardNumber, c.CardBalance, a.AccountName
    FROM card c
    INNER JOIN accounts a ON c.AccountID = a.AccountID
    WHERE c.AccountID = :id
");
$stmt->bindParam(':id', $accountID);
$stmt->execute();
$cards = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($cards);
?>
