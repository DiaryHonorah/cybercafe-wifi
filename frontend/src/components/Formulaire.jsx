import { AlertCircle } from "lucide-react";

export function Champ({
  label,
  erreur,
  aide,
  obligatoire,
  icon: Icon,
  children,
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
          {label}
          {obligatoire && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-3 top-3.5 text-gray-500 pointer-events-none"
          />
        )}
        {children}
      </div>
      {aide && !erreur && (
        <p className="text-xs text-gray-500 mt-1.5">{aide}</p>
      )}
      {erreur && (
        <div className="flex items-start gap-1.5 mt-1.5 animate-slide-down">
          <AlertCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />
          <p className="text-xs text-danger">{erreur}</p>
        </div>
      )}
    </div>
  );
}

export function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  erreur,
  icon,
  disabled,
  autoFocus,
  ...props
}) {
  const base =
    "w-full bg-night border rounded-lg py-3 pr-3 text-white focus:outline-none transition";
  const padding = icon ? "pl-10" : "pl-3";
  const couleur = erreur
    ? "border-danger/50 focus:border-danger"
    : "border-white/10 focus:border-accent";

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-3.5 text-gray-500 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`${base} ${padding} ${couleur} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        {...props}
      />
    </div>
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  erreur,
  rows = 3,
  ...props
}) {
  const base =
    "w-full bg-night border rounded-lg p-3 text-white focus:outline-none transition resize-none";
  const couleur = erreur
    ? "border-danger/50 focus:border-danger"
    : "border-white/10 focus:border-accent";

  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`${base} ${couleur}`}
      {...props}
    />
  );
}

export function Select({
  value,
  onChange,
  erreur,
  children,
  ...props
}) {
  const base =
    "w-full bg-night border rounded-lg p-3 text-white focus:outline-none transition";
  const couleur = erreur
    ? "border-danger/50 focus:border-danger"
    : "border-white/10 focus:border-accent";

  return (
    <select value={value} onChange={onChange} className={`${base} ${couleur}`} {...props}>
      {children}
    </select>
  );
}

/**
 * Bouton avec état de chargement
 */
export function Bouton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  icon: Icon,
  chargement = false,
  disabled = false,
  className = "",
}) {
  const variants = {
    primary: "bg-accent hover:bg-accentDark text-white",
    secondary: "bg-white/5 hover:bg-white/10 text-white",
    success: "bg-success hover:bg-success/80 text-white",
    danger: "bg-danger hover:bg-danger/80 text-white",
    cyan: "bg-cyan hover:bg-cyan/80 text-night",
    ghost: "bg-transparent hover:bg-white/5 text-gray-300",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || chargement}
      className={`${variants[variant]} font-semibold py-3 px-5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {chargement ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Chargement...
        </>
      ) : (
        <>
          {Icon && <Icon size={18} />}
          {children}
        </>
      )}
    </button>
  );
}