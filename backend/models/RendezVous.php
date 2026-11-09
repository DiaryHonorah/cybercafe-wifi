<?php
/**
 * Modèle RendezVous
 * Gestion des rendez-vous avec technicien
 */

class RendezVous
{
    private $db;

    public function __construct($db = null)
    {
        if ($db instanceof PDO) {
            $this->db = $db;
        } else {
            $this->db = $this->connecter();
        }

        if (!$this->db) {
            throw new Exception("Impossible de se connecter à la base de données");
        }
    }

    private function connecter()
    {
        $configPath = __DIR__ . '/../config/database.php';
        if (!file_exists($configPath)) {
            throw new Exception("Fichier config/database.php introuvable");
        }
        require_once $configPath;
        if (class_exists('Database')) {
            $database = new Database();
            return $database->getConnection();
        }
        throw new Exception("Classe Database introuvable");
    }

    public function getConfig()
    {
        $stmt = $this->db->query("SELECT * FROM rdv_config LIMIT 1");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getServices()
    {
        $stmt = $this->db->query("
            SELECT * FROM rdv_services 
            WHERE actif = 1 
            ORDER BY ordre ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getServiceById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM rdv_services WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Génère une référence unique
     */
    private function genererReference()
    {
        $annee = date('Y');
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM rdv WHERE YEAR(created_at) = ?
        ");
        $stmt->execute([$annee]);
        $count = intval($stmt->fetchColumn()) + 1;
        return "RDV-{$annee}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Crée un rendez-vous
     */
    public function creer($data, $clientId = null)
    {
        $config = $this->getConfig();
        if (!$config || !$config['actif']) {
            throw new Exception("Le système de rendez-vous est désactivé");
        }

        $serviceId = intval($data['service_id'] ?? 0);
        $service = $this->getServiceById($serviceId);
        if (!$service) {
            throw new Exception("Service introuvable");
        }

        $nom = trim($data['nom_client'] ?? '');
        $telephone = trim($data['telephone_client'] ?? '');
        $dateRdv = $data['date_rdv'] ?? '';
        $heureDebut = $data['heure_debut'] ?? '';

        if (empty($nom) || mb_strlen($nom) < 2) throw new Exception("Nom requis");
        if (empty($telephone) || mb_strlen($telephone) < 8) throw new Exception("Téléphone requis");
        if (empty($dateRdv) || empty($heureDebut)) throw new Exception("Date et heure requises");

        // Vérifier date valide
        $dateRdvObj = DateTime::createFromFormat('Y-m-d', $dateRdv);
        if (!$dateRdvObj) throw new Exception("Date invalide");

        // Vérifier délai minimum
        $maintenant = new DateTime();
        $delaiMin = clone $maintenant;
        $delaiMin->modify("+{$config['delai_min_heures']} hours");
        if ($dateRdvObj < new DateTime($delaiMin->format('Y-m-d'))) {
            throw new Exception("Délai minimum de {$config['delai_min_heures']}h requis");
        }

        // Vérifier limite future
        $limiteMax = clone $maintenant;
        $limiteMax->modify("+{$config['max_jours_avenir']} days");
        if ($dateRdvObj > $limiteMax) {
            throw new Exception("Maximum {$config['max_jours_avenir']} jours dans le futur");
        }

        // Vérifier jour ouvert
        $jourSemaine = intval($dateRdvObj->format('N')); // 1=Lun, 7=Dim
        $joursOuverts = explode(',', $config['jours_ouverts']);
        if (!in_array((string)$jourSemaine, $joursOuverts)) {
            throw new Exception("Ce jour n'est pas ouvert");
        }

        // Calculer heure de fin
        $duree = intval($service['duree_minutes']);
        $heureFinObj = new DateTime("$dateRdv $heureDebut");
        $heureFinObj->modify("+{$duree} minutes");
        $heureFin = $heureFinObj->format('H:i:s');

        // Vérifier dans les heures d'ouverture
        if ($heureDebut < $config['heure_ouverture'] || $heureFin > $config['heure_fermeture']) {
            throw new Exception("Hors des heures d'ouverture");
        }

        // Vérifier pause déjeuner
        if ($config['pause_debut'] && $config['pause_fin']) {
            if ($heureDebut < $config['pause_fin'] && $heureFin > $config['pause_debut']) {
                throw new Exception("Ce créneau chevauche la pause déjeuner");
            }
        }

        // Vérifier disponibilité
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM rdv 
            WHERE date_rdv = ? 
            AND statut NOT IN ('annule', 'no_show')
            AND (
                (heure_debut < ? AND heure_fin > ?)
                OR (heure_debut >= ? AND heure_debut < ?)
            )
        ");
        $stmt->execute([$dateRdv, $heureFin, $heureDebut, $heureDebut, $heureFin]);
        if (intval($stmt->fetchColumn()) > 0) {
            throw new Exception("Ce créneau n'est plus disponible");
        }

        try {
            $this->db->beginTransaction();

            $reference = $this->genererReference();

            $stmt = $this->db->prepare("
                INSERT INTO rdv 
                (reference, client_id, service_id, nom_client, email_client, 
                 telephone_client, date_rdv, heure_debut, heure_fin, description, statut) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')
            ");
            $stmt->execute([
                $reference,
                $clientId,
                $serviceId,
                $nom,
                $data['email_client'] ?? null,
                $telephone,
                $dateRdv,
                $heureDebut,
                $heureFin,
                $data['description'] ?? null,
            ]);

            $rdvId = $this->db->lastInsertId();

            // Notification si client connecté
            if ($clientId) {
                $stmt = $this->db->prepare("
                    INSERT INTO clients_notifications (client_id, titre, message, type) 
                    VALUES (?, ?, ?, 'info')
                ");
                $stmt->execute([
                    $clientId,
                    "📅 Rendez-vous demandé",
                    "Votre demande de rendez-vous ($reference) pour le " . 
                    date('d/m/Y', strtotime($dateRdv)) . " à " . substr($heureDebut, 0, 5) . 
                    " a bien été enregistrée. Nous vous confirmerons rapidement.",
                ]);
            }

            $this->db->commit();
            return $this->trouverParId($rdvId);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Créneaux disponibles pour une date
     */
    public function getCreneauxDisponibles($date, $serviceId = null)
    {
        $config = $this->getConfig();
        if (!$config || !$config['actif']) return [];

        $dateObj = DateTime::createFromFormat('Y-m-d', $date);
        if (!$dateObj) return [];

        // Vérifier jour ouvert
        $jourSemaine = intval($dateObj->format('N'));
        $joursOuverts = explode(',', $config['jours_ouverts']);
        if (!in_array((string)$jourSemaine, $joursOuverts)) return [];

        // Vérifier délai minimum
        $maintenant = new DateTime();
        $delaiMin = clone $maintenant;
        $delaiMin->modify("+{$config['delai_min_heures']} hours");
        if ($dateObj < new DateTime($delaiMin->format('Y-m-d'))) return [];

        // Durée du service
        $duree = 60;
        if ($serviceId) {
            $service = $this->getServiceById($serviceId);
            if ($service) $duree = intval($service['duree_minutes']);
        }

        // Générer tous les créneaux
        $heureOuverture = new DateTime("$date {$config['heure_ouverture']}");
        $heureFermeture = new DateTime("$date {$config['heure_fermeture']}");
        $creneau = intval($config['duree_creneau']);
        $pauseDebut = $config['pause_debut'] ? new DateTime("$date {$config['pause_debut']}") : null;
        $pauseFin = $config['pause_fin'] ? new DateTime("$date {$config['pause_fin']}") : null;

        $creneaux = [];
        $current = clone $heureOuverture;

        while ($current < $heureFermeture) {
            $fin = clone $current;
            $fin->modify("+{$duree} minutes");

            if ($fin > $heureFermeture) break;

            // Skip pause déjeuner
            $enPause = false;
            if ($pauseDebut && $pauseFin) {
                if ($current < $pauseFin && $fin > $pauseDebut) {
                    $enPause = true;
                }
            }

            if (!$enPause) {
                // Vérifier disponibilité
                $stmt = $this->db->prepare("
                    SELECT COUNT(*) FROM rdv 
                    WHERE date_rdv = ? 
                    AND statut NOT IN ('annule', 'no_show')
                    AND (
                        (heure_debut < ? AND heure_fin > ?)
                        OR (heure_debut >= ? AND heure_debut < ?)
                    )
                ");
                $stmt->execute([
                    $date,
                    $fin->format('H:i:s'),
                    $current->format('H:i:s'),
                    $current->format('H:i:s'),
                    $fin->format('H:i:s')
                ]);
                $occupe = intval($stmt->fetchColumn()) > 0;

                // Vérifier si dans le passé (pour aujourd'hui)
                $passe = false;
                if ($date === date('Y-m-d')) {
                    if ($current < $maintenant) $passe = true;
                }

                $creneaux[] = [
                    'heure_debut' => $current->format('H:i'),
                    'heure_fin' => $fin->format('H:i'),
                    'disponible' => !$occupe && !$passe,
                ];
            }

            $current->modify("+{$creneau} minutes");
        }

        return $creneaux;
    }

    /**
     * Trouve un RDV par ID
     */
    public function trouverParId($id)
    {
        $stmt = $this->db->prepare("
            SELECT r.*, s.nom AS service_nom, s.icone AS service_icone, 
                   s.tarif AS service_tarif, s.duree_minutes AS service_duree
            FROM rdv r
            JOIN rdv_services s ON s.id = r.service_id
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Trouve par référence
     */
    public function trouverParReference($reference)
    {
        $stmt = $this->db->prepare("
            SELECT r.*, s.nom AS service_nom, s.icone AS service_icone, 
                   s.tarif AS service_tarif, s.duree_minutes AS service_duree
            FROM rdv r
            JOIN rdv_services s ON s.id = r.service_id
            WHERE r.reference = ?
        ");
        $stmt->execute([$reference]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Liste RDV d'un client
     */
    public function mesRdv($clientId)
    {
        $stmt = $this->db->prepare("
            SELECT r.*, s.nom AS service_nom, s.icone AS service_icone, 
                   s.tarif AS service_tarif, s.duree_minutes AS service_duree
            FROM rdv r
            JOIN rdv_services s ON s.id = r.service_id
            WHERE r.client_id = ?
            ORDER BY r.date_rdv DESC, r.heure_debut DESC
        ");
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Liste admin avec filtres
     */
    public function listeAdmin($filtres = [])
    {
        $sql = "SELECT r.*, s.nom AS service_nom, s.icone AS service_icone,
                       s.tarif AS service_tarif, s.duree_minutes AS service_duree
                FROM rdv r
                JOIN rdv_services s ON s.id = r.service_id
                WHERE 1=1";
        $params = [];

        if (!empty($filtres['statut']) && $filtres['statut'] !== 'tous') {
            $sql .= " AND r.statut = ?";
            $params[] = $filtres['statut'];
        }

        if (!empty($filtres['date'])) {
            $sql .= " AND r.date_rdv = ?";
            $params[] = $filtres['date'];
        }

        if (!empty($filtres['date_debut'])) {
            $sql .= " AND r.date_rdv >= ?";
            $params[] = $filtres['date_debut'];
        }

        if (!empty($filtres['date_fin'])) {
            $sql .= " AND r.date_rdv <= ?";
            $params[] = $filtres['date_fin'];
        }

        if (!empty($filtres['recherche'])) {
            $sql .= " AND (r.reference LIKE ? OR r.nom_client LIKE ? OR r.telephone_client LIKE ?)";
            $search = '%' . $filtres['recherche'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY 
                    CASE r.statut 
                        WHEN 'en_attente' THEN 1 
                        WHEN 'confirme' THEN 2 
                        WHEN 'termine' THEN 3 
                        ELSE 4 
                    END,
                    r.date_rdv ASC, r.heure_debut ASC 
                  LIMIT " . intval($filtres['limite'] ?? 200);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Stats admin
     */
    public function statsAdmin()
    {
        $stats = [];

        $stmt = $this->db->query("SELECT COUNT(*) FROM rdv");
        $stats['total'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM rdv WHERE statut = 'en_attente'");
        $stats['en_attente'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM rdv WHERE statut = 'confirme'");
        $stats['confirmes'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM rdv WHERE statut = 'termine'");
        $stats['termines'] = intval($stmt->fetchColumn());

        $stmt = $this->db->query("SELECT COUNT(*) FROM rdv WHERE date_rdv = CURDATE()");
        $stats['aujourdhui'] = intval($stmt->fetchColumn());

        // ✅ CORRECTION ICI : Utilisation de s.tarif au lieu de service_tarif
        $stmt = $this->db->query("
            SELECT COALESCE(SUM(s.tarif), 0) 
            FROM rdv r
            JOIN rdv_services s ON s.id = r.service_id
            WHERE r.statut = 'termine' AND r.montant_paye > 0
        ");
        $stats['revenus'] = floatval($stmt->fetchColumn());

        return $stats;
    }

    /**
     * Change le statut
     */
    public function changerStatut($id, $statut, $raison = null, $notes = null)
    {
        $statutsValides = ['en_attente', 'confirme', 'termine', 'annule', 'no_show'];
        if (!in_array($statut, $statutsValides)) {
            throw new Exception("Statut invalide");
        }

        $rdv = $this->trouverParId($id);
        if (!$rdv) throw new Exception("RDV introuvable");

        $stmt = $this->db->prepare("
            UPDATE rdv 
            SET statut = ?, 
                raison_annulation = COALESCE(?, raison_annulation),
                notes_technicien = COALESCE(?, notes_technicien)
            WHERE id = ?
        ");
        $stmt->execute([$statut, $raison, $notes, $id]);

        // Notification client
        if ($rdv['client_id']) {
            $messages = [
                'confirme' => "✅ Votre rendez-vous ({$rdv['reference']}) est confirmé pour le " . 
                    date('d/m/Y', strtotime($rdv['date_rdv'])) . " à " . substr($rdv['heure_debut'], 0, 5),
                'termine' => "✅ Votre rendez-vous ({$rdv['reference']}) est terminé. Merci !",
                'annule' => "❌ Votre rendez-vous ({$rdv['reference']}) a été annulé." . 
                    ($raison ? " Raison : $raison" : ""),
                'no_show' => "⚠️ Vous ne vous êtes pas présenté au rendez-vous ({$rdv['reference']}).",
            ];

            if (isset($messages[$statut])) {
                $stmt = $this->db->prepare("
                    INSERT INTO clients_notifications (client_id, titre, message, type) 
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([
                    $rdv['client_id'],
                    "📅 Rendez-vous {$statut}",
                    $messages[$statut],
                    $statut === 'annule' || $statut === 'no_show' ? 'warning' : 'success',
                ]);
            }
        }

        return true;
    }

    /**
     * Supprime un RDV
     */
    public function supprimer($id)
    {
        $stmt = $this->db->prepare("DELETE FROM rdv WHERE id = ?");
        return $stmt->execute([$id]);
    }

    // =====================================================
    // SERVICES (Admin)
    // =====================================================

    public function creerService($data)
    {
        $stmt = $this->db->prepare("
            INSERT INTO rdv_services 
            (nom, nom_mg, description, description_mg, icone, duree_minutes, tarif, actif, ordre) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['nom'],
            $data['nom_mg'] ?? null,
            $data['description'] ?? null,
            $data['description_mg'] ?? null,
            $data['icone'] ?? '🔧',
            intval($data['duree_minutes'] ?? 60),
            floatval($data['tarif'] ?? 0),
            !empty($data['actif']) ? 1 : 0,
            intval($data['ordre'] ?? 0),
        ]);
        return $this->db->lastInsertId();
    }

    public function modifierService($id, $data)
    {
        $stmt = $this->db->prepare("
            UPDATE rdv_services SET
                nom = ?, nom_mg = ?, description = ?, description_mg = ?,
                icone = ?, duree_minutes = ?, tarif = ?, actif = ?, ordre = ?
            WHERE id = ?
        ");
        return $stmt->execute([
            $data['nom'],
            $data['nom_mg'] ?? null,
            $data['description'] ?? null,
            $data['description_mg'] ?? null,
            $data['icone'] ?? '🔧',
            intval($data['duree_minutes'] ?? 60),
            floatval($data['tarif'] ?? 0),
            !empty($data['actif']) ? 1 : 0,
            intval($data['ordre'] ?? 0),
            $id,
        ]);
    }

    public function supprimerService($id)
    {
        $stmt = $this->db->prepare("DELETE FROM rdv_services WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function updateConfig($data)
    {
        $stmt = $this->db->prepare("
            UPDATE rdv_config SET
                actif = ?,
                heure_ouverture = ?,
                heure_fermeture = ?,
                duree_creneau = ?,
                jours_ouverts = ?,
                delai_min_heures = ?,
                max_jours_avenir = ?,
                pause_debut = ?,
                pause_fin = ?,
                message_accueil = ?
            WHERE id = 1
        ");
        return $stmt->execute([
            !empty($data['actif']) ? 1 : 0,
            $data['heure_ouverture'] ?? '09:00:00',
            $data['heure_fermeture'] ?? '18:00:00',
            intval($data['duree_creneau'] ?? 30),
            $data['jours_ouverts'] ?? '1,2,3,4,5,6',
            intval($data['delai_min_heures'] ?? 24),
            intval($data['max_jours_avenir'] ?? 60),
            $data['pause_debut'] ?? null,
            $data['pause_fin'] ?? null,
            $data['message_accueil'] ?? '',
        ]);
    }
}