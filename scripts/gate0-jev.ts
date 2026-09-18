// Gate 0(a): one real Jev call with a choice, a noul and a score; then probes for the limits the docs leave out.
// Run: node --env-file=.env scripts/gate0-jev.ts
import { writeFileSync } from "node:fs";
import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { secret } from "./lib/env.ts";

const MODEL = "jev-1.13.0";
const client = new TypeSafeClient({ apiKey: secret("TYPESAFE_API_KEY") });

// WQ 962 (2024), text as published on questions.parliament.nz.
const state = {
  question:
    "Does the Minister stand by his statement “We're going to be a Government that delivers, not just talks”; if so, what transport projects, if any, does he expect to start and finish in the next three years?",
  reply:
    "Corrected reply: Yes. Decisions around which projects are funded and delivered over the coming three years will be made in the coming months as the National Land Transport Programme is finalised.",
};

const request = {
  model: MODEL,
  state,
  questions: {
    answered: choice("Does the `reply` give the information that the `question` asks for?", {
      answered:
        "The reply gives the information asked for, or a direct yes/no where that is what was asked.",
      partly_answered:
        "The reply gives some of the information asked for and leaves some of it out.",
      not_answered:
        "The reply does not give the information asked for, whether it declines, talks about something else, or only restates policy.",
      unclear:
        "The reply cannot be judged from its text alone, for example because the information is said to be in an attachment or another document.",
    }),
    declinesWithReason: noul(
      "Does the `reply` decline to provide the information asked for and state a reason for declining?",
    ),
    completeness: score("How much of what the `question` asks for does the `reply` supply?", [
      "None of the requested information is supplied.",
      "A small part of the requested information is supplied.",
      "Most of the requested information is supplied.",
      "All of the requested information is supplied.",
    ]),
  },
};

const t0 = performance.now();
const { data, response, requestId } = await client.systemOne(request).withResponse();
const latencyMs = Math.round(performance.now() - t0);
const rateHeaders = Object.fromEntries(
  [...response.headers].filter(([k]) => /rate|limit|retry|remaining/i.test(k)),
);

const nQuestions = async (n: number) => {
  const questions = Object.fromEntries(
    Array.from({ length: n }, (_, i) => [
      `q${i}`,
      noul(`Does the \`reply\` mention a time period? (${i})`),
    ]),
  );
  const start = performance.now();
  try {
    const r = await client.systemOne({ model: MODEL, state, questions });
    return {
      n,
      ok: true,
      ms: Math.round(performance.now() - start),
      usage: r.usage,
      answers: Object.keys(r.answers).length,
    };
  } catch (e) {
    return {
      n,
      ok: false,
      ms: Math.round(performance.now() - start),
      error: String(e).slice(0, 300),
    };
  }
};
const questionCountProbe = [];
for (const n of [1, 5, 20, 50, 200]) questionCountProbe.push(await nQuestions(n));

const burstStart = performance.now();
const burst = await Promise.allSettled(Array.from({ length: 20 }, () => client.systemOne(request)));
const burstProbe = {
  concurrent: 20,
  fulfilled: burst.filter((b) => b.status === "fulfilled").length,
  wallMs: Math.round(performance.now() - burstStart),
};

const out = {
  at: new Date().toISOString(),
  sdk: "@typesafe-ai/sdk@0.6.0",
  requestId,
  latencyMs,
  rateHeaders,
  request,
  response: data,
  questionCountProbe,
  burstProbe,
};
writeFileSync("docs/gate0/jev-response.json", `${JSON.stringify(out, null, 2)}\n`);
console.log(
  JSON.stringify(
    { latencyMs, response: data, questionCountProbe, burstProbe, rateHeaders },
    null,
    2,
  ),
);
