import { Logo } from "@/components/vybe/logo";
import { OrbitField } from "@/components/vybe/orbit-field";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <div className="pointer-events-none absolute -top-40 left-1/2 w-[900px] max-w-none -translate-x-1/2 opacity-40" aria-hidden="true">
        <OrbitField
          showThreads={false}
          nodes={[
            { id: "a", ring: 1, angle: 30, hue: "blush", scale: 0.8 },
            { id: "b", ring: 2, angle: 160, hue: "indigo", scale: 0.7 },
            { id: "c", ring: 2, angle: 320, hue: "violet", scale: 0.6 },
          ]}
        />
      </div>
      <header className="relative px-4 pt-6 sm:px-6">
        <Logo />
      </header>
      <main id="main" className="relative flex flex-1 items-start justify-center px-4 pt-10 pb-16 sm:items-center sm:pt-0">
        <div className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-black/40 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
