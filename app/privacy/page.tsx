import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Porchlight",
  description:
    "Privacy policy for Porchlight, the ADHD-friendly focus companion (web app and Chrome extension).",
};

const updated = "September 28, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#041c51] text-slate-100">
      <div className="max-w-2xl mx-auto px-5 py-10">
        <header className="mb-8">
          <p className="text-amber-300 text-sm font-medium tracking-wide mb-2">
            PORCHLIGHT
          </p>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Last updated: {updated}
          </p>
        </header>

        <div className="space-y-6 text-[15px] leading-relaxed text-slate-200">
          <p>
            Porchlight is an ADHD-friendly focus companion: energy-aware
            check-ins, focus sprint timers, tiny-wins checklists, and a calm
            chat coach. This policy covers the Porchlight web app and the
            Porchlight Chrome extension (&ldquo;Porchlight &mdash; Companion
            &amp; Productivity Booster&rdquo;). We keep data collection to the
            bare minimum needed for the app to work.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              1. Data that stays on your device
            </h2>
            <p>
              Your energy check-ins, check-in notes and history, tiny wins and
              tasks, focus timer state, and task history are stored only in
              your browser&apos;s or extension&apos;s local storage. They are
              never transmitted to us or to anyone else. Clearing your
              browser&apos;s site data deletes them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              2. Data sent to a third party
            </h2>
            <p>
              When you use the companion chat, the text you type is sent to
              the free public Pollinations API (
              <span className="text-amber-200">text.pollinations.ai</span>) so
              it can generate a reply. If that service is unavailable, an
              on-device rule-based coach answers instead and nothing is sent.
              Pollinations may log requests under its own policy, so please
              don&apos;t share sensitive personal information in chat.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              3. What we don&apos;t collect
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>No accounts, names, email addresses, or identifiers.</li>
              <li>No analytics, tracking, or advertising.</li>
              <li>No location, browsing history, or website content.</li>
              <li>
                We never sell data, and we never use data for purposes
                unrelated to Porchlight&apos;s single purpose as a focus
                companion.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              4. Extension permissions
            </h2>
            <p>
              The Chrome extension requests host access to{" "}
              <span className="text-amber-200">text.pollinations.ai</span>{" "}
              only, solely to power the chat-coach feature described above. It
              does not read your browsing history, tabs, or page content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              5. Children&apos;s privacy
            </h2>
            <p>
              Porchlight is a general productivity tool and is not directed at
              children under 13. We do not knowingly collect data from
              children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              6. Changes to this policy
            </h2>
            <p>
              If this policy changes, the updated version will be posted here
              with a new &ldquo;last updated&rdquo; date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              7. Contact
            </h2>
            <p>
              Questions about this policy? Open an issue at{" "}
              <a
                href="https://github.com/rvyasa6/porchlight_agent"
                className="text-amber-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/rvyasa6/porchlight_agent
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mt-10 pt-6 border-t border-white/10 text-sm text-slate-400">
          <Link href="/" className="text-amber-300 underline">
            Back to Porchlight
          </Link>
        </footer>
      </div>
    </main>
  );
}
