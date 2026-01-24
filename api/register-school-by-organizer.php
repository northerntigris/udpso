<?php
header('Content-Type: application/json');
require_once '../config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once '../PHPMailer.php';
require_once '../SMTP.php';
require_once '../Exception.php';

session_start();

if (!isset($_SESSION['user_id']) || ($_SESSION['user_role'] ?? '') !== 'organizer') {
    echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
    exit;
}

function genPassword($len = 10) {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    $pwd = '';
    for ($i=0; $i<$len; $i++) {
        $pwd .= $alphabet[random_int(0, strlen($alphabet)-1)];
    }
    return $pwd;
}

function genUsername($shortName, $email) {
    $base = strtolower(trim($shortName));
    $base = preg_replace('/[^a-z0-9_]+/i', '_', $base);
    if ($base === '' || strlen($base) < 4) {
        $base = strtolower(explode('@', $email)[0] ?? 'school');
        $base = preg_replace('/[^a-z0-9_]+/i', '_', $base);
        if ($base === '' || strlen($base) < 4) $base = 'school';
    }
    return 'sch_' . $base;
}

$input = json_decode(file_get_contents('php://input'), true);

try {
    // обязательные поля — как в register-school.php
    $requiredFields = [
        'full_name', 'short_name', 'inn', 'ogrn', 'ogrn_date',
        'address', 'region', 'director_fio', 'director_inn', 'director_position',
        'contact_phone', 'contact_email'
    ];

    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Не заполнено обязательное поле: $field");
        }
    }

    if (!filter_var($input['contact_email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Некорректный email адрес");
    }

    // Данные организатора (ФИО) + его организация (по school_id -> approved_schools)
    $orgStmt = $pdo->prepare("
        SELECT u.full_name AS organizer_fio, s.full_name AS organizer_org
        FROM users u
        LEFT JOIN approved_schools s ON s.id = u.school_id
        WHERE u.id = ?
        LIMIT 1
    ");
    $orgStmt->execute([$_SESSION['user_id']]);
    $org = $orgStmt->fetch(PDO::FETCH_ASSOC);

    $organizerFio = $org['organizer_fio'] ?: 'Организатор';
    $organizerOrg = $org['organizer_org'] ?: 'Организация не указана';

    // генерируем логин/пароль для школы
    $usernameBase = genUsername($input['short_name'], $input['contact_email']);

    // делаем username уникальным
    $username = $usernameBase;
    $i = 1;
    $check = $pdo->prepare("SELECT 1 FROM users WHERE username = ? LIMIT 1");
    while (true) {
        $check->execute([$username]);
        if (!$check->fetchColumn()) break;
        $i++;
        $username = $usernameBase . $i;
    }

    $plainPassword = genPassword(10);
    $passwordHash = password_hash($plainPassword, PASSWORD_DEFAULT);

    $pdo->beginTransaction();

    // 1) создаём пользователя новой роли
    $uStmt = $pdo->prepare("
        INSERT INTO users (username, password, role, full_name, email, created_at)
        VALUES (?, ?, 'school', ?, ?, NOW())
        RETURNING id
    ");
    $uStmt->execute([
        $username,
        $passwordHash,
        $input['full_name'],
        $input['contact_email']
    ]);
    $schoolUserId = (int)$uStmt->fetchColumn();

    // 2) добавляем школу сразу в approved_schools (это уже НЕ заявка)
    $sStmt = $pdo->prepare("
        INSERT INTO approved_schools (
            registration_id, full_name, short_name, inn, ogrn, ogrn_date,
            address, region, director_fio, director_inn, director_position,
            contact_phone, contact_email, approved_at, approved_by, user_id
        ) VALUES (
            NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?
        )
        RETURNING id
    ");
    $sStmt->execute([
        $input['full_name'],
        $input['short_name'],
        $input['inn'],
        $input['ogrn'],
        $input['ogrn_date'],
        $input['address'],
        $input['region'],
        $input['director_fio'],
        $input['director_inn'],
        $input['director_position'],
        $input['contact_phone'],
        $input['contact_email'],
        $_SESSION['user_id'],
        $schoolUserId
    ]);
    $approvedSchoolId = (int)$sStmt->fetchColumn();

    // 3) проставляем users.school_id = approved_schools.id
    $upd = $pdo->prepare("UPDATE users SET school_id = ? WHERE id = ?");
    $upd->execute([$approvedSchoolId, $schoolUserId]);

    // 4) отправляем письмо — SMTP настройки берём 1:1 как у тебя в process-application.php
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.yandex.ru';
    $mail->SMTPAuth = true;
    $mail->Username = 'northerntigris@yandex.ru';
    $mail->Password = 'xjzfqmgiwhfwwber';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;

    $mail->setFrom('northerntigris@yandex.ru', 'Платформа школьных олимпиад');
    $mail->addAddress($input['contact_email'], $input['director_fio']);

    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->Subject = 'Школа зарегистрирована на цифровой платформе школьных олимпиад';

    $mail->Body = "
        <h2>Школа зарегистрирована</h2>
        <p>Образовательное учреждение <b>{$input['full_name']}</b> зарегистрировано на цифровой платформе школьных олимпиад.</p>
        <p><b>Регистрацию выполнил организатор:</b> {$organizerFio} ({$organizerOrg}).</p>

        <h3>Данные для входа в систему</h3>
        <p><b>Логин:</b> {$username}<br>
        <b>Пароль:</b> {$plainPassword}</p>

        <p>Рекомендуем сменить пароль после первого входа.</p>
    ";

    $mail->send();

    $pdo->commit();

    echo json_encode(['success' => true]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>