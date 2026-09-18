import { buttonVariants } from "@cadence-clinical/ui";
import type { Metadata } from "next";
import Link from "next/link";

import { gitConfig, siteDescription } from "@/lib/shared";

export const metadata: Metadata = {
  description: siteDescription,
};

const principles = [
  {
    title: "Built for the ward, not the dashboard",
    body: "Clinical screens are dense and read at speed. Compact by default, 44px touch targets when you need them, and numbers that line up so a trend is visible at a glance.",
  },
  {
    title: "Status colours mean one thing",
    body: "Critical red, warning amber and success green are fixed. Your brand gets an accent, and the build rejects any accent that could be mistaken for a clinical status.",
  },
  {
    title: "Components display. They don't decide.",
    body: "No component ships with a threshold baked in. You supply the interpretation, or opt in to a cited regional rule set. What counts as abnormal stays a clinical decision.",
  },
  {
    title: "Every component carries a grade",
    body: "Tested, verified by clinicians, used in production. A grade names the version it applies to, and a visual change sends the component back for review.",
  },
];

export default function HomePage() {
  return (
    // HomeLayout already provides the <main> landmark.
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-16 sm:px-6 sm:py-24">
      <section className="flex flex-col items-start gap-6">
        <p className="rounded-md border border-info-border bg-info-subtle px-2 py-1 text-xs font-medium text-info-text">
          Pre-release. Packages are not yet on npm.
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          A design system for clinical software
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          Cadence gives doctors, nurses and pharmacists interfaces that are consistent, accessible
          and quick to read. Open source React components, clinical patterns built on them, and
          utilities that turn FHIR resources into props.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/docs" className={buttonVariants({ size: "lg" })}>
            Read the docs
          </Link>
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section aria-labelledby="principles" className="flex flex-col gap-6">
        <h2 id="principles" className="text-2xl font-semibold tracking-tight">
          What makes it clinical
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {principles.map((principle) => (
            <li key={principle.title} className="rounded-lg border bg-card p-5">
              <h3 className="font-medium">{principle.title}</h3>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{principle.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto border-t pt-6 text-sm text-muted-foreground">
        Cadence is a presentation layer. It is not a medical device and does not replace clinical
        judgement. MIT licensed.
      </footer>
    </div>
  );
}
