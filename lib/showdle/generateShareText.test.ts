import { describe, it, expect } from "vitest";
import { generateShareText } from "./generateShareText";

describe("generateShareText", () => {
  it("generates share text for a win without hint", () => {
    const result = generateShareText({
      evaluations: [
        ["absent", "present", "absent", "absent", "absent"],
        ["present", "absent", "correct", "absent", "absent"],
        ["correct", "correct", "correct", "correct", "correct"],
      ],
      status: "won",
      wordLength: 5,
      scheduledDate: "2026-03-27T00:00:00.000Z",
      hintUsed: false,
    });

    expect(result).toBe(
      [
        "Showdle 🎭 · March 27, 2026",
        "⬛🟨⬛⬛⬛",
        "🟨⬛🟩⬛⬛",
        "🟩🟩🟩🟩🟩 3/6",
        "showdle.com",
      ].join("\n"),
    );
  });

  it("generates share text for a win with hint", () => {
    const result = generateShareText({
      evaluations: [
        ["absent", "present", "absent", "absent", "absent"],
        ["hint", "hint", "hint", "hint", "hint"],
        ["correct", "present", "absent", "correct", "absent"],
        ["correct", "correct", "correct", "correct", "correct"],
      ],
      status: "won",
      wordLength: 5,
      scheduledDate: "2026-03-27T00:00:00.000Z",
      hintUsed: true,
    });

    expect(result).toBe(
      [
        "Showdle 🎭 · March 27, 2026",
        "⬛🟨⬛⬛⬛",
        "⬜⬜⬜⬜⬜",
        "🟩🟨⬛🟩⬛",
        "🟩🟩🟩🟩🟩 4/6 (hint used)",
        "showdle.com",
      ].join("\n"),
    );
  });

  it("generates share text for a loss", () => {
    const result = generateShareText({
      evaluations: [
        ["absent", "present", "absent", "absent", "absent"],
        ["present", "absent", "correct", "absent", "absent"],
        ["absent", "absent", "absent", "correct", "absent"],
        ["absent", "present", "absent", "absent", "correct"],
        ["absent", "absent", "correct", "absent", "absent"],
        ["absent", "absent", "absent", "absent", "absent"],
      ],
      status: "lost",
      wordLength: 5,
      scheduledDate: "2026-03-27T00:00:00.000Z",
      hintUsed: false,
    });

    expect(result).toBe(
      [
        "Showdle 🎭 · March 27, 2026",
        "⬛🟨⬛⬛⬛",
        "🟨⬛🟩⬛⬛",
        "⬛⬛⬛🟩⬛",
        "⬛🟨⬛⬛🟩",
        "⬛⬛🟩⬛⬛",
        "⬛⬛⬛⬛⬛ X/6",
        "showdle.com",
      ].join("\n"),
    );
  });

  it("generates share text for archive variant", () => {
    const result = generateShareText({
      evaluations: [
        ["correct", "correct", "correct", "correct", "correct"],
      ],
      status: "won",
      wordLength: 5,
      scheduledDate: "2026-03-26T00:00:00.000Z",
      hintUsed: false,
      isArchive: true,
    });

    expect(result).toBe(
      [
        "Showdle 🎭 · Archive · March 26, 2026",
        "🟩🟩🟩🟩🟩 1/6",
        "showdle.com",
      ].join("\n"),
    );
  });
});
