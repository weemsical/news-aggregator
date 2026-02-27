import { ArticleRepository } from "../repositories/ArticleRepository";
import { seedArticles } from "../data/seedArticles";

export async function loadSeedData(repo: ArticleRepository): Promise<void> {
  const existing = await repo.count();
  if (existing > 0) return;

  await repo.saveBatch(seedArticles);
}
