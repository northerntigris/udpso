<?php
header('Content-Type: application/json');
require_once '../config.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Метод не поддерживается']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
  echo json_encode(['success' => false, 'error' => 'Некорректный JSON']);
  exit;
}

$required = ['title', 'subject', 'datetime', 'grades'];
foreach ($required as $field) {
  if (empty($input[$field])) {
    echo json_encode(['success' => false, 'error' => "Поле '{$field}' обязательно"]);
    exit;
  }
}

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success' => false, 'error' => 'Пользователь не авторизован']);
  exit;
}

$userId = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT school_id FROM users WHERE id = ?");
$stmt->execute([$userId]);
$schoolId = $stmt->fetchColumn();

if (!$schoolId) {
  echo json_encode(['success' => false, 'error' => 'Школа не найдена для текущего пользователя']);
  exit;
}

// Сохраняем как DATETIME и добавляем статус "upcoming"
$datetime = str_replace('T', ' ', $input['datetime']);

$stmt = $pdo->prepare("
  INSERT INTO olympiads (school_id, title, subject, datetime, grades, description, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, 'upcoming', NOW())
");

$stmt->execute([
  $schoolId,
  trim($input['title']),
  trim($input['subject']),
  $datetime,
  trim($input['grades']),
  trim($input['description'] ?? '')
]);

echo json_encode(['success' => true]);

?>