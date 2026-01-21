<?php
header('Content-Type: application/json');
require_once '../config.php';

session_start();

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

$userId = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT school_id FROM users WHERE id = ?");
$stmt->execute([$userId]);
$schoolId = $stmt->fetchColumn();

if (!$schoolId) {
  echo json_encode(['error' => 'School not found']);
  exit;
}

$stmt = $pdo->prepare("
  SELECT id, title, subject, datetime, grades, status
  FROM olympiads
  WHERE school_id = ?
  ORDER BY datetime DESC
");
$stmt->execute([$schoolId]);
$olympiads = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($olympiads);
