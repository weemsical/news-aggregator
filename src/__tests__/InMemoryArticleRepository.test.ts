import { articleRepositoryContractTests } from "./ArticleRepository.contract";
import { InMemoryArticleRepository } from "../repositories/InMemoryArticleRepository";

describe("InMemoryArticleRepository", () => {
  articleRepositoryContractTests(
    () => Promise.resolve(new InMemoryArticleRepository())
  );
});
