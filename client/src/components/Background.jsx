export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-48 -left-40 h-[540px] w-[540px] rounded-full bg-brand-500/[0.055] blur-[140px] animate-float-slow" />
      <div className="absolute top-1/3 -right-44 h-[520px] w-[520px] rounded-full bg-sky-500/[0.045] blur-[150px] animate-float-slower" />
      <div className="absolute -bottom-48 left-1/4 h-[440px] w-[440px] rounded-full bg-zinc-400/[0.03] blur-[140px] animate-float-slow" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 75%)',
        }}
      />
    </div>
  );
}
