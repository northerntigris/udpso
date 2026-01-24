<?php
header('Content-Type: application/json; charset=utf-8');
require_once '../config.php';

session_start();

try {
  if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $userId = (int)$_SESSION['user_id'];

  // Только организатор
  $roleStmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
  $roleStmt->execute([$userId]);
  $role = $roleStmt->fetchColumn();

  if ($role !== 'organizer') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Доступ запрещён'], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // Школы, которые организатор зарегистрировал напрямую (registration_id IS NULL)
  // Логин берём из users, привязанных к этой школе (role = 'school')
  $stmt = $pdo->prepare("
    SELECT
      s.id,
      s.full_name,
      s.short_name,
      s.region,
      s.contact_email,
      s.contact_phone,
      s.approved_at,
      u.username AS login
    FROM approved_schools s
    LEFT JOIN users u
      ON u.school_id = s.id AND u.role = 'school'
    WHERE s.approved_by = :org_id
      AND s.registration_id IS NULL
    ORDER BY s.approved_at DESC, s.id DESC
  ");
  $stmt->execute([':org_id' => $userId]);

  echo json_encode(['success' => true, 'schools' => $stmt->fetchAll(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Ошибка загрузки школ'], JSON_UNESCAPED_UNICODE);
}
?>