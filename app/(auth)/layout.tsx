import type { Metadata } from "next";
import { Shield, Lock, Users, Layers, Heart, ChevronRight } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "LIFE — Personal Legacy, Security & Continuity",
  description:
    "Your private, encrypted personal asset registry, financial ledger, and continuity management system. Access securely.",
};

const features = [
  {
    icon: Lock,
    label: "Encrypted Vault",
    desc: "AES-256-GCM secured secrets",
  },
  {
    icon: Users,
    label: "People Directory",
    desc: "Personal dossiers & delegations",
  },
  {
    icon: Layers,
    label: "Business Continuity",
    desc: '"If I Am Not Available" plans',
  },
  {
    icon: Heart,
    label: "Legacy Messages",
    desc: "Condition-released letters",
  },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex min-h-dvh w-full overflow-x-hidden bg-[#06080f] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/4 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-blue-600/8 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />
      </div>

      <aside className="relative z-10 hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 shadow-lg shadow-violet-700/30 shrink-0 overflow-hidden">
            <Image
              src="/assets/images/logo.png"
              alt="Life Logo"
              fill
              className="object-cover"
              priority
              sizes="40px"
            />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white shrink-0">
            LIFE
          </span>
          <span className="ml-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-violet-300 shrink-0">
            Private
          </span>
        </div>

        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <Shield
              className="h-3.5 w-3.5 text-violet-400 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-white/80 tracking-wide">
              Personal Legacy & Continuity System
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
              Everything that
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                matters to you,
              </span>
              <br />
              protected.
            </h1>
            <p className="max-w-sm text-sm xl:text-base leading-relaxed text-white/75">
              A private vault for your assets, debts, business continuity plans,
              and legacy messages — secured so the right people can act when you
              cannot.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="group flex items-start gap-3 rounded-2xl border border-white/8 bg-white/4 p-4 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/30 hover:bg-white/7"
                role="listitem"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/30 to-indigo-600/20 group-hover:from-violet-500/40">
                  <Icon
                    className="h-4 w-4 text-violet-300 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">
                    {label}
                  </p>
                  <p className="text-xs text-white/65 mt-0.5 leading-snug">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-white/65">
            <ChevronRight
              className="h-3.5 w-3.5 text-violet-500 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
            Sign in to access your secure dashboard
          </div>
        </div>

        <p className="text-[11px] text-white/60">
          © {new Date().getFullYear()} LIFE — Strictly private. Zero third-party
          analytics.
        </p>
      </aside>

      <main className="relative z-10 flex w-full flex-col items-center justify-center lg:w-[48%] xl:w-[45%] px-5 py-10 sm:px-10 text-white">
        <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 shadow-lg shadow-violet-700/30 shrink-0 overflow-hidden">
            <Image
              src="/assets/images/logo.png"
              alt="Life Logo"
              fill
              className="object-cover"
              priority
              sizes="48px"
            />
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight text-white">
              LIFE
            </p>
            <p className="mt-1 text-xs text-white/65">
              Personal Legacy & Continuity
            </p>
          </div>
        </div>

        <div className="w-full max-w-[420px] text-white">
          <div className="rounded-3xl border border-white/8 bg-white/4 p-2 text-white shadow-[0_32px_80px_-20px_rgba(109,40,217,0.25)] backdrop-blur-2xl">
            {children}
          </div>

          <p className="mt-5 text-center text-[11px] text-white/60 leading-relaxed">
            Access is restricted to authorized individuals only.
            <br />
            All sessions are logged and audited.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Layout;
