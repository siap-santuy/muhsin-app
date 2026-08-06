export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0C2B50] p-6 text-white">
      <div className="flex flex-col items-center gap-6">
<div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-white/10" />
          <img
            src="/brand/muhsin_learn.png"
            alt="Logo Muhsin"
            className="relative h-24 w-24 rounded-full object-cover"
          />
        </div>
        <div className="text-center">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
            <img
              src="/brand/moon_star_icon.svg"
              alt=""
              className="h-6 w-6"
            />
            Muhsin
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Manajemen TTQ &amp; Ibadah Yaumiyah Siswa
          </p>
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#22B8CF]" />
        </div>
      </div>
      <p className="absolute bottom-6 text-xs text-white/50">v1.0.0</p>
    </div>
  );
}