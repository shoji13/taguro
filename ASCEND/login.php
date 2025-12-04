<?php
session_start();
require 'db_connect.php'; // same folder

// Check if form is submitted
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);

    // Prepare SQL statement
    $stmt = $conn->prepare("SELECT * FROM accounts WHERE AccountUsername = :username LIMIT 1");
    $stmt->bindParam(":username", $username);
    $stmt->execute();

    if ($stmt->rowCount() === 1) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // If password is NOT hashed, use simple comparison:
        if ($password === $user['AccountPassword']) {

            // Save session
            $_SESSION['AccountID'] = $user['AccountID'];
            $_SESSION['AccountName'] = $user['AccountName'];
            $_SESSION['AccountUsername'] = $user['AccountUsername'];
            $_SESSION['AccountRole'] = $user['AccountRole'];

            // Redirect by role
            if ($user['AccountRole'] === "Admin") {
                header("Location: Admin/dashboard.html");
                exit();
            } elseif ($user['AccountRole'] === "User") {
                header("Location: user/home.html");
                exit();
            } else {
                echo "Unknown role!";
                exit();
            }

        } else {
            echo "<script>alert('Incorrect password'); window.history.back();</script>";
            exit();
        }

    } else {
        echo "<script>alert('Username not found'); window.history.back();</script>";
        exit();
    }

} else {
    echo "Invalid request.";
}
?>
