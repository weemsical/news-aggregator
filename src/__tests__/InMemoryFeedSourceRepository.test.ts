import { feedSourceRepositoryContractTests } from "./FeedSourceRepository.contract";
import { InMemoryFeedSourceRepository } from "../repositories/InMemoryFeedSourceRepository";

describe("InMemoryFeedSourceRepository", () => {
  feedSourceRepositoryContractTests(
    () => Promise.resolve(new InMemoryFeedSourceRepository())
  );
});
