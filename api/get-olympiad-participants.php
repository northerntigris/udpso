<?php
require_once '../config.php';
header('Content-Type: application/json; charset=utf-8');
session_start();

try {
  if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $id = $_GET['id'] ?? null;
  if (!$id || !is_numeric($id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid olympiad ID'], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $columnStmt = $pdo->prepare("
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'olympiad_participants'
      AND column_name = 'school_id'
    LIMIT 1
  ");
  $columnStmt->execute();
  $hasSchoolColumn = (bool)$columnStmt->fetchColumn();

  $schoolSelect = $hasSchoolColumn
    ? 'COALESCE(s.short_name, ss.short_name) AS school'
    : 's.short_name AS school';
  $schoolJoin = $hasSchoolColumn
    ? 'LEFT JOIN approved_schools ss ON p.school_id = ss.registration_id'
    : '';

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
      $schoolSelect
    FROM olympiad_participants p
    JOIN users u ON p.student_id = u.id
    LEFT JOIN approved_schools s ON u.school_id = s.registration_id
    $schoolJoin
    WHERE p.olympiad_id = ?
    ORDER BY u.full_name
  ");
  $stmt->execute([$id]);
  $participants = $stmt->fetchAll();

  echo json_encode($participants, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Ошибка загрузки участников'], JSON_UNESCAPED_UNICODE);
}
?>
