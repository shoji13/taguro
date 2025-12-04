<?php
header('Content-Type: application/json');
require '../../db_connect.php';

try {
    // Get the sum of all CardBalance from the card table
    $stmt = $conn->prepare("SELECT COALESCE(SUM(CardBalance), 0) as total_balance FROM card");
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Return the total balance
    echo json_encode([
        'success' => true,
        'available_balance' => floatval($result['total_balance'])
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>

