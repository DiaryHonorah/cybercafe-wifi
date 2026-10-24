<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/MailService.php';
require_once __DIR__ . '/../services/SmsService.php';

class CronController {

    /**
     * Rapport journalier automatique (à appeler via tâche planifiée)
     * GET /api/cron/rapport-journalier
     */
    public function rapportJournalier() {
        $db = (new Database())->getConnection();

        // Vérifier si activé
        $stmt = $db->query("
            SELECT * FROM config_notifications
            WHERE alerte_rapport_journalier = 1
              AND actif = 1
        ");
        $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($configs)) {
            echo json_encode(["success" => true, "message" => "Aucune config active"]);
            return;
        }

        // Récupérer les stats du jour
        $stats = $db->query("
            SELECT
                COUNT(*) AS nb_ventes,
                COALESCE(SUM(montant), 0) AS total,
                COUNT(DISTINCT ticket_id) AS nb_tickets
            FROM ventes
            WHERE DATE(date_vente) = CURDATE()
        ")->fetch(PDO::FETCH_ASSOC);

        $date = date('d/m/Y');

        $donnees = [
            "Date" => $date,
            "Recette totale" => number_format($stats['total'], 0, ',', ' ') . " Ar",
            "Ventes" => $stats['nb_ventes'],
            "Tickets vendus" => $stats['nb_tickets'],
        ];

        $resultats = [];

        foreach ($configs as $config) {
            if ($config['type'] === 'email' && !empty($config['destinataires_email'])) {
                $mail = new MailService();
                $r = $mail->envoyerRapport(
                    $config['destinataires_email'],
                    "Rapport journalier - $date",
                    $donnees
                );
                $resultats['email'] = $r;
            }

            if ($config['type'] === 'sms' && !empty($config['destinataires_sms'])) {
                $sms = new SmsService();
                $msg = "Cyber Famille - $date\n";
                $msg .= "Recette : " . number_format($stats['total'], 0, ',', ' ') . " Ar\n";
                $msg .= "Ventes : {$stats['nb_ventes']}";
                $r = $sms->envoyer($config['destinataires_sms'], $msg);
                $resultats['sms'] = $r;
            }
        }

        echo json_encode([
            "success" => true,
            "date" => $date,
            "donnees" => $donnees,
            "resultats" => $resultats
        ]);
    }

    /**
     * Vérifier les alertes et envoyer si nécessaire
     * GET /api/cron/verifier-alertes
     */
    public function verifierAlertes() {
        $db = (new Database())->getConnection();
        $alertes = [];

        // 1. Stock faible
        $stmt = $db->query("
            SELECT COUNT(*) FROM tickets WHERE statut = 'disponible'
        ");
        $disponibles = (int)$stmt->fetchColumn();

        if ($disponibles < 5) {
            $alertes[] = [
                "type" => "stock_faible",
                "message" => "Stock de tickets faible : $disponibles restant(s)"
            ];
        }

        // 2. Envoyer les alertes
        if (!empty($alertes)) {
            $stmt = $db->query("
                SELECT * FROM config_notifications
                WHERE alerte_stock_faible = 1 AND actif = 1
            ");
            $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($configs as $config) {
                foreach ($alertes as $alerte) {
                    if ($config['type'] === 'email' && !empty($config['destinataires_email'])) {
                        $mail = new MailService();
                        $mail->envoyer(
                            $config['destinataires_email'],
                            "⚠️ Alerte Cyber Famille",
                            "<p>{$alerte['message']}</p>"
                        );
                    }
                    if ($config['type'] === 'sms' && !empty($config['destinataires_sms'])) {
                        $sms = new SmsService();
                        $sms->envoyer($config['destinataires_sms'], $alerte['message']);
                    }
                }
            }
        }

        echo json_encode([
            "success" => true,
            "alertes" => $alertes,
            "nb_alertes" => count($alertes)
        ]);
    }
}