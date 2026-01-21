<?php
require_once '../config.php';

session_start();

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['error' => 'unauthorized']);
  exit;
}

$stmt = $pdo->prepare("SELECT full_name FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($user ?: ['full_name' => 'пользователь']);
?>