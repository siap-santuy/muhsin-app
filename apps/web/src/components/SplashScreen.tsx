export function SplashScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-[#EFF8FC] via-[#F5FAFD] to-[#FFFFFF] px-6 py-10 text-center">
      {/* Spacer */}
      <div />

      {/* Main Content (Mascot + Title) */}
      <div className="my-auto flex flex-col items-center gap-4">
        <img
          src="/brand/muhsin_learn.png"
          alt="Mascot Muhsin"
          className="h-44 w-44 object-contain drop-shadow-sm"
        />
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-wider text-[#1CB8CE]">
            MUHSIN
          </h1>
          <p className="text-sm font-semibold tracking-wide text-[#0C2B50]">
            Membangun Generasi Qur'ani
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex w-full max-w-xs flex-col items-center gap-1.5">
        <div className="h-[1px] w-48 bg-slate-300/80" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#1CB8CE]">
          SMP IT AL FITRAH
        </h2>
        <div className="space-y-0.5 text-xs text-slate-400">
          <p>
            Powered by <span className="font-semibold text-slate-600">MuhsinApp</span>
          </p>
          <p className="text-[10px] text-slate-400">v1.0.1</p>
        </div>
      </div>
    </div>
  );
}
