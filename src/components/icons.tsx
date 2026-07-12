// Lightweight stroke icons (Lucide-style paths), no external dependency.
type P = { className?: string };
const base = "h-[18px] w-[18px]";
const svg = (name: string, children: React.ReactNode) => {
  const Icon = ({ className }: P) => (
    <svg
      className={`${base} ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
};

export const IconDashboard = svg(
  "IconDashboard",
  <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>,
);

export const IconVehicle = svg(
  "IconVehicle",
  <>
    <path d="M3 7h11v9H3z" />
    <path d="M14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17.5" cy="18" r="1.6" />
  </>,
);

export const IconDriver = svg(
  "IconDriver",
  <>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
  </>,
);

export const IconTrip = svg(
  "IconTrip",
  <>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6" />
  </>,
);

export const IconMaintenance = svg(
  "IconMaintenance",
  <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8 7.2 20l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.3-2.3z" />,
);

export const IconFuel = svg(
  "IconFuel",
  <>
    <path d="M4 20V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15" />
    <path d="M3 20h11" />
    <path d="M13 8h3l2 2v6a2 2 0 0 0 2-2V9l-3-3" />
    <path d="M7 8h3" />
  </>,
);

export const IconExpense = svg(
  "IconExpense",
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <path d="M7 15h4" />
  </>,
);

export const IconReport = svg(
  "IconReport",
  <>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8 16v-5" />
    <path d="M13 16V7" />
    <path d="M18 16v-8" />
  </>,
);
