type Avatar = {
  name: string;
  className: string;
  hairPath: string;
};

const avatars: Avatar[] = [
  { name: "Maya", className: "lp-avatar-sand", hairPath: "M12 25c-1-10 4-16 12-16 7 0 12 5 12 15-2-3-5-5-9-5-6 0-10 3-15 6Z" },
  { name: "Alex", className: "lp-avatar-sky", hairPath: "M11 22c1-9 6-14 13-14 8 0 13 6 13 15-3-2-5-4-8-4-6 0-11 2-18 3Z" },
  { name: "Riley", className: "lp-avatar-mint", hairPath: "M10 26c-1-11 4-19 14-19 9 0 15 8 14 19l-4-4c-2-7-7-10-11-10-6 0-10 4-13 14Z" },
  { name: "Taylor", className: "lp-avatar-coral", hairPath: "M12 24c0-10 5-16 12-16 8 0 12 6 12 16-3-4-7-6-12-6-4 0-8 2-12 6Z" }
];

export function HeroAvatarStack() {
  return (
    <div className="lp-avatar-stack" aria-label="Blithob Pro job seeker community">
      {avatars.map(({ name, className, hairPath }) => (
        <span
          className={`lp-avatar ${className}`}
          key={name}
          role="img"
          aria-label={`Blithob Pro job seeker ${name}`}
        >
          <svg viewBox="0 0 48 48" focusable="false" aria-hidden="true">
            <circle cx="24" cy="24" r="23" fill="var(--avatar-bg)" />
            <path d="M7 48c1-9 8-15 17-15s16 6 17 15" fill="var(--avatar-shirt)" />
            <ellipse cx="24" cy="26" rx="9" ry="11" fill="var(--avatar-skin)" />
            <path d={hairPath} fill="var(--avatar-hair)" />
            <circle cx="20.5" cy="26" r="1.1" fill="var(--avatar-ink)" />
            <circle cx="27.5" cy="26" r="1.1" fill="var(--avatar-ink)" />
            <path d="M21 31c2 1.5 4 1.5 6 0" fill="none" stroke="var(--avatar-ink)" strokeLinecap="round" strokeWidth="1.2" />
          </svg>
        </span>
      ))}
    </div>
  );
}
