"use client";

import { useEffect, useState } from "react";

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
};

function compute(target: number): Parts {
  const total = Math.max(0, target - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / 1000 / 60 / 60) % 24);
  const days = Math.floor(total / 1000 / 60 / 60 / 24);
  return { days, hours, minutes, seconds, total };
}

const PAD = (n: number) => n.toString().padStart(2, "0");

export function Countdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    setParts(compute(target));
    const id = setInterval(() => setParts(compute(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!parts) {
    return (
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {(["DAYS", "HOURS", "MIN", "SEC"] as const).map((label) => (
          <div
            key={label}
            className="card rounded-lg p-3 sm:p-4 text-center"
          >
            <div className="text-2xl sm:text-3xl font-semibold tabular-nums">
              --
            </div>
            <div className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (parts.total <= 0) {
    return (
      <div className="card rounded-xl p-6 sm:p-8 ring-2 ring-[var(--color-gold)] text-center">
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
          CHAPPIE is live
        </p>
        <p className="text-base text-[var(--color-paper)]/90">
          The token launched. Check{" "}
          <a
            href="https://x.com/chappieworks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-gold)] hover:underline"
          >
            @chappieworks
          </a>{" "}
          on X or{" "}
          <a
            href="https://warpcast.com/rocketship"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-gold)] hover:underline"
          >
            @rocketship
          </a>{" "}
          on Farcaster for the contract address and Bankr buy link.
        </p>
      </div>
    );
  }

  const blocks: { label: string; value: number }[] = [
    { label: "DAYS", value: parts.days },
    { label: "HOURS", value: parts.hours },
    { label: "MIN", value: parts.minutes },
    { label: "SEC", value: parts.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {blocks.map((b) => (
        <div
          key={b.label}
          className="card rounded-lg p-3 sm:p-4 text-center"
        >
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--color-gold)]">
            {PAD(b.value)}
          </div>
          <div className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mt-1">
            {b.label}
          </div>
        </div>
      ))}
    </div>
  );
}
