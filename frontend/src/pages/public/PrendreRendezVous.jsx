import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wrench,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  Send,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";
import { useClientAuth } from "../../context/ClientAuthContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function PrendreRendezVous() {
  const { t } = usePublicLang();
  const { client, isAuthenticated } = useClientAuth();
  const navigate = useNavigate();

  const [etape, setEtape] = useState(1);
  const [config, setConfig] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceChoisi, setServiceChoisi] = useState(null);
  const [dateChoisie, setDateChoisie] = useState("");
  const [creneaux, setCreneaux] = useState([]);
  const [creneauChoisi, setCreneauChoisi] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [chargementCreneaux, setChargementCreneaux] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);
  const [rdvCree, setRdvCree] = useState(null);

  const [form, setForm] = useState({
    nom_client: "",
    email_client: "",
    telephone_client: "",
    description: "",
  });

  useEffect(() => {
    if (client) {
      setForm({
        nom_client: client.nom || "",
        email_client: client.email || "",
        telephone_client: client.telephone || "",
        description: "",
      });
    }
  }, [client]);

  useEffect(() => {
    chargerConfig();
  }, []);

  const chargerConfig = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch(`${API_URL}/rdv/config`);
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setServices(data.services || []);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  const chargerCreneaux = async (date, serviceId) => {
    if (!date || !serviceId) return;
    setChargementCreneaux(true);
    try {
      const res = await fetch(
        `${API_URL}/rdv/creneaux?date=${date}&service_id=${serviceId}`
      );
      const data = await res.json();
      if (data.success) {
        setCreneaux(data.creneaux || []);
      }
    } catch (err) {
      setErreur("Impossible de charger les créneaux");
    } finally {
      setChargementCreneaux(false);
    }
  };

  const choisirService = (service) => {
    setServiceChoisi(service);
    setEtape(2);
    setDateChoisie("");
    setCreneaux([]);
    setCreneauChoisi(null);
  };

  const choisirDate = (date) => {
    setDateChoisie(date);
    setCreneauChoisi(null);
    if (serviceChoisi) {
      chargerCreneaux(date, serviceChoisi.id);
    }
  };

  const confirmerCreneau = () => {
    if (!creneauChoisi) {
      setErreur("Sélectionnez un créneau");
      return;
    }
    setEtape(3);
  };

  const envoyerDemande = async () => {
    setErreur(null);

    if (!form.nom_client || !form.telephone_client) {
      setErreur("Nom et téléphone requis");
      return;
    }

    setChargement(true);
    try {
      const token = localStorage.getItem("client_token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/rdv`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          service_id: serviceChoisi.id,
          nom_client: form.nom_client,
          email_client: form.email_client,
          telephone_client: form.telephone_client,
          date_rdv: dateChoisie,
          heure_debut: creneauChoisi.heure_debut,
          description: form.description,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setRdvCree(data.rdv);
        setEtape(4);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Erreur serveur");
    } finally {
      setChargement(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrix = (n) =>
    Number(n || 0).toLocaleString("fr-FR");

  const genererDates = () => {
    if (!config) return [];
    const dates = [];
    const aujourdhui = new Date();
    const limite = new Date();
    limite.setDate(aujourdhui.getDate() + parseInt(config.max_jours_avenir));

    for (let i = 0; i <= parseInt(config.max_jours_avenir); i++) {
      const d = new Date(aujourdhui);
      d.setDate(d.getDate() + i);
      const jourSemaine = d.getDay() === 0 ? 7 : d.getDay();
      const joursOuverts = config.jours_ouverts.split(",");
      if (joursOuverts.includes(String(jourSemaine))) {
        dates.push(d.toISOString().slice(0, 10));
      }
    }
    return dates;
  };

  // ===== RENDU =====
  if (chargement && !config) {
    return (
      <div className="public-page min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#67E8F9]" />
      </div>
    );
  }

  return (
    <div className="public-page">
      {/* HERO */}
      <section className="gradient-hero py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] mb-4 shadow-2xl">
            <Wrench size={40} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Prendre rendez-vous
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {config?.message_accueil || "Réservez un créneau avec notre technicien"}
          </p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="py-12 bg-[#0A1628]">
        <div className="public-container max-w-4xl">
          {/* Barre de progression */}
          {etape < 4 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                      etape >= n
                        ? "bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] text-white"
                        : "bg-white/10 text-gray-400"
                    }`}
                  >
                    {etape > n ? <Check size={18} /> : n}
                  </div>
                  {n < 3 && (
                    <div
                      className={`w-12 h-0.5 ${
                        etape > n ? "bg-[#06B6D4]" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {erreur && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{erreur}</p>
            </div>
          )}

          {/* ÉTAPE 1 : CHOISIR SERVICE */}
          {etape === 1 && (
            <div className="anim-fade-up">
              <h2 className="text-xl font-bold mb-4 text-center">
                Quel service souhaitez-vous ?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => choisirService(s)}
                    className="public-card p-5 text-left hover:border-[#06B6D4]/50 transition group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl flex-shrink-0">{s.icone}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1">{s.nom}</h3>
                        {s.description && (
                          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                            {s.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {s.duree_minutes} min
                          </span>
                          <span className="flex items-center gap-1 text-[#67E8F9] font-bold">
                            {parseFloat(s.tarif) > 0
                              ? `${formatPrix(s.tarif)} Ar`
                              : "Gratuit"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={20}
                        className="text-gray-500 group-hover:text-[#67E8F9] transition flex-shrink-0"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : CHOISIR DATE + CRÉNEAU */}
          {etape === 2 && serviceChoisi && (
            <div className="anim-fade-up">
              <button
                onClick={() => setEtape(1)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#67E8F9] mb-4 transition"
              >
                <ArrowLeft size={16} />
                Retour aux services
              </button>

              <div className="public-card p-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{serviceChoisi.icone}</span>
                  <div className="flex-1">
                    <p className="font-bold">{serviceChoisi.nom}</p>
                    <p className="text-xs text-gray-400">
                      {serviceChoisi.duree_minutes} min ·{" "}
                      {parseFloat(serviceChoisi.tarif) > 0
                        ? `${formatPrix(serviceChoisi.tarif)} Ar`
                        : "Gratuit"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Choix date */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Calendar size={14} />
                  Choisissez une date
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-2">
                  {genererDates().map((d) => {
                    const dateObj = new Date(d + "T00:00:00");
                    const label = dateObj.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    });
                    const jourLabel = dateObj.toLocaleDateString("fr-FR", {
                      weekday: "short",
                    });
                    return (
                      <button
                        key={d}
                        onClick={() => choisirDate(d)}
                        className={`p-2 rounded-lg text-center transition ${
                          dateChoisie === d
                            ? "bg-[#06B6D4] text-white"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <p className="text-xs capitalize">{jourLabel}</p>
                        <p className="text-sm font-bold">{label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Créneaux */}
              {dateChoisie && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <Clock size={14} />
                    Choisissez un créneau
                  </label>

                  {chargementCreneaux ? (
                    <div className="text-center py-6">
                      <Loader2 size={24} className="animate-spin text-[#67E8F9] mx-auto" />
                    </div>
                  ) : creneaux.length === 0 ? (
                    <div className="bg-white/5 rounded-lg p-4 text-center text-sm text-gray-400">
                      Aucun créneau disponible ce jour
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {creneaux.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setCreneauChoisi(c)}
                          disabled={!c.disponible}
                          className={`p-2 rounded-lg text-center transition text-sm font-medium ${
                            creneauChoisi?.heure_debut === c.heure_debut
                              ? "bg-[#06B6D4] text-white"
                              : c.disponible
                              ? "bg-white/5 text-gray-300 hover:bg-white/10"
                              : "bg-gray-800 text-gray-600 cursor-not-allowed"
                          }`}
                        >
                          {c.heure_debut}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {creneauChoisi && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={confirmerCreneau}
                    className="btn-public-cyan"
                  >
                    Continuer
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 3 : INFOS CLIENT */}
          {etape === 3 && creneauChoisi && (
            <div className="anim-fade-up">
              <button
                onClick={() => setEtape(2)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#67E8F9] mb-4 transition"
              >
                <ArrowLeft size={16} />
                Retour au calendrier
              </button>

              <div className="public-card p-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{serviceChoisi.icone}</div>
                  <div className="flex-1">
                    <p className="font-bold">{serviceChoisi.nom}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(dateChoisie)} · {creneauChoisi.heure_debut} →{" "}
                      {creneauChoisi.heure_fin}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <User size={14} className="inline mr-1" />
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={form.nom_client}
                    onChange={(e) =>
                      setForm({ ...form, nom_client: e.target.value })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      <Phone size={14} className="inline mr-1" />
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={form.telephone_client}
                      onChange={(e) =>
                        setForm({ ...form, telephone_client: e.target.value })
                      }
                      className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      <Mail size={14} className="inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email_client}
                      onChange={(e) =>
                        setForm({ ...form, email_client: e.target.value })
                      }
                      className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <FileText size={14} className="inline mr-1" />
                    Décrivez votre besoin
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={4}
                    placeholder="Ex: Mon PC ne démarre plus, écran bleu..."
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={envoyerDemande}
                    disabled={chargement}
                    className="btn-public-cyan disabled:opacity-50"
                  >
                    {chargement ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Confirmer le rendez-vous
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : SUCCÈS */}
          {etape === 4 && rdvCree && (
            <div className="anim-fade-up text-center">
              <div className="inline-flex p-6 rounded-full bg-green-500/20 mb-4">
                <CheckCircle2 size={64} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Rendez-vous enregistré !
              </h2>
              <p className="text-gray-400 mb-6">
                Votre demande a bien été enregistrée. Nous vous confirmerons
                rapidement.
              </p>

              <div className="public-card p-6 max-w-md mx-auto text-left">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Référence
                </p>
                <p className="font-mono font-bold text-[#67E8F9] text-lg mb-3">
                  {rdvCree.reference}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service</span>
                    <span className="font-medium">
                      {serviceChoisi.nom}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span className="font-medium">
                      {formatDate(dateChoisie)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Heure</span>
                    <span className="font-medium">
                      {creneauChoisi.heure_debut} → {creneauChoisi.heure_fin}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-gray-400">Statut</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30">
                      En attente de confirmation
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center mt-6">
                <Link to="/" className="btn-public-outline">
                  Retour à l'accueil
                </Link>
                {isAuthenticated && (
                  <Link to="/mon-compte" className="btn-public-cyan">
                    Voir mes rendez-vous
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}