import { ReplacementService } from "../services/ReplacementService";
import { ReplacementRule } from "@types";

function makeRule(overrides: Partial<ReplacementRule> & { pattern: string; replacementText: string }): ReplacementRule {
  return {
    id: "rule-1",
    sourceId: "src-1",
    isRegex: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("ReplacementService", () => {
  describe("convertToRegex", () => {
    it("wraps plain text in word boundaries", () => {
      const regex = ReplacementService.convertToRegex("libtard");
      expect(regex.test("the libtard agenda")).toBe(true);
      expect(regex.test("libtards")).toBe(false);
      expect(regex.flags).toContain("g");
      expect(regex.flags).toContain("i");
    });

    it("escapes regex special characters in plain text", () => {
      const regex = ReplacementService.convertToRegex("Fox (News)");
      expect(regex.test("watch Fox (News) today")).toBe(true);
      expect(regex.test("watch Fox News today")).toBe(false);
    });
  });

  describe("applyRules", () => {
    it("applies plain text rules with word boundary matching", () => {
      const rules = [makeRule({ pattern: "libtard", replacementText: "[removed]" })];
      const body = ["The libtard agenda is dangerous."];
      const result = ReplacementService.applyRules(body, rules);
      expect(result.processed).toEqual(["The [removed] agenda is dangerous."]);
    });

    it("applies regex rules directly", () => {
      const rules = [makeRule({ pattern: "lib\\w+", replacementText: "[bias]", isRegex: true })];
      const body = ["The liberal and libertarian views."];
      const result = ReplacementService.applyRules(body, rules);
      expect(result.processed).toEqual(["The [bias] and [bias] views."]);
    });

    it("applies rules longest-match-first", () => {
      const rules = [
        makeRule({ id: "r1", pattern: "Fox", replacementText: "[A]" }),
        makeRule({ id: "r2", pattern: "Fox News", replacementText: "[Source]" }),
      ];
      const body = ["Watch Fox News tonight."];
      const result = ReplacementService.applyRules(body, rules);
      expect(result.processed).toEqual(["Watch [Source] tonight."]);
    });

    it("applies rules across multiple paragraphs", () => {
      const rules = [makeRule({ pattern: "CNN", replacementText: "[source]" })];
      const body = ["CNN reports today.", "Breaking on CNN."];
      const result = ReplacementService.applyRules(body, rules);
      expect(result.processed).toEqual(["[source] reports today.", "Breaking on [source]."]);
    });

    it("returns replacement map with positions", () => {
      const rules = [makeRule({ pattern: "CNN", replacementText: "[source]" })];
      const body = ["CNN reports today."];
      const result = ReplacementService.applyRules(body, rules);
      expect(result.replacementMap.length).toBeGreaterThan(0);
      expect(result.replacementMap[0]).toMatchObject({
        paragraphIndex: 0,
        original: "CNN",
        replacement: "[source]",
      });
    });

    it("handles no rules gracefully", () => {
      const body = ["No changes here."];
      const result = ReplacementService.applyRules(body, []);
      expect(result.processed).toEqual(["No changes here."]);
      expect(result.replacementMap).toEqual([]);
    });

    it("handles empty body", () => {
      const rules = [makeRule({ pattern: "test", replacementText: "x" })];
      const result = ReplacementService.applyRules([], rules);
      expect(result.processed).toEqual([]);
    });
  });
});
