# 📘 Guide de mise en production — Cyber Famille

## 🎯 Vue d'ensemble

Ce guide vous aide à passer du développement à la **production** avec une application stable et sécurisée.

---

## 📋 Checklist avant lancement

### 1. Sécurité

- [ ] Mot de passe admin **fort** (12+ caractères)
- [ ] **2FA activé** dans `/admin/2fa`
- [ ] Codes de secours **téléchargés** et conservés
- [ ] Fichier `generate_hash.php` **supprimé**
- [ ] Fichier `test_qr.php` **supprimé**
- [ ] Compte MySQL avec **mot de passe** (pas root sans MDP)
- [ ] Apache démarre **automatiquement** avec Windows

### 2. Données

- [ ] Forfaits configurés (prix + durées)
- [ ] Nom du cyber + logo dans Paramètres
- [ ] Sauvegarde automatique planifiée
- [ ] Base de données sauvegardée une première fois

### 3. Matériel

- [ ] Starlink opérationnel
- [ ] Routeur MikroTik (ou équivalent) configuré
- [ ] Imprimante thermique connectée (optionnel)
- [ ] Onduleur (recommandé pour éviter les coupures)

---

## 🚀 Lancement automatique

### Démarrage automatique de Windows

1. Appuyez sur `Windows + R`
2. Tapez `shell:startup` et Entrée
3. Copiez le raccourci de `demarrer_tout.bat` dans ce dossier
4. Redémarrez pour tester

### Sauvegarde automatique quotidienne

1. Ouvrez **Planificateur de tâches**
2. Créez une tâche :
   - Nom : `Sauvegarde Cyber Famille`
   - Déclencheur : Quotidien à **23h00**
   - Action : `C:\xampp\htdocs\cybercafe-wifi\backend\cron_quotidien.bat`

---

## 🔐 Sécurité en production

### 1. Activer le 2FA

Obligatoire pour tous les comptes admin :

1. Allez dans **Sécurité 2FA**
2. Scannez le QR code
3. Téléchargez les codes de secours
4. Conservez-les dans un endroit sûr

### 2. Mot de passe MySQL

Par défaut, XAMPP utilise root sans mot de passe. **À changer** :

1. phpMyAdmin → Comptes utilisateurs → root → Modifier
2. Nouveau mot de passe : 16+ caractères
3. Modifier `backend/config/database.php` :

```php
private $password = "VOTRE_NOUVEAU_MOT_DE_PASSE";

C:\xampp\htdocs\cybercafe-wifi\
├── demarrer_tout.bat          ← Lance tout en 1 clic
├── arreter_tout.bat           ← Arrête tout en 1 clic
├── GUIDE_PRODUCTION.md        ← Guide de production
│
├── frontend/                   ← React.js + Vite + TailwindCSS
│   ├── public/
│   │   ├── manifest.json       ← PWA
│   │   ├── service-worker.js   ← Mode hors ligne
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── src/
│       ├── components/         ← 15+ composants réutilisables
│       ├── context/            ← 5 contextes (Auth, WS, Caisse...)
│       ├── pages/              ← 20 pages complètes
│       ├── i18n/               ← FR + MG
│       └── utils/              ← Générateur PDF
│
└── backend/                    ← PHP + MySQL
    ├── config/
    ├── controllers/            ← 20+ contrôleurs
    ├── services/               ← MikroTik, Mail, SMS, 2FA
    ├── routes/
    ├── libs/phpqrcode/         ← QR Codes
    ├── websocket/              ← Serveur temps réel
    ├── backups/                ← Sauvegardes SQL
    └── index.php               ← Point d'entrée sécurisé