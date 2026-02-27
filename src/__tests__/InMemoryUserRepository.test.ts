import { userRepositoryContractTests } from "./UserRepository.contract";
import { InMemoryUserRepository } from "../repositories/InMemoryUserRepository";

describe("InMemoryUserRepository", () => {
  userRepositoryContractTests(
    () => Promise.resolve(new InMemoryUserRepository())
  );
});
