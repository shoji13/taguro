<?php
header('Content-Type: application/json');
require '../../db_connect.php';

try {
    // Calculate total deposit and withdraw
    // Use case-insensitive matching to handle variations in TransactionActivity values
    // Try 'transaction' table (singular) first as used in get_transaction_reports.php
    
    $totalDeposit = 0;
    $totalWithdraw = 0;
    
    // Try 'transaction' (singular) first - this is what reports use
    try {
        $stmtDeposit = $conn->prepare("
            SELECT COALESCE(SUM(TransactionAmount), 0) as total_deposit
            FROM transaction
            WHERE UPPER(TRIM(TransactionActivity)) = 'DEPOSIT'
        ");
        $stmtDeposit->execute();
        $depositResult = $stmtDeposit->fetch(PDO::FETCH_ASSOC);
        $totalDeposit = floatval($depositResult['total_deposit']);
        
        $stmtWithdraw = $conn->prepare("
            SELECT COALESCE(SUM(TransactionAmount), 0) as total_withdraw
            FROM transaction
            WHERE UPPER(TRIM(TransactionActivity)) = 'WITHDRAW'
        ");
        $stmtWithdraw->execute();
        $withdrawResult = $stmtWithdraw->fetch(PDO::FETCH_ASSOC);
        $totalWithdraw = floatval($withdrawResult['total_withdraw']);
    } catch (PDOException $e1) {
        // If 'transaction' fails, try 'transactions' (plural)
        try {
            $stmtDeposit = $conn->prepare("
                SELECT COALESCE(SUM(TransactionAmount), 0) as total_deposit
                FROM transactions
                WHERE UPPER(TRIM(TransactionActivity)) = 'DEPOSIT'
            ");
            $stmtDeposit->execute();
            $depositResult = $stmtDeposit->fetch(PDO::FETCH_ASSOC);
            $totalDeposit = floatval($depositResult['total_deposit']);
            
            $stmtWithdraw = $conn->prepare("
                SELECT COALESCE(SUM(TransactionAmount), 0) as total_withdraw
                FROM transactions
                WHERE UPPER(TRIM(TransactionActivity)) = 'WITHDRAW'
            ");
            $stmtWithdraw->execute();
            $withdrawResult = $stmtWithdraw->fetch(PDO::FETCH_ASSOC);
            $totalWithdraw = floatval($withdrawResult['total_withdraw']);
        } catch (PDOException $e2) {
            throw new Exception("Could not find transaction table. Error: " . $e2->getMessage());
        }
    }
    
    echo json_encode([
        'success' => true,
        'total_deposit' => $totalDeposit,
        'total_withdraw' => $totalWithdraw
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
