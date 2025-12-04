<?php
header('Content-Type: application/json');
require '../../db_connect.php';

try {
    // Get year and transaction type from query parameters
    $year = isset($_GET['year']) ? intval($_GET['year']) : null;
    $transactionType = isset($_GET['transactionType']) && trim($_GET['transactionType']) !== '' ? trim($_GET['transactionType']) : null;
    
    // Build WHERE clause
    $whereClause = [];
    $params = [];
    
    if ($year && $year > 0) {
        // Filter by specific year
        $whereClause[] = "YEAR(TransactionDate) = :year";
        $params[':year'] = $year;
    } else {
        // Default to current year if no year specified
        $currentYear = date('Y');
        $whereClause[] = "YEAR(TransactionDate) = :year";
        $params[':year'] = $currentYear;
    }
    
    // Handle transaction type filter (Deposit, Transfer, Withdraw)
    if ($transactionType) {
        $transactionTypeUpper = strtoupper(trim($transactionType));
        
        // Use LIKE for partial matching to handle variations in activity names
        if ($transactionTypeUpper === 'DEPOSIT') {
            // Match deposit-related activities
            $whereClause[] = "(UPPER(TRIM(TransactionActivity)) LIKE '%DEPOSIT%' 
                             OR UPPER(TRIM(TransactionActivity)) LIKE '%RECEIVE%' 
                             OR UPPER(TRIM(TransactionActivity)) LIKE '%CREDIT%')";
        } elseif ($transactionTypeUpper === 'WITHDRAW') {
            // Match withdraw-related activities  
            $whereClause[] = "(UPPER(TRIM(TransactionActivity)) LIKE '%WITHDRAW%' 
                             OR UPPER(TRIM(TransactionActivity)) LIKE '%DEBIT%' 
                             OR UPPER(TRIM(TransactionActivity)) LIKE '%SEND%' 
                             OR UPPER(TRIM(TransactionActivity)) LIKE '%PAY%')";
        } elseif ($transactionTypeUpper === 'TRANSFER') {
            // Match transfer activities (exact or partial)
            $whereClause[] = "UPPER(TRIM(TransactionActivity)) LIKE '%TRANSFER%'";
        } else {
            // Fallback: try exact match
            $whereClause[] = "UPPER(TRIM(TransactionActivity)) = :transactionType";
            $params[':transactionType'] = $transactionTypeUpper;
        }
    }
    
    $whereSQL = !empty($whereClause) ? 'WHERE ' . implode(' AND ', $whereClause) : '';
    
    // Get transaction counts and amounts grouped by month
    $sql = "SELECT 
        DATE_FORMAT(TransactionDate, '%Y-%m') as month,
        DATE_FORMAT(TransactionDate, '%b') as month_name,
        COUNT(*) as transaction_count,
        SUM(TransactionAmount) as total_amount
    FROM transaction
    $whereSQL
    GROUP BY DATE_FORMAT(TransactionDate, '%Y-%m'), DATE_FORMAT(TransactionDate, '%b')
    ORDER BY month ASC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Create a map of all 12 months
    $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    $monthlyData = [];
    
    // Initialize all months with 0
    foreach ($months as $month) {
        $monthlyData[$month] = [
            'count' => 0,
            'amount' => 0
        ];
    }
    
    // Fill in actual data
    foreach ($results as $row) {
        $monthName = $row['month_name'];
        if (isset($monthlyData[$monthName])) {
            $monthlyData[$monthName] = [
                'count' => intval($row['transaction_count']),
                'amount' => floatval($row['total_amount'])
            ];
        }
    }
    
    // Find max count for scaling
    $maxCount = 0;
    foreach ($monthlyData as $data) {
        if ($data['count'] > $maxCount) {
            $maxCount = $data['count'];
        }
    }
    
    // If no transactions, set a default max
    if ($maxCount === 0) {
        $maxCount = 100;
    }
    
    echo json_encode([
        'success' => true,
        'monthlyData' => $monthlyData,
        'maxCount' => $maxCount
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>

