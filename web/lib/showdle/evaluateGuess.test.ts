import { describe, it, expect } from "vitest";
import { evaluateGuess } from "./evaluateGuess";

describe("evaluateGuess", () => {
  it("marks all correct when guess matches answer", () => {
    expect(evaluateGuess("MUSIC", "MUSIC")).toEqual([
      "correct", "correct", "correct", "correct", "correct",
    ]);
  });

  it("marks all absent when no letters match", () => {
    expect(evaluateGuess("GROWN", "MUSIC")).toEqual([
      "absent", "absent", "absent", "absent", "absent",
    ]);
  });

  it("marks present letters in wrong position", () => {
    // CISUM vs MUSIC: C(0)→present, I(1)→present, S(2)→correct, U(3)→present, M(4)→present
    expect(evaluateGuess("CISUM", "MUSIC")).toEqual([
      "present", "present", "correct", "present", "present",
    ]);
  });

  it("handles duplicate letter in guess with only one in answer", () => {
    // SPEED vs NEEDS: S→present(matches pos4), P→absent, E→correct(pos2), E→present(matches pos1), D→present(matches pos3)
    expect(evaluateGuess("SPEED", "NEEDS")).toEqual([
      "present", "absent", "correct", "present", "present",
    ]);
  });

  it("handles duplicate letter in answer with both in guess", () => {
    // GEESE vs EERIE: G→absent, E→correct(pos1), E→present(matches pos0), S→absent, E→correct(pos4)
    expect(evaluateGuess("GEESE", "EERIE")).toEqual([
      "absent", "correct", "present", "absent", "correct",
    ]);
  });

  it("works with variable word lengths", () => {
    expect(evaluateGuess("DEFYING", "DEFYING")).toEqual([
      "correct", "correct", "correct", "correct", "correct", "correct", "correct",
    ]);
  });

  it("handles mix of correct, present, and absent", () => {
    // CRANE vs CANDY: C=correct, R=absent, A=present, N=present, E=absent
    expect(evaluateGuess("CRANE", "CANDY")).toEqual([
      "correct", "absent", "present", "present", "absent",
    ]);
  });
});
