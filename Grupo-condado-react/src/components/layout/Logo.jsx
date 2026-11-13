export default function Logo({ size = 42, className = "brand-logo" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
      <rect width="42" height="42" rx="8" fill="#ffffff" />
      <path d="M11 30V14.5L21 9l10 5.5V30h-6v-8h-8v8h-6z" fill="#6c2d20" />
      <rect x="18.5" y="17" width="2.4" height="2.4" fill="#ffffff" />
      <rect x="22.6" y="17" width="2.4" height="2.4" fill="#ffffff" />
      <rect x="18.5" y="21.2" width="2.4" height="2.4" fill="#ffffff" />
      <rect x="22.6" y="21.2" width="2.4" height="2.4" fill="#ffffff" />
    </svg>
  );
}
