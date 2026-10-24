import { useState, useCallback } from "react";

export function useForm(initialValues, validateFn) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      // Valider en temps réel si déjà touché
      if (touched[name] && validateFn) {
        const newErrors = validateFn({ ...values, [name]: value });
        setErrors((prev) => ({ ...prev, [name]: newErrors[name] }));
      }
    },
    [values, touched, validateFn]
  );

  const handleBlur = useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      if (validateFn) {
        const newErrors = validateFn(values);
        setErrors((prev) => ({ ...prev, [name]: newErrors[name] }));
      }
    },
    [values, validateFn]
  );

  const validerTout = useCallback(() => {
    if (!validateFn) return true;
    const newErrors = validateFn(values);
    setErrors(newErrors);
    const tousTouches = {};
    Object.keys(values).forEach((k) => (tousTouches[k] = true));
    setTouched(tousTouches);
    return Object.keys(newErrors).length === 0;
  }, [values, validateFn]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldError = useCallback((name, message) => {
    setErrors((prev) => ({ ...prev, [name]: message }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validerTout,
    reset,
    setFieldError,
    setValues,
  };
}

/**
 * Validateurs prêts à l'emploi
 */
export const validateurs = {
  requis: (valeur, nom = "Ce champ") =>
    !valeur || (typeof valeur === "string" && !valeur.trim())
      ? `${nom} est obligatoire`
      : null,

  email: (valeur) =>
    valeur && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur)
      ? "Adresse email invalide"
      : null,

  minLength: (valeur, min, nom = "Ce champ") =>
    valeur && valeur.length < min
      ? `${nom} doit contenir au moins ${min} caractères`
      : null,

  maxLength: (valeur, max, nom = "Ce champ") =>
    valeur && valeur.length > max
      ? `${nom} ne doit pas dépasser ${max} caractères`
      : null,

  nombre: (valeur, nom = "Ce champ") =>
    valeur && isNaN(Number(valeur)) ? `${nom} doit être un nombre` : null,

  positif: (valeur, nom = "Ce champ") =>
    valeur && Number(valeur) < 0 ? `${nom} doit être positif` : null,

  telephone: (valeur) =>
    valeur && !/^[0-9\s+\-()]{8,}$/.test(valeur)
      ? "Numéro de téléphone invalide"
      : null,
};