import { Wifi } from "lucide-react";

/**
 * Logo Cyber Famille Solofoson
 * - SVG stylisé avec les initiales "CF"
 * - Icône Wi-Fi intégrée
 * - Dégradé bleu/cyan
 *
 * Props :
 * - size : "sm" | "md" | "lg" (défaut "md")
 * - showText : booléen (défaut true)
 * - variant : "public" (cyan) | "admin" (orange)
 */
export default function Logo({ size = "md", showText = true, variant = "public" }) {
  const sizes = {
    sm: { box: 32, icon: 16, titre: "text-sm", sous: "text-[10px]" },
    md: { box: 42, icon: 22, titre: "text-lg", sous: "text-xs" },
    lg: { box: 56, icon: 30, titre: "text-2xl", sous: "text-sm" },
  };

  const s = sizes[size] || sizes.md;

  const couleurs =
    variant === "admin"
      ? {
          gradient: "from-[#F97316] to-[#EA580C]",
          shadow: "shadow-orange-500/30",
          sous: "text-[#FDBA74]",
        }
      : {
          gradient: "from-[#06B6D4] to-[#1E40AF]",
          shadow: "shadow-cyan-500/30",
          sous: "text-[#67E8F9]",
        };

  return (
    <div className="flex items-center gap-3 group">
      {/* Logo SVG avec initiales CF + Wi-Fi */}
      <div
        className={`relative bg-gradient-to-br ${couleurs.gradient} rounded-xl shadow-lg ${couleurs.shadow} group-hover:scale-105 transition-transform flex items-center justify-center`}
        style={{ width: s.box, height: s.box }}
      >
        {/* Initiales "CF" en arrière-plan */}
        <span
          className="absolute font-black text-white/25 select-none"
          style={{ fontSize: s.box * 0.55, lineHeight: 1 }}
        >
          CF
        </span>

        {/* Icône Wi-Fi au premier plan */}
        <Wifi
          size={s.icon}
          className="text-white relative z-10 drop-shadow-md"
          strokeWidth={2.5}
        />
      </div>

      {/* Texte */}
      {showText && (
        <div>
          <h1 className={`font-bold ${s.titre} leading-tight`}>
            Cyber Famille
          </h1>
          <p className={`${s.sous} ${couleurs.sous} font-medium`}>
            Solofoson · Starlink
          </p>
        </div>
      )}
    </div>
  );
}