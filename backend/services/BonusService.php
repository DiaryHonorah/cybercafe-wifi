<?php
/**
 * Service Bonus
 * Centralise tous les crédits/débits de solde bonus
 * pour garantir que CHAQUE mouvement est historisé
 */

require_once __DIR__ . '/../models/Transaction.php';

class BonusService
{
    private $db;
    private $transactionModel;

    public function __construct($db = null)
    {
        if ($db instanceof PDO) {
            $this->db = $db;
        } else {
            $this->db = $this->connecter();
        }

        $this->transactionModel = new Transaction($this->db);
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

    /**
     * Créditer du bonus au client (avec historique)
     */
    public function crediter($clientId, $montant, $type, $description, $options = [])
    {
        return $this->transactionModel->enregistrer(
            $clientId,
            $type,
            'credit',
            $montant,
            $description,
            $options
        );
    }

    /**
     * Débiter du bonus au client (avec historique)
     */
    public function debiter($clientId, $montant, $type, $description, $options = [])
    {
        return $this->transactionModel->enregistrer(
            $clientId,
            $type,
            'debit',
            $montant,
            $description,
            $options
        );
    }

    /**
     * Récupérer le solde actuel
     */
    public function getSolde($clientId)
    {
        $stmt = $this->db->prepare("SELECT solde_bonus FROM clients WHERE id = ?");
        $stmt->execute([$clientId]);
        return floatval($stmt->fetchColumn());
    }

    /**
     * Vérifier si le client a assez de solde
     */
    public function aAssezDeSolde($clientId, $montant)
    {
        return $this->getSolde($clientId) >= floatval($montant);
    }
}