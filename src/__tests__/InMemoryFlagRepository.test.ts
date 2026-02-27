import { flagRepositoryContractTests } from "./FlagRepository.contract";
import { InMemoryFlagRepository } from "../repositories/InMemoryFlagRepository";

describe("InMemoryFlagRepository", () => {
  flagRepositoryContractTests(
    () => Promise.resolve(new InMemoryFlagRepository())
  );
});
