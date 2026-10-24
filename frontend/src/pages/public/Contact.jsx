import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Share2,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Navigation,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Contact() {
  const { t, langue } = usePublicLang();
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    sujet: "",
    message: "",
  });
  const [chargement, setChargement] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState(null);

  const handleChange = (champ, valeur) => {
    setForm({ ...form, [champ]: valeur });
    if (erreur) setErreur(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setEnvoye(false);

    try {
      const reponse = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await reponse.json();

      if (reponse.ok && data.success) {
        setEnvoye(true);
        setForm({
          nom: "",
          email: "",
          telephone: "",
          sujet: "",
          message: "",
        });
        setTimeout(() => setEnvoye(false), 8000);
      } else {
        setErreur(
          data.message ||
            (langue === "mg"
              ? "Nisy olana tamin'ny fandefasana"
              : "Une erreur est survenue")
        );
      }
    } catch (err) {
      console.error("Erreur envoi contact:", err);
      setErreur(
        langue === "mg"
          ? "Tsy afaka mifandray amin'ny serveur"
          : "Impossible de contacter le serveur. Vérifiez votre connexion."
      );
    } finally {
      setChargement(false);
    }
  };

  const infos = [
    {
      icone: MapPin,
      titre: "Adresse",
      valeur: "Ambalavao 303\nFianarantsoa, Madagascar",
      lien: "https://maps.google.com/?q=Ambalavao+303+Fianarantsoa",
    },
    {
      icone: Phone,
      titre: "Téléphone",
      valeur: "+261 34 22 489 66",
      lien: "tel:+261342248966",
    },
    {
      icone: Mail,
      titre: "Email",
      valeur: "rakotosolofoharisondiary@gmail.com",
      lien: "mailto:rakotosolofoharisondiary@gmail.com",
    },
    {
      icone: Clock,
      titre: "Horaires",
      valeur: "Lundi - Dimanche\n8h - 22h",
    },
  ];

  return (
    <div className="public-page">
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <span className="section-badge anim-fade-up">
            {t("contactPage.badge")}
          </span>
          <h1 className="section-title anim-fade-up delay-100">
            {t("contactPage.titre")}
          </h1>
          <p className="section-subtitle anim-fade-up delay-200">
            {t("contactPage.sousTitre")}
          </p>
        </div>
      </section>

      <section className="py-20 bg-[#0A1628]">
        <div className="public-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ===== COLONNE INFOS ===== */}
            <div className="lg:col-span-1 space-y-4">
              {infos.map((info, i) => (
                <div
                  key={i}
                  className="public-card anim-fade-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#06B6D4] flex-shrink-0">
                      <info.icone size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        {info.titre}
                      </p>
                      {info.lien ? (
                        <a
                          href={info.lien}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium hover:text-[#67E8F9] transition break-words whitespace-pre-line"
                        >
                          {info.valeur}
                        </a>
                      ) : (
                        <p className="text-sm font-medium whitespace-pre-line">
                          {info.valeur}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div
                className="public-card anim-fade-up"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[#1877F2] flex-shrink-0">
                    <Share2 size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Facebook
                    </p>
                    <a
                      href="https://www.facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium hover:text-[#67E8F9] transition"
                    >
                      Hari'son Rkt
                    </a>
                  </div>
                </div>
              </div>

              <a
                href="https://maps.google.com/?q=Ambalavao+303+Fianarantsoa"
                target="_blank"
                rel="noreferrer"
                className="btn-public-primary w-full justify-center anim-fade-up"
                style={{ animationDelay: "0.5s" }}
              >
                <Navigation size={18} />
                {t("contactPage.boutonItineraire")}
              </a>
            </div>

            {/* ===== COLONNE FORMULAIRE ===== */}
            <div className="lg:col-span-2">
              <div className="public-card p-8 anim-fade-up delay-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#06B6D4]">
                    <MessageSquare size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {t("contactPage.titreFormulaire")}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {t("contactPage.sousTitreFormulaire")}
                    </p>
                  </div>
                </div>

                {/* Message de succès */}
                {envoye && (
                  <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-sm rounded-lg p-4 mb-6 flex items-center gap-3 anim-fade-up">
                    <CheckCircle2 size={20} />
                    <div>
                      <p className="font-semibold">
                        {t("contactPage.messageEnvoye")}
                      </p>
                      <p className="text-xs opacity-80">
                        {t("contactPage.messageEnvoyeDesc")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Message d'erreur */}
                {erreur && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-4 mb-6 flex items-center gap-3 anim-fade-up">
                    <XCircle size={20} />
                    <p>{erreur}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {t("contactPage.labelNom")} *
                      </label>
                      <input
                        type="text"
                        value={form.nom}
                        onChange={(e) => handleChange("nom", e.target.value)}
                        required
                        minLength={2}
                        placeholder={t("contactPage.placeholderNom")}
                        className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {t("contactPage.labelTelephone")}
                      </label>
                      <input
                        type="tel"
                        value={form.telephone}
                        onChange={(e) =>
                          handleChange("telephone", e.target.value)
                        }
                        placeholder={t("contactPage.placeholderTelephone")}
                        className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t("contactPage.labelEmail")} *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                      placeholder={t("contactPage.placeholderEmail")}
                      className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t("contactPage.labelSujet")} *
                    </label>
                    <input
                      type="text"
                      value={form.sujet}
                      onChange={(e) => handleChange("sujet", e.target.value)}
                      required
                      minLength={3}
                      placeholder={t("contactPage.placeholderSujet")}
                      className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t("contactPage.labelMessage")} *
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      required
                      minLength={10}
                      rows={5}
                      placeholder={t("contactPage.placeholderMessage")}
                      className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={chargement}
                    className="btn-public-cyan w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {chargement ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {t("contactPage.boutonEnvoiEnCours")}
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        {t("contactPage.boutonEnvoyer")}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#112240]">
        <div className="public-container py-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            {t("contactPage.titreCarte")}
          </h2>
          <div className="rounded-2xl overflow-hidden border border-[#1E40AF]/30 shadow-lg">
            <iframe
              title="Cyber Famille Solofoson"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.123!2d46.9333!3d-21.8333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDUwJzAwLjAiUyA0NsKwNTYnMDAuMCJF!5e0!3m2!1sfr!2smg!4v1234567890"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}