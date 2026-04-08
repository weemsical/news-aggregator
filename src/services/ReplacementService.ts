import { ReplacementRule } from "@types";

export interface ReplacementEntry {
  paragraphIndex: number;
  start: number;
  end: number;
  original: string;
  replacement: string;
}

export interface ApplyRulesResult {
  processed: string[];
  replacementMap: ReplacementEntry[];
}

export class ReplacementService {
  static convertToRegex(text: string): RegExp {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Use word boundaries only if the pattern starts/ends with a word character
    const startsWithWord = /^\w/.test(text);
    const endsWithWord = /\w$/.test(text);
    const prefix = startsWithWord ? "\\b" : "(?<=\\s|^)";
    const suffix = endsWithWord ? "\\b" : "(?=\\s|$)";
    return new RegExp(`${prefix}${escaped}${suffix}`, "gi");
  }

  static applyRules(body: string[], rules: ReplacementRule[]): ApplyRulesResult {
    if (rules.length === 0 || body.length === 0) {
      return { processed: [...body], replacementMap: [] };
    }

    // Sort longest pattern first to prevent partial matches
    const sorted = [...rules].sort((a, b) => b.pattern.length - a.pattern.length);

    const replacementMap: ReplacementEntry[] = [];
    const processed = body.map((paragraph, paragraphIndex) => {
      let result = paragraph;
      for (const rule of sorted) {
        const regex = rule.isRegex
          ? new RegExp(rule.pattern, "gi")
          : ReplacementService.convertToRegex(rule.pattern);

        result = result.replace(regex, (match, offset) => {
          replacementMap.push({
            paragraphIndex,
            start: offset,
            end: offset + match.length,
            original: match,
            replacement: rule.replacementText,
          });
          return rule.replacementText;
        });
      }
      return result;
    });

    return { processed, replacementMap };
  }
}
