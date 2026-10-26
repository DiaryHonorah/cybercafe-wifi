<?php
// Script temporaire pour générer un hash de mot de passe
// À SUPPRIMER après usage !

$mot_de_passe = "admin123";  // <-- change ici si tu veux
$hash = password_hash($mot_de_passe, PASSWORD_BCRYPT);

echo "Mot de passe : " . $mot_de_passe . "<br>";
echo "Hash : " . $hash . "<br><br>";
echo "Copie ce hash dans la colonne mot_de_passe de la table admins.";