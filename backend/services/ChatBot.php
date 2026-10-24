<?php
/**
 * Service ChatBot
 * Génère des réponses automatiques basées sur des mots-clés
 * Ton : Amical, tutoiement, emojis
 */

class ChatBot
{
    /**
     * Règles de réponse (mots-clés → réponse)
     * L'ordre est important : les règles les plus spécifiques en premier
     */
    private static $regles = [
        // ===== SALUTATIONS =====
        [
            'mots_cles' => ['bonjour', 'salut', 'hello', 'hi', 'bonsoir', 'coucou', 'manao ahoana', 'salama'],
            'reponse' => "Salut ! 👋 Bienvenue chez Cyber Famille ! Comment puis-je t'aider aujourd'hui ? 😊",
        ],

        // ===== REMERCIEMENTS =====
        [
            'mots_cles' => ['merci', 'misaotra', 'thanks', 'thank you', 'super', 'génial', 'parfait'],
            'reponse' => "Avec plaisir ! 😊 N'hésite pas si tu as d'autres questions, je suis là pour toi ! 🙌",
        ],

        // ===== AU REVOIR =====
        [
            'mots_cles' => ['au revoir', 'bye', 'à bientôt', 'a bientot', 'veloma', 'ciao', 'bonne journée'],
            'reponse' => "À bientôt ! 👋 Passe une excellente journée et n'hésite pas à revenir si tu as besoin ! 🌟",
        ],

        // ===== TARIFS =====
        [
            'mots_cles' => ['prix', 'tarif', 'combien', 'coût', 'cout', 'forfait', 'vidiny', 'combien coûte'],
            'reponse' => "💰 Voici nos tarifs Wi-Fi Starlink :\n\n• ⏱️ 1 heure : 500 Ar\n• ⏱️ 2 heures : 1 000 Ar (populaire !)\n• ⏱️ 4 heures : 2 000 Ar\n• ⏱️ Journée (8h-22h) : 5 000 Ar\n\n🖨️ Services supplémentaires :\n• Impression N/B : 200 Ar/page\n• Impression couleur : 500 Ar/page\n• Photocopie : 100 Ar/page\n\nTu veux réserver un poste ? 🎯",
        ],

        // ===== WIFI / CONNEXION =====
        [
            'mots_cles' => ['wifi', 'wi-fi', 'connexion', 'connecter', 'réseau', 'reseau', 'internet', 'comment se connecter'],
            'reponse' => "📶 Pour te connecter, c'est super simple :\n\n1️⃣ Va à l'accueil et achète un ticket (à partir de 500 Ar)\n2️⃣ Connecte-toi au réseau Wi-Fi « CYBER_FAMILLE »\n3️⃣ Entre le code + mot de passe inscrits sur ton ticket\n4️⃣ Et voilà ! Profite d'Internet ultra-rapide 🚀\n\nBesoin d'aide ? 📞 +261 34 22 489 66",
        ],

        // ===== RÉSERVATION =====
        [
            'mots_cles' => ['réserv', 'reserv', 'place', 'poste', 'réserver', 'reserver', 'booking'],
            'reponse' => "📅 Tu peux réserver ton poste en ligne :\n\n🌐 https://cyberfamille.mg/reservation\n\nOu directement par téléphone :\n📞 +261 34 22 489 66\n\nC'est gratuit et tu garantis ta place ! 🎯",
        ],

        // ===== FIDÉLITÉ =====
        [
            'mots_cles' => ['fidélité', 'fidelite', 'carte', 'points', 'récompense', 'recompense', 'gratuit', 'tsy fivadihana'],
            'reponse' => "🎁 Notre carte de fidélité est GRATUITE !\n\n✨ Comment ça marche :\n• 1 Ar dépensé = 1 point\n• 1 000 points = 1h gratuite 🎉\n• 5 000 points = Journée gratuite 🏆\n\n🏅 Niveaux :\n• 🥉 Bronze (0-999 pts)\n• 🥈 Argent (1000-4999 pts) : -5% impressions\n• 🥇 Or (5000-19999 pts) : -10% impressions\n• 💎 Platine (20000+ pts) : -15% + 1h/mois offerte\n\n👉 Crée ta carte : /fidelite",
        ],

        // ===== HORAIRES =====
        [
            'mots_cles' => ['horaire', 'ouvert', 'fermé', 'ferme', 'heure', 'quand', 'ouvertures', '8h', '22h'],
            'reponse' => "🕐 Nos horaires d'ouverture :\n\n📅 Lundi - Dimanche\n⏰ 8h00 - 22h00\n\n7 jours sur 7, même les jours fériés ! 🎉\n\n📍 Ambalavao 303, Fianarantsoa",
        ],

        // ===== IMPRESSION =====
        [
            'mots_cles' => ['impression', 'imprim', 'copie', 'scan', 'photocopie', 'scanner', 'papier', 'document'],
            'reponse' => "🖨️ Nos services d'impression :\n\n• 📄 A4 Noir/Blanc : 200 Ar/page\n• 🎨 A4 Couleur : 500 Ar/page\n• 📋 Photocopie N/B : 100 Ar/page\n• 📋 Photocopie couleur : 400 Ar/page\n• 📠 Scan : 300 Ar/document\n\n⏰ Service rapide, disponible 7j/7 !",
        ],

        // ===== CONTACT =====
        [
            'mots_cles' => ['téléphone', 'telephone', 'contact', 'appeler', 'numéro', 'numero', 'mail', 'email', 'adresse'],
            'reponse' => "📞 Comment nous contacter :\n\n☎️ Téléphone : +261 34 22 489 66\n📧 Email : rakotosolofoharisondiary@gmail.com\n📍 Adresse : Ambalavao 303, Fianarantsoa\n📘 Facebook : Hari'son Rkt\n\nOn te répond avec plaisir ! 😊",
        ],

        // ===== SERVICES =====
        [
            'mots_cles' => ['service', 'quoi', 'qu\'est-ce', 'proposez', 'offrez', 'faites'],
            'reponse' => "✨ Voici tout ce qu'on propose chez Cyber Famille :\n\n📶 Wi-Fi Starlink ultra-rapide\n🖨️ Impression N/B et couleur\n📋 Photocopie\n📠 Scan de documents\n💻 Rédaction de CV et documents\n📸 Retouche photo\n💳 Paiement en ligne\n📱 Configuration mobile\n📚 Aide scolaire\n\nTu veux plus d'infos sur un service en particulier ? 😊",
        ],

        // ===== PROBLÈME / AIDE =====
        [
            'mots_cles' => ['problème', 'probleme', 'panne', 'marche pas', 'fonctionne pas', 'bug', 'erreur', 'aide', 'help'],
            'reponse' => "😟 Désolé d'apprendre ça ! On va t'aider à résoudre ça.\n\nPeux-tu nous dire :\n1️⃣ Ce qui ne fonctionne pas exactement ?\n2️⃣ Depuis quand ?\n3️⃣ Sur quel appareil ?\n\nNotre équipe va prendre le relais rapidement ! 👨‍💼\n\nEn attendant, tu peux nous appeler : 📞 +261 34 22 489 66",
        ],

        // ===== OUI / NON (continuer la conversation) =====
        [
            'mots_cles' => ['oui', 'yes', 'ok', 'd\'accord', 'daccord', 'volontiers'],
            'reponse' => "Super ! 😊 Comment puis-je t'aider davantage ?\n\nTu peux me demander :\n• 💰 Nos tarifs\n• 📅 Comment réserver\n• 🎁 La carte de fidélité\n• 🕐 Nos horaires",
        ],
        [
            'mots_cles' => ['non', 'no', 'pas besoin', 'rien'],
            'reponse' => "D'accord, pas de problème ! 😊 Si tu as besoin de quoi que ce soit, n'hésite pas à me demander ! 🙌",
        ],
    ];

    /**
     * Message par défaut si aucune règle ne correspond
     */
    private static $reponseDefaut = "Merci pour ton message ! 🙏\n\nNotre équipe va te répondre dans les plus brefs délais. En attendant, voici quelques infos utiles :\n\n💰 Tarifs : de 500 Ar (1h) à 5 000 Ar (journée)\n🕐 Ouvert 7j/7 de 8h à 22h\n📞 +261 34 22 489 66\n📍 Ambalavao 303, Fianarantsoa\n\nBesoin de quelque chose de précis ? Tu peux me demander :\n• 💰 Les tarifs\n• 📅 Réserver un poste\n• 🎁 La carte de fidélité\n• 🕐 Les horaires";

    /**
     * Génère une réponse automatique basée sur le message du client
     * 
     * @param string $message Le message du client
     * @return string La réponse du bot
     */
    public static function genererReponse($message)
    {
        // Normaliser le message (minuscules, sans accents)
        $messageNormalise = strtolower($message);
        $messageNormalise = self::supprimerAccents($messageNormalise);

        // Chercher une règle correspondante
        foreach (self::$regles as $regle) {
            foreach ($regle['mots_cles'] as $motCle) {
                $motCleNormalise = self::supprimerAccents(strtolower($motCle));
                if (strpos($messageNormalise, $motCleNormalise) !== false) {
                    return $regle['reponse'];
                }
            }
        }

        // Aucune correspondance → réponse par défaut
        return self::$reponseDefaut;
    }

    /**
     * Supprime les accents d'une chaîne
     */
    private static function supprimerAccents($str)
    {
        $accents = [
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a',
            'ç' => 'c',
            'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
            'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ñ' => 'n',
            'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
            'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
            'ý' => 'y', 'ÿ' => 'y',
            'œ' => 'oe', 'æ' => 'ae',
        ];
        return strtr($str, $accents);
    }
}