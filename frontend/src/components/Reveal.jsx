import useScrollReveal from "../hooks/useScrollReveal";

/**
 * Wrapper qui anime ses enfants au scroll
 *
 * Props :
 * - children : contenu
 * - delay : délai en secondes (défaut 0)
 * - direction : "up" | "down" | "left" | "right" (défaut "up")
 * - className : classes CSS additionnelles
 *
 * Usage :
 * <Reveal delay={0.2}>
 *   <div>Contenu animé</div>
 * </Reveal>
 */
export default function Reveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}) {
  const ref = useScrollReveal();

  const directions = {
    up: "reveal-up",
    down: "reveal-down",
    left: "reveal-left",
    right: "reveal-right",
  };

  return (
    <div
      ref={ref}
      className={`reveal ${directions[direction] || "reveal-up"} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}