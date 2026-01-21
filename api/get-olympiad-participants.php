<?php
require_once '../config.php';
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

$id = $_GET['id'] ?? null;
if (!$id || !is_numeric($id)) {
  echo json_encode(['error' => 'Invalid olympiad ID']);
  exit;
}

$stmt = $pdo->prepare("
  SELECT 
    u.id,
    u.full_name,
    u.age,
    u.grade,
    u.snils,
    u.email,
    u.username,
    u.password,
    p.score,
    (
      SELECT id FROM participant_work_files 
      WHERE olympiad_id = p.olympiad_id AND student_id = p.student_id 
      LIMIT 1
    ) AS work_file_id,
    s.short_name AS school
  FROM olympiad_participants p
  JOIN users u ON p.student_id = u.id
  LEFT JOIN approved_schools s ON u.school_id = s.registration_id
  WHERE p.olympiad_id = ?
  ORDER BY u.full_name
");
$stmt->execute([$id]);
$participants = $stmt->fetchAll();

echo json_encode($participants);
?>
