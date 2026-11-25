import { createHmac } from "node:crypto";
import { setTimeout } from "node:timers/promises";

export async function waitForStableTotpWindow() {
  const remaining = 30000 - Date.now() % 30000;
  if (remaining < 9000) await setTimeout(remaining + 500);
}

export const currentTotpStep = () => Math.floor(Date.now() / 30000);

export function fixtureTotp(secret, offset = 0) {
  return fixtureTotpAt(secret, currentTotpStep() + offset);
}

export function fixtureTotpAt(secret, step) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret].map(character => alphabet.indexOf(character).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g).map(byte => Number.parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hash = createHmac("sha1", key).update(counter).digest();
  return String((hash.readUInt32BE(hash.at(-1) & 15) & 0x7fffffff) % 1000000).padStart(6, "0");
}

export async function nextFixtureTotp(secret, lastStep) {
  const step = Math.max(currentTotpStep() - 1, lastStep + 1);
  const delay = (step - 1) * 30000 - Date.now();
  if (delay >= 0) await setTimeout(delay + 200);
  const nextStep = Math.max(step, currentTotpStep() - 1);
  return { step: nextStep, code: fixtureTotpAt(secret, nextStep) };
}
