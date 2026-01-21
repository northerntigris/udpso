<?php
header('Content-Type: application/json');
require_once '../config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once '../PHPMailer.php';
require_once '../SMTP.php';
require_once '../Exception.php';

session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    die(json_encode(['success' => false, 'error' => 'Доступ запрещен']));
}

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? 0;
$status = $input['status'] ?? '';
$rejection_reason = $input['rejection_reason'] ?? '';
$reconsider_reason = $input['reconsider_reason'] ?? '';


if (!in_array($status, ['approved', 'rejected', 'pending'])) {
    die(json_encode(['success' => false, 'error' => 'Неверный статус']));
}

try {
    $pdo->beginTransaction();
    
    // Обновляем заявку
    $stmt = $pdo->prepare("
        UPDATE school_registrations 
        SET status = ?, processed_by = ?, processed_at = NOW(), rejection_reason = ?
        WHERE id = ?
    ");
    $stmt->execute([$status, $_SESSION['user_id'], $status === 'rejected' ? $rejection_reason : null, $id]);
    
    // Получаем данные заявки для email
    $stmt = $pdo->prepare("SELECT * FROM school_registrations WHERE id = ?");
    $stmt->execute([$id]);
    $application = $stmt->fetch();

    $title = match ($status) {
        'approved' => 'Школа «' . $application['short_name'] . '» была одобрена и добавлена в систему',
        'rejected' => 'Заявка от школы «' . $application['short_name'] . '» была отклонена',
        'pending'  => 'Заявка от школы «' . $application['short_name'] . '» возвращена на повторное рассмотрение',
    };

    $stmt = $pdo->prepare("
        INSERT INTO activities (user_id, type, title, created_at)
        VALUES (:user_id, 'application_processed', :title, NOW())
    ");
    $stmt->execute([
        'user_id' => $_SESSION['user_id'],
        'title' => $title
    ]);

    // Получаем данные администратора
    $adminStmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
    $adminStmt->execute([$_SESSION['user_id']]);
    $admin = $adminStmt->fetch();

    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host = 'smtp.yandex.ru'; // SMTP сервер (mail.ru, gmail.com и т.д.)
    $mail->SMTPAuth = true;
    $mail->Username = 'northerntigris@yandex.ru'; // Ваш email
    $mail->Password = 'xjzfqmgiwhfwwber'; // Пароль от почты
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL
    $mail->Port = 465; // Порт для SSL
    
    // От кого
    $mail->setFrom('northerntigris@yandex.ru', 'Платформа школьных олимпиад');
    // Кому
    $mail->addAddress($application['contact_email'], $application['director_fio']);

    if ($status === 'pending') {
        $mail->Subject = 'Заявка возвращена на повторное рассмотрение';
        $mail->Body = "
            <p>Уважаемый(ая) <strong>{$application['director_fio']}</strong>,</p>
            <p>Ранее отклонённая заявка от школы <strong>«{$application['short_name']}»</strong> была возвращена на повторное рассмотрение.</p>
            <h3>Причина возврата:</h3>
            <p>{$reconsider_reason}</p>
            <p>С уважением,<br>Администрация платформы</p>
        ";
    }
    else if ($status === 'approved') {
        // Генерируем логин и пароль
        $username = 'school_' . $application['id'];
        $password = bin2hex(random_bytes(4)); // Простой пароль для начальной настройки
        
        // Создаем пользователя
        $stmt = $pdo->prepare("
            INSERT INTO users (username, password, role, school_id, full_name) 
            VALUES (?, ?, 'organizer', ?, ?)
            ");
        $stmt->execute([
            $username,
            password_hash($password, PASSWORD_DEFAULT),
            $application['id'],
            $application['director_fio']
        ]);
            
        // Добавляем школу в таблицу approved_schools
        $stmt = $pdo->prepare("
            INSERT INTO approved_schools (
                registration_id, full_name, short_name, inn, ogrn, ogrn_date, 
                address, region, director_fio, director_inn, director_position,
                contact_phone, contact_email, approved_at, approved_by
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?
            )
        ");
        $stmt->execute([
            $application['id'],
            $application['full_name'],
            $application['short_name'],
            $application['inn'],
            $application['ogrn'],
            $application['ogrn_date'],
            $application['address'],
            $application['region'],
            $application['director_fio'],
            $application['director_inn'],
            $application['director_position'],
            $application['contact_phone'],
            $application['contact_email'],
            $_SESSION['user_id']
        ]);
        
        // Формируем email для одобренной заявки
        $mail->Subject = "Ваша заявка на платформе школьных олимпиад одобрена";
        $mail->Body = "
            <h2>Ваша заявка одобрена!</h2>
            <p>Ваша образовательная организация <strong>{$application['full_name']}</strong> успешно зарегистрирована на платформе.</p>
            <h3>Ваши учетные данные:</h3>
            <p><strong>Логин:</strong> {$username}</p>
            <p><strong>Пароль:</strong> {$password}</p>
            <p>Рекомендуем сменить пароль после первого входа в систему.</p>
            <p>С уважением,<br>Администрация платформы</p>
        ";
    } else {
        // Формируем email для отклоненной заявки
        $mail->Subject = "Ваша заявка на платформе школьных олимпиад отклонена";
        $mail->Body = "
            <h2>Ваша заявка отклонена</h2>
            <p>К сожалению, ваша заявка от образовательной организации <strong>{$application['full_name']}</strong> была отклонена.</p>
            <h3>Причина отказа:</h3>
            <p>{$rejection_reason}</p>
            <p>Вы можете исправить указанные замечания и подать заявку повторно.</p>
            <p>С уважением,<br>Администрация платформы</p>
        ";
    }

    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->send();
    
    // Получаем обновленное количество заявок на рассмотрении
    $stmt = $pdo->query("SELECT COUNT(*) FROM school_registrations WHERE status = 'pending'");
    $total_pending = $stmt->fetchColumn();
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'total_pending' => $total_pending
    ]);
    
} catch(PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => 'Ошибка базы данных: ' . $e->getMessage()]);
}
