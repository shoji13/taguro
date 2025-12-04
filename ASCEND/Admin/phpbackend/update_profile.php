<?php
session_start();
header('Content-Type: application/json');
require '../../db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['AccountID'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Not logged in'
    ]);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid input'
    ]);
    exit();
}

$accountID = $_SESSION['AccountID'];
$fullName = isset($input['fullName']) ? trim($input['fullName']) : '';
$username = isset($input['username']) ? trim($input['username']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';

// Validate inputs
if (empty($fullName) || empty($username) || empty($email)) {
    echo json_encode([
        'success' => false,
        'error' => 'All fields are required'
    ]);
    exit();
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid email format'
    ]);
    exit();
}

try {
    // Check if username is already taken by another user
    $stmt = $conn->prepare("
        SELECT AccountID 
        FROM accounts 
        WHERE AccountUsername = :username AND AccountID != :accountID
    ");
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':accountID', $accountID, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'error' => 'Username already taken'
        ]);
        exit();
    }

    // Check if email is already taken by another user
    $stmt = $conn->prepare("
        SELECT AccountID 
        FROM accounts 
        WHERE AccountEmail = :email AND AccountID != :accountID
    ");
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':accountID', $accountID, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'error' => 'Email already taken'
        ]);
        exit();
    }

    // Update profile
    $stmt = $conn->prepare("
        UPDATE accounts 
        SET AccountName = :fullName,
            AccountUsername = :username,
            AccountEmail = :email
        WHERE AccountID = :accountID
    ");
    $stmt->bindParam(':fullName', $fullName);
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':accountID', $accountID, PDO::PARAM_INT);
    $stmt->execute();

    // Update session variables
    $_SESSION['AccountName'] = $fullName;
    $_SESSION['AccountUsername'] = $username;
    $_SESSION['AccountEmail'] = $email;

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>

