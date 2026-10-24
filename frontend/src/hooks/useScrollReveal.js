import { useEffect, useRef } from "react";

/**
 * Hook pour détecter quand un élément entre dans le viewport
 * Ajoute la classe "visible" quand c'est le cas
 *
 * Usage :
 * const ref = useScrollReveal();
 * <div ref={ref} className="reveal">...</div>
 */
export default function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Si IntersectionObserver n'est pas supporté, afficher directement
    if (!("IntersectionObserver" in window)) {
      element.classList.add("visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            // Une fois visible, on arrête d'observer (animation unique)
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options.threshold || 0.15,
        rootMargin: options.rootMargin || "0px 0px -50px 0px",
      }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin]);

  return ref;
}