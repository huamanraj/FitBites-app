import Image from 'next/image';
import Link from 'next/link';
import AuthRedirect from '@/components/AuthRedirect';

export default function LandingPage() {
  return (
    <>
      <AuthRedirect />

      {/* Navigation */}
      <header>
        <nav className="fixed top-0 z-50 w-full bg-white/85 backdrop-blur-xl backdrop-saturate-[180%] border-b border-black/[0.05]">
          <div className="max-w-[1100px] mx-auto px-5 md:px-10 flex justify-between items-center h-[64px]">
            <Link href="/" className="flex items-center gap-2 no-underline text-black" aria-label="FitBites Home">
              <Image src="/icon.png" alt="FitBites logo" width={28} height={28} className="rounded-md" />
              <span className="font-extrabold text-[1.1rem]">FitBites</span>
            </Link>
            <div className="hidden md:flex gap-6 text-sm text-[#6e6e73]">
              <a href="#workflow" className="hover:text-black transition-colors">How it works</a>
              <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
              <a href="https://github.com/huamanraj/FitBites-app" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">GitHub</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-semibold text-[#6e6e73] hover:text-black transition-colors no-underline"
              >
                Login
              </Link>
              <a
                href="https://github.com/huamanraj/FitBites-app/releases/tag/v1.0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-black rounded-full text-[0.8rem] font-semibold uppercase tracking-[0.05em] no-underline text-black bg-white hover:bg-black hover:text-white transition-all duration-700"
                aria-label="Download FitBites APK"
              >
                APK
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </a>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-[140px] md:pt-[180px] pb-10 text-center">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[30%] w-[min(100vw,800px)] aspect-[4/3] z-[-1] blur-[40px]"
            style={{ background: 'radial-gradient(circle, rgba(255,100,150,0.15) 0%, rgba(255,200,100,0.1) 40%, transparent 70%)' }}
          />

          <div className="max-w-[1100px] mx-auto px-5">
            <p className="font-serif italic text-[1.2rem] text-[#666] mb-4">
              A simple, one-use app.
            </p>
            <h1 className="text-[clamp(2.5rem,12vw,5rem)] font-extrabold leading-[1] tracking-[-0.04em] mb-6">
              Track Calories <br />
              <span className="font-serif italic">Effortlessly.</span>
            </h1>
            <p className="max-w-[540px] mx-auto text-[1.1rem] text-[#6e6e73] leading-relaxed mb-8">
              No bloat. No complex menus. Just open, log, and stay in control.
              FitBites is the free, open-source AI calorie tracker that works like a notes app.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://github.com/huamanraj/FitBites-app/releases/tag/v1.0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white rounded-full font-semibold text-[0.85rem] no-underline hover:opacity-80 transition-opacity"
              >
                Download APK
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 border-[1.5px] border-black rounded-full font-semibold text-[0.85rem] uppercase tracking-[0.05em] no-underline text-black bg-white hover:bg-black hover:text-white transition-all duration-700"
              >
                Try on Web
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Phone Mockup */}
            <div className="mt-10 md:mt-16 flex justify-center px-5">
              <div className="w-full max-w-[280px] md:max-w-[320px] rounded-[44px] border-[10px] border-[#1c1c1e] shadow-[0_40px_80px_rgba(0,0,0,0.12)] bg-white overflow-hidden">
                <div className="bg-white rounded-[34px] overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-[13px] text-[#AAAAAA] font-medium">Today</span>
                      <span className="text-[13px] text-[#333] font-semibold">1450 / 2000 cal</span>
                    </div>
                    {[
                      { name: '2 roti + dal', cal: '320' },
                      { name: 'Masala dosa', cal: '280' },
                      { name: 'Chicken biryani', cal: '450' },
                      { name: 'Green tea', cal: '2' },
                      { name: '1 banana', cal: '105' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-[#F0F0F0]">
                        <span className="text-[15px] font-medium text-[#111]">{item.name}</span>
                        <span className="text-[15px] text-[#111]">{item.cal}</span>
                      </div>
                    ))}
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Type what you ate..."
                        className="w-full text-[15px] text-[#111] placeholder:text-[#CCCCCC] bg-transparent outline-none py-1"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three Steps Section */}
        <section className="max-w-[1100px] mx-auto px-5 md:px-10" id="workflow">
          <div className="py-[100px] md:py-[140px] flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <h2 className="text-[clamp(2.2rem,8vw,3.8rem)] font-extrabold leading-[1.1] tracking-[-0.04em]">
              Three Steps to <br />
              <span className="font-serif italic">Perfect Rhythm</span>
            </h2>
            <p className="max-w-[420px] text-[1.05rem] text-[#6e6e73] leading-[1.6]">
              FitBites removes the friction of daily tracking. Designed for speed, built for simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-15 pb-[80px] md:pb-[140px]">
            {[
              {
                num: '01',
                title: 'Set Your Goals',
                desc: 'Enter your age, weight, and goal. Our AI calculates your ideal daily calorie and macro targets — no guesswork needed.',
              },
              {
                num: '02',
                title: 'Log with AI',
                desc: 'Type naturally: "1 roti" or "100g rice." Our AI instantly calculates calories and macros without manual searching.',
              },
              {
                num: '03',
                title: 'Track Progress',
                desc: 'See your progress with clean charts. A breakdown of protein, carbs, and fats updated in real time — at a glance.',
              },
            ].map((step) => (
              <article key={step.num}>
                <span className="font-serif italic text-[1.8rem] block mb-2 text-[#d1d1d6]">
                  {step.num}
                </span>
                <h4 className="text-[1.2rem] font-bold mb-3">{step.title}</h4>
                <p className="text-[1rem] text-[#6e6e73] leading-relaxed">{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Analytics Preview */}
        <section className="max-w-[1100px] mx-auto px-5 md:px-10">
          <div className="relative rounded-[32px] md:rounded-[40px] overflow-hidden bg-[#fbfbfd] border border-[#f2f2f7] p-[60px_20px] md:p-[100px_0] mb-[100px] text-center">
            <div
              className="absolute top-[-50%] left-[-20%] w-full h-[200%] z-0 blur-[60px]"
              style={{ background: 'radial-gradient(circle, rgba(100,200,255,0.1) 0%, transparent 60%)' }}
            />
            <div className="relative z-10">
              <p className="font-serif italic text-[1.4rem] md:text-[1.8rem] mb-6">Effortless Analytics.</p>
              {/* Chart Mockup */}
              <div className="max-w-[500px] mx-auto bg-white rounded-2xl border-[6px] border-[#111] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-[13px] text-[#AAAAAA] font-medium">This Week</span>
                  <span className="text-[13px] text-[#888]">Avg 1,650 cal</span>
                </div>
                <div className="flex items-end gap-[6px] h-[140px] mb-4">
                  {[1200, 1800, 1500, 2100, 1700, 1400, 1900].map((val, i) => {
                    const h = (val / 2200) * 100;
                    const over = val > 2000;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div
                          className="w-full max-w-[32px] rounded-t-md"
                          style={{ height: `${h}%`, backgroundColor: over ? '#FF6B6B' : '#111' }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 justify-center">
                  {[
                    { label: 'Protein', color: '#EF4444' },
                    { label: 'Carbs', color: '#3B82F6' },
                    { label: 'Fat', color: '#F97316' },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="text-[11px] text-[#888]">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="max-w-[1100px] mx-auto px-5 md:px-10 pb-[80px] md:pb-[140px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <h2 className="text-[clamp(2rem,6vw,3.2rem)] font-extrabold leading-[1.1] tracking-[-0.04em] mb-6">
                100% Free. <br />
                <span className="font-serif italic">Fully Open Source.</span>
              </h2>
              <p className="text-[1.05rem] text-[#6e6e73] leading-[1.6] mb-6 max-w-[460px]">
                No premium tiers. No ads. No data selling. FitBites is built by developers who believe
                health tools should be free for everyone. Inspect the code, contribute, or fork it.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/huamanraj/FitBites-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-[0.85rem] font-semibold no-underline hover:opacity-80 transition-opacity"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  View on GitHub
                </a>
                <a
                  href="https://github.com/huamanraj/FitBites-app/releases/tag/v1.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border-[1.5px] border-black rounded-full font-semibold text-[0.85rem] no-underline text-black bg-white hover:bg-black hover:text-white transition-all duration-700"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download APK
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 border-[1.5px] border-[#E5E5E5] rounded-full font-semibold text-[0.85rem] no-underline text-[#6e6e73] bg-white hover:border-black hover:text-black transition-all duration-300"
                >
                  Try on Web
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="bg-[#FAFAFA] rounded-3xl p-8 border border-[#F0F0F0]">
              <pre className="text-[13px] text-[#333] leading-relaxed overflow-x-auto">
                <code>{`// How simple is FitBites?

const entry = await estimateCalories("2 roti + dal");
// → { calories: 320, protein: 12, carbs: 45, fat: 8 }

// That's it. One line.
// No barcode scanning.
// No database lookup.
// Just type and go.`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section
          className="py-20 md:py-[100px] text-center rounded-t-[40px] overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #ffffff 0%, #ffedf2 100%)' }}
        >
          <div className="max-w-[1100px] mx-auto px-5">
            <h2 className="font-serif italic text-[clamp(2.5rem,8vw,4rem)] leading-[1.1] mb-8">
              Log in seconds.
            </h2>
            <p className="text-[1.1rem] text-[#6e6e73] max-w-[500px] mx-auto mb-8 leading-relaxed">
              The simplest AI calorie tracker ever made. Free, open source, and ready to use.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://github.com/huamanraj/FitBites-app/releases/tag/v1.0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-bold text-base no-underline hover:opacity-80 transition-opacity"
              >
                Download APK
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 border-[1.5px] border-black rounded-full font-bold text-base no-underline text-black bg-white hover:bg-black hover:text-white transition-all duration-700"
              >
                Try on Web
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-[700px] mx-auto px-5 py-[80px] md:py-[120px]" id="faq">
          <h2 className="text-[clamp(1.8rem,5vw,2.8rem)] font-extrabold leading-[1.1] tracking-[-0.03em] mb-10 text-center">
            Frequently Asked
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Is FitBites really free?',
                a: 'Yes! FitBites is 100% free with no subscriptions, no ads, and no hidden charges. It is also fully open source on GitHub.',
              },
              {
                q: 'How does FitBites analyze food?',
                a: 'FitBites uses AI to instantly analyze your food descriptions. Just type what you ate naturally — like "1 roti" or "100g rice" — and the AI calculates calories, protein, carbs, and fat.',
              },
              {
                q: 'Do I need to create an account?',
                a: 'Yes, you sign up with your email so your data is saved securely in the cloud and synced across devices. No social login or complex onboarding.',
              },
              {
                q: 'How is this different from MyFitnessPal?',
                a: 'FitBites is simpler, free, and open source. No barcode scanning, no premium tiers, no clutter. You type what you ate and the AI handles the rest — like a notes app for food.',
              },
              {
                q: 'Can I use it on the web?',
                a: 'Yes! FitBites works as both an Android app and a web app at app.fitbites.app. Your data syncs across all devices.',
              },
            ].map((faq) => (
              <details key={faq.q} className="group border-b border-[#F0F0F0] pb-4">
                <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-[1rem] text-[#111] hover:text-[#333] transition-colors">
                  {faq.q}
                  <svg className="w-5 h-5 text-[#AAAAAA] group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <p className="mt-3 text-[0.95rem] text-[#6e6e73] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-[60px] text-center text-[0.85rem] text-[#8e8e93] bg-white border-t border-[#F0F0F0]">
        <div className="max-w-[1100px] mx-auto px-5">
          <span className="font-bold text-black block mb-2 text-[1rem]">FitBites</span>
          <p>100% Free &amp; Open Source. Built for simplicity and health.</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="https://github.com/huamanraj/FitBites-app" target="_blank" rel="noopener noreferrer" className="text-[#8e8e93] hover:text-black transition-colors">GitHub</a>
            <a href="https://github.com/huamanraj/FitBites-app/releases/tag/v1.0" target="_blank" rel="noopener noreferrer" className="text-[#8e8e93] hover:text-black transition-colors">Download</a>
          </div>
        </div>
      </footer>
    </>
  );
}
