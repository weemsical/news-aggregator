import cron from "node-cron";
import { startCronJobs } from "../server/cron";

jest.mock("node-cron", () => ({
  schedule: jest.fn(),
}));

const mockSchedule = cron.schedule as jest.MockedFunction<typeof cron.schedule>;

describe("cron", () => {
  beforeEach(() => {
    mockSchedule.mockReset();
  });

  it("schedules a job at 5:00 AM daily", () => {
    const deps = {} as any;
    startCronJobs(deps);

    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockSchedule.mock.calls[0][0]).toBe("0 5 * * *");
    expect(typeof mockSchedule.mock.calls[0][1]).toBe("function");
  });
});
