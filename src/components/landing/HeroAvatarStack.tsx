type Avatar = {
  name: string;
  src: string;
};

const avatars: Avatar[] = [
  { name: "Amara", src: "/landing/avatars/avatar-1.webp" },
  { name: "Tunde", src: "/landing/avatars/avatar-2.webp" },
  { name: "Zainab", src: "/landing/avatars/avatar-3.webp" },
  { name: "Kofi", src: "/landing/avatars/avatar-4.webp" }
];

export function HeroAvatarStack() {
  return (
    <div className="lp-avatar-stack" aria-label="Blithob Pro job seeker community">
      {avatars.map(({ name, src }) => (
        <img
          key={name}
          src={src}
          alt={`Blithob Pro job seeker ${name}`}
          className="lp-avatar-photo"
          width={40}
          height={40}
          loading="eager"
          decoding="async"
        />
      ))}
    </div>
  );
}
