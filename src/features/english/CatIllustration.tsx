interface CatIllustrationProps {
  label?: string;
}

export function CatIllustration({label}: CatIllustrationProps) {
  return (
    <svg
      className="cat-illustration"
      viewBox="0 0 260 230"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path className="cat-tail" d="M187 170c46 8 56-36 30-49-17-8-28 7-16 19" />
      <path className="cat-body" d="M69 174c0-52 27-82 63-82s62 30 62 82v31H69z" />
      <path className="cat-head" d="M73 84 78 25l38 25c10-4 22-4 32 0l37-25 6 59c0 36-25 60-59 60S73 120 73 84Z" />
      <path className="cat-ear" d="m89 47 4 28 16-17zM174 47l-4 28-16-17z" />
      <circle className="cat-eye" cx="108" cy="88" r="5" />
      <circle className="cat-eye" cx="156" cy="88" r="5" />
      <path className="cat-face" d="m127 104 5 5 5-5M132 109c-3 8-10 10-16 7m16-7c3 8 10 10 16 7M91 106l-28-5m29 16-31 4m112-15 28-5m-29 16 31 4" />
      <path className="cat-paw" d="M91 205v-30m82 30v-30" />
    </svg>
  );
}
