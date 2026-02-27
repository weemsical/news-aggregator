import { PropagandaFlag } from "../types";
import { FlagRepository } from "../repositories/FlagRepository";

export function flagRepositoryContractTests(
  createRepo: () => Promise<FlagRepository>,
  cleanup?: () => Promise<void>
) {
  let repo: FlagRepository;

  const makeFlag = (overrides: Partial<PropagandaFlag> = {}): PropagandaFlag => ({
    id: "flag-1",
    articleId: "article-1",
    highlightedText: "accused the committee of leveraging testimony",
    explanation: "Loaded language implies manipulation without evidence",
    timestamp: 1740000060000,
    ...overrides,
  });

  beforeEach(async () => {
    repo = await createRepo();
  });

  afterEach(async () => {
    if (cleanup) await cleanup();
  });

  it("returns empty array when no flags exist", async () => {
    const all = await repo.findAll();
    expect(all).toEqual([]);
  });

  it("saves and retrieves a flag", async () => {
    const flag = makeFlag();
    await repo.save(flag);
    const all = await repo.findAll();
    expect(all).toEqual([flag]);
  });

  it("retrieves flags for a specific article", async () => {
    await repo.save(makeFlag({ id: "flag-1", articleId: "article-1" }));
    await repo.save(makeFlag({ id: "flag-2", articleId: "article-1" }));
    await repo.save(makeFlag({ id: "flag-3", articleId: "article-2" }));
    const a1Flags = await repo.findByArticle("article-1");
    expect(a1Flags).toHaveLength(2);
  });

  it("returns empty array for article with no flags", async () => {
    const flags = await repo.findByArticle("nonexistent");
    expect(flags).toEqual([]);
  });

  it("does not create duplicates on repeated save", async () => {
    const flag = makeFlag();
    await repo.save(flag);
    await repo.save(flag);
    expect(await repo.count()).toBe(1);
  });

  it("rejects flags with empty highlightedText", async () => {
    await expect(repo.save(makeFlag({ highlightedText: "" }))).rejects.toThrow(
      "highlightedText must not be empty"
    );
  });

  it("rejects flags with whitespace-only highlightedText", async () => {
    await expect(repo.save(makeFlag({ highlightedText: "   " }))).rejects.toThrow(
      "highlightedText must not be empty"
    );
  });

  it("rejects flags with empty explanation", async () => {
    await expect(repo.save(makeFlag({ explanation: "" }))).rejects.toThrow(
      "explanation must not be empty"
    );
  });

  it("returns flags ordered by timestamp ascending", async () => {
    await repo.save(makeFlag({ id: "flag-late", timestamp: 1740000120000 }));
    await repo.save(makeFlag({ id: "flag-early", timestamp: 1740000060000 }));
    const all = await repo.findAll();
    expect(all[0].id).toBe("flag-early");
    expect(all[1].id).toBe("flag-late");
  });

  it("returns count of stored flags", async () => {
    expect(await repo.count()).toBe(0);
    await repo.save(makeFlag());
    expect(await repo.count()).toBe(1);
  });
}
