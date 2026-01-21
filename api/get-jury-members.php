<?php
require '../config.php';
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

$olympiadId = $_GET['id'] ?? null;
if (!$olympiadId || !is_numeric($olympiadId)) {
  echo json_encode(['error' => 'Invalid olympiad ID']);
  exit;
}

try {
  $stmt = $pdo->prepare("
    SELECT 
      o.id AS olympiad_jury_id,
      jm.id AS jury_member_id,
      u.full_name,
      u.username,
      jm.organization,
      jm.passport_series,
      jm.passport_number,
      jm.passport_issued_by,
      jm.passport_issued_date AS passport_issued_date,
      jm.birthdate AS birthdate,
      o.jury_role
    FROM olympiad_jury o
    JOIN jury_members jm ON o.jury_member_id = jm.id
    JOIN users u ON jm.user_id = u.id
    WHERE o.olympiad_id = ?
    ORDER BY u.full_name
  ");
  $stmt->execute([$olympiadId]);
  $experts = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($experts);
} catch (Exception $e) {
  echo json_encode(['error' => 'Ошибка: ' . $e->getMessage()]);
}

?>