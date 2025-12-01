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
    // Fetch all cards/accounts for this user
    $stmt = $conn->prepare("
        SELECT CardID AS AccountID, CardNumber, CardBalance, CardType
        FROM card
        WHERE AccountID = :id
    ");
    $stmt->bindParam(':id', $user_id);
    $stmt->execute();
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success'=>true,'accounts'=>$cards]);

} catch(PDOException $e) {
    echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
?>
