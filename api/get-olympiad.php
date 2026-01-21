<?php
require_once '../config.php';

header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
  echo json_encode(['error' => 'Invalid or missing ID']);
  exit;
}

$id = (int) $_GET['id'];

try {
  $stmt = $pdo->prepare("SELECT id, title, subject, datetime, grades, description, status FROM olympiads WHERE id = ?");
  $stmt->execute([$id]);
  $olympiad = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($olympiad) {
    echo json_encode($olympiad);
  } else {
    echo json_encode(['error' => 'Olympiad not found']);
  }

} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
}
?>
