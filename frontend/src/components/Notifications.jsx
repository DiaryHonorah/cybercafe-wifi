import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, CheckCheck, X, Wifi, WifiOff, Loader2 } from "lucide-react";
import api from "../api";
import { useWebSocket } from "../context/WebSocketContext";

export default function Notifications() {
  const [ouvert, setOuvert] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [marquageEnCours, setMarquageEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const clocheRef = useRef(null);
  const panneauRef = useRef(null);

  const { connecte, souscrire } = useWebSocket();

  // ==========================================
  // CHARGER LES NOTIFICATIONS
  // ==========================================
  const charger = useCallback(async () => {
    try {
      const r1 = await api.get("/api/notifications").catch(() => ({ data: [] }));
      const r2 = await api.get("/api/notifications/non-lues").catch(() => ({ data: { count: 0 } }));
      const liste = Array.isArray(r1.data) ? r1.data : [];
      const count = Number(r2.data?.count) || 0;
      setNotifs(liste);
      setNonLues(count);
      setErreur("");
    } catch (e) {
      console.warn("[Notifs] Erreur chargement :", e);
      setErreur("Impossible de charger les notifications");
    }
  }, []);

  // ==========================================
  // CHARGEMENT INITIAL + POLLING
  // ==========================================
  useEffect(() => {
    charger();
    const interval = setInterval(charger, 15000);
    return () => clearInterval(interval);
  }, [charger]);

  // ==========================================
  // ÉCOUTE WEBSOCKET
  // ==========================================
  useEffect(() => {
    const desouscrire = souscrire(() => {
      charger();
    });
    return () => desouscrire();
  }, [souscrire, charger]);

  // ==========================================
  // FERMER AU CLIC EXTÉRIEUR (sur cloche OU panneau)
  // ==========================================
  useEffect(() => {
    const handler = (e) => {
      const dansCloche = clocheRef.current && clocheRef.current.contains(e.target);
      const dansPanneau = panneauRef.current && panneauRef.current.contains(e.target);
      if (!dansCloche && !dansPanneau) {
        setOuvert(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ==========================================
  // BLOQUER LE SCROLL SUR MOBILE
  // ==========================================
  useEffect(() => {
    if (ouvert && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [ouvert]);

  // ==========================================
  // ⭐ TOUT LIRE — Avec logs de vérification
  // ==========================================
  const toutLire = async () => {
    console.log("[Notifs] 🖱 CLIC TOUT LIRE");

    if (marquageEnCours) {
      console.log("[Notifs] ⏸ Déjà en cours");
      return;
    }
    if (nonLues === 0) {
      console.log("[Notifs] ℹ️ Rien à marquer");
      return;
    }

    setMarquageEnCours(true);
    setErreur("");

    // Mise à jour optimiste
    const ancienNonLues = nonLues;
    const ancienNotifs = [...notifs];
    setNonLues(0);
    setNotifs((prev) => prev.map((n) => ({ ...n, lue: 1 })));

    try {
      console.log("[Notifs] 📡 POST /api/notifications/lire");
      const reponse = await api.post("/api/notifications/lire");
      console.log("[Notifs] ✅ Réponse :", reponse.data);
      await charger();
    } catch (e) {
      console.error("[Notifs] ❌ Erreur :", e);
      setNonLues(ancienNonLues);
      setNotifs(ancienNotifs);
      setErreur("Erreur lors du marquage");
    } finally {
      setMarquageEnCours(false);
    }
  };

  // ==========================================
  // CLIC SUR UNE NOTIFICATION
  // ==========================================
  const clicNotif = async (notif) => {
    if (notif.lue) return;

    setNotifs((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, lue: 1 } : n))
    );
    setNonLues((prev) => Math.max(0, prev - 1));

    try {
      await api.post("/api/notifications/lire-une", { id: notif.id });
    } catch (e) {
      console.warn(e);
      charger();
    }
  };

  const icones = {
    vente: "🛒",
    session: "🌐",
    expiration: "⏰",
    systeme: "ℹ️",
  };

  const toutesLues = nonLues === 0;

  return (
    <>
      {/* ===== Bouton cloche (dans le header) ===== */}
      <div className="relative" ref={clocheRef}>
        <button
          type="button"
          onClick={() => setOuvert(!ouvert)}
          className="relative p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {nonLues > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center">
              {nonLues > 99 ? "99+" : nonLues}
            </span>
          )}
        </button>
      </div>

      {/* ===== Panneau desktop ===== */}
      {ouvert && window.innerWidth >= 768 && (
        <>
          {/* Overlay qui ferme le panneau si on clique dessus */}
          <div
            className="fixed inset-0 bg-transparent z-[95]"
            onClick={() => setOuvert(false)}
          />

          {/* Panneau, au-dessus de l'overlay */}
          <div
            ref={panneauRef}
            className="fixed top-16 right-4 sm:right-6 lg:right-8 w-[400px] max-w-[calc(100vw-2rem)] bg-panel border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            {/* En-tête */}
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">
                  Notifications
                  {nonLues > 0 && (
                    <span className="ml-2 bg-danger text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                      {nonLues}
                    </span>
                  )}
                </h3>
                <span
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                    connecte
                      ? "bg-success/20 text-success"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {connecte ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {connecte ? "Live" : "Off"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {nonLues > 0 && (
                  <button
                    type="button"
                    onClick={toutLire}
                    disabled={marquageEnCours}
                    className="text-xs text-accent hover:text-accentDark font-semibold flex items-center gap-1 disabled:opacity-50 px-2 py-1 rounded hover:bg-accent/10 transition"
                  >
                    {marquageEnCours ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CheckCheck size={12} />
                    )}
                    {marquageEnCours ? "..." : "Tout lire"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOuvert(false)}
                  className="text-gray-400 hover:text-white p-1 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Bandeau erreur */}
            {erreur && (
              <div className="bg-danger/10 border-b border-danger/30 px-4 py-2 text-xs text-danger">
                {erreur}
              </div>
            )}

            {/* Bandeau "tout lu" */}
            {toutesLues && notifs.length > 0 && !erreur && (
              <div className="bg-success/5 border-b border-success/20 px-4 py-2 flex items-center gap-2">
                <CheckCheck size={14} className="text-success" />
                <span className="text-xs text-success font-medium">
                  Toutes les notifications sont lues
                </span>
              </div>
            )}

            {/* Liste */}
            <div className="max-h-[60vh] overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-12">
                  Aucune notification pour le moment
                </p>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => clicNotif(n)}
                    className={`p-4 border-b border-white/5 last:border-0 transition cursor-pointer ${
                      !n.lue
                        ? "bg-accent/5 hover:bg-accent/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className="text-lg flex-shrink-0">
                        {icones[n.type] || "🔔"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm break-words ${
                            !n.lue
                              ? "font-semibold text-white"
                              : "font-medium text-gray-300"
                          }`}
                        >
                          {n.titre}
                        </p>
                        {n.message && (
                          <p className="text-xs text-gray-400 mt-1 break-words">
                            {n.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(n.cree_le).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      {!n.lue && (
                        <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pied */}
            {notifs.length > 0 && (
              <div className="p-3 border-t border-white/5 bg-night/50 text-center">
                <span className="text-xs text-gray-500">
                  {notifs.length} notification{notifs.length > 1 ? "s" : ""}
                  {nonLues > 0 && (
                    <>
                      {" · "}
                      <b className="text-accent">
                        {nonLues} non lue{nonLues > 1 ? "s" : ""}
                      </b>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== Panneau mobile plein écran ===== */}
      {ouvert && window.innerWidth < 768 && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-night">
          <div className="flex justify-between items-center p-4 border-b border-white/10 bg-panel">
            <h3 className="font-semibold text-base">
              Notifications
              {nonLues > 0 && (
                <span className="ml-2 bg-danger text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {nonLues}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {nonLues > 0 && (
                <button
                  type="button"
                  onClick={toutLire}
                  disabled={marquageEnCours}
                  className="text-xs text-accent font-semibold flex items-center gap-1 px-2 py-1 disabled:opacity-50"
                >
                  {marquageEnCours ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCheck size={14} />
                  )}
                  {marquageEnCours ? "..." : "Tout lire"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-12">
                Aucune notification pour le moment
              </p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => clicNotif(n)}
                  className={`p-4 border-b border-white/5 last:border-0 cursor-pointer ${
                    !n.lue ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-lg flex-shrink-0">
                      {icones[n.type] || "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm break-words ${
                          !n.lue
                            ? "font-semibold text-white"
                            : "font-medium text-gray-300"
                        }`}
                      >
                        {n.titre}
                      </p>
                      {n.message && (
                        <p className="text-xs text-gray-400 mt-1 break-words">
                          {n.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(n.cree_le).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    {!n.lue && (
                      <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}