<?php
header('Content-Type: application/json');
require_once '../config.php';

session_start();

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

$userId = $_SESSION['user_id'];

// Получаем школу пользователя
$stmt = $pdo->prepare("SELECT school_id FROM users WHERE id = ?");
$stmt->execute([$userId]);
$schoolId = $stmt->fetchColumn();

if (!$schoolId) {
  echo json_encode(['error' => 'School not found']);
  exit;
}

// Счётчик активных олимпиад (upcoming + ongoing)
$stmt = $pdo->prepare("SELECT COUNT(*) FROM olympiads WHERE school_id = ? AND status IN ('upcoming', 'ongoing')");
$stmt->execute([$schoolId]);
$activeCount = (int)$stmt->fetchColumn();

// Счётчик завершённых
$stmt = $pdo->prepare("SELECT COUNT(*) FROM olympiads WHERE school_id = ? AND status = 'completed'");
$stmt->execute([$schoolId]);
$completedCount = (int)$stmt->fetchColumn();

// Количество учеников школы
// $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE school_id = ?");
// $stmt->execute([$schoolId]);
// $studentCount = (int)$stmt->fetchColumn();
$studentCount = 0;

echo json_encode([
  'active' => $activeCount,
  'completed' => $completedCount,
  'students' => $studentCount
]);

?>