import { PropagandaFlag } from "../types";
import { FlagStore } from "../services/FlagStore";

describe("FlagStore", () => {
  /**
   * FlagStore is an in-memory store for PropagandaFlags.
   * It links flags to articles, enforces basic validation,
   * and provides query methods for retrieving flags by article.
   */

  let store: FlagStore;

  beforeEach(() => {
    store = new FlagStore();
  });

  const makeFlag = (overrides: Partial<PropagandaFlag> = {}): PropagandaFlag => ({
    id: "flag-1",
    articleId: "article-1",
    highlightedText: "accused the committee of leveraging testimony",
    explanation: "Loaded language implies manipulation without evidence",
    timestamp: 1740000060000,
    ...overrides,
  });

  it("should start empty", () => {
    expect(store.getAll()).toEqual([]);
    expect(store.count).toBe(0);
  });

  it("should add a flag and retrieve it", () => {
    const flag = makeFlag();
    store.add(flag);

    expect(store.count).toBe(1);
    expect(store.getAll()).toEqual([flag]);
  });

  it("should retrieve flags for a specific article", () => {
    store.add(makeFlag({ id: "flag-1", articleId: "article-1" }));
    store.add(makeFlag({ id: "flag-2", articleId: "article-1" }));
    store.add(makeFlag({ id: "flag-3", articleId: "article-2" }));

    const article1Flags = store.getByArticle("article-1");
    const article2Flags = store.getByArticle("article-2");

    expect(article1Flags).toHaveLength(2);
    expect(article2Flags).toHaveLength(1);
    expect(article1Flags.every((f) => f.articleId === "article-1")).toBe(true);
  });

  it("should return an empty array for an article with no flags", () => {
    expect(store.getByArticle("nonexistent")).toEqual([]);
  });

  it("should not allow duplicate flag ids", () => {
    store.add(makeFlag({ id: "flag-1" }));
    store.add(makeFlag({ id: "flag-1" }));

    expect(store.count).toBe(1);
  });

  it("should reject a flag with an empty explanation", () => {
    expect(() => {
      store.add(makeFlag({ explanation: "" }));
    }).toThrow("explanation must not be empty");
  });

  it("should reject a flag with an empty highlightedText", () => {
    expect(() => {
      store.add(makeFlag({ highlightedText: "" }));
    }).toThrow("highlightedText must not be empty");
  });

  it("should reject a flag with a whitespace-only explanation", () => {
    expect(() => {
      store.add(makeFlag({ explanation: "   " }));
    }).toThrow("explanation must not be empty");
  });

  it("should return flags ordered by timestamp (oldest first)", () => {
    store.add(makeFlag({ id: "flag-late", timestamp: 1740000120000 }));
    store.add(makeFlag({ id: "flag-early", timestamp: 1740000060000 }));
    store.add(makeFlag({ id: "flag-mid", timestamp: 1740000090000 }));

    const all = store.getAll();

    expect(all[0].id).toBe("flag-early");
    expect(all[1].id).toBe("flag-mid");
    expect(all[2].id).toBe("flag-late");
  });
});
