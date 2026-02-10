import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockLabels = [
  {
    id: "label1",
    name: "Bug",
    color: "red",
    idBoard: "board123",
  },
  {
    id: "label2",
    name: "Feature",
    color: "blue",
    idBoard: "board123",
  },
  {
    id: "label3",
    name: "",
    color: "green",
    idBoard: "board123",
  },
  {
    id: "label4",
    name: "Priority",
    color: null,
    idBoard: "board123",
  },
];

const getBoardLabels = jest.fn().mockResolvedValue(mockLabels);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    boards: { getBoardLabels },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
    })),
  };
});

let stdoutSpy: jest.SpyInstance;

beforeEach(() => {
  jest
    .spyOn(Config.prototype, "getToken")
    .mockImplementation(() => Promise.resolve("fake_token"));
  jest
    .spyOn(Config.prototype, "getApiKey")
    .mockImplementation(() => Promise.resolve("fake_api_key"));

  stdoutSpy = jest.spyOn(ux, "stdout").mockImplementation(() => {});

  getBoardLabels.mockClear();
  mockGetBoardIdByName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function run(args: string[]) {
  const result = await runCommand(["board:get-labels", ...args]);
  if (result.error) {
    throw result.error;
  }
  return result;
}

describe("board:get-labels", () => {
  it("throws when required --board flag is missing", async () => {
    const { error } = await runCommand(["board:get-labels"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("fetches labels for a board by name", async () => {
    await run(["--board", "MyBoard", "--format", "json"]);

    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(getBoardLabels).toHaveBeenCalledWith({ id: "board123" });
  });

  it("fetches labels for a board by ID", async () => {
    await run(["--board", "board123", "--format", "json"]);

    expect(getBoardLabels).toHaveBeenCalledWith({ id: "board123" });
  });

  it("outputs correct JSON shape with all label properties", async () => {
    await run(["--board", "MyBoard", "--format", "json"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);

    expect(output).toHaveLength(4);
    expect(output[0]).toEqual({
      id: "label1",
      name: "Bug",
      color: "red",
    });
    expect(output[1]).toEqual({
      id: "label2",
      name: "Feature",
      color: "blue",
    });
  });

  it("handles labels with empty names", async () => {
    await run(["--board", "MyBoard", "--format", "json"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);

    expect(output[2]).toEqual({
      id: "label3",
      name: "(unnamed)",
      color: "green",
    });
  });

  it("handles labels with null color", async () => {
    await run(["--board", "MyBoard", "--format", "json"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);

    expect(output[3]).toEqual({
      id: "label4",
      name: "Priority",
      color: "none",
    });
  });

  it("outputs fancy format correctly", async () => {
    await run(["--board", "MyBoard"]);

    const outputCall = stdoutSpy.mock.calls[0][0];

    expect(outputCall).toContain("Bug (red) - ID: label1");
    expect(outputCall).toContain("Feature (blue) - ID: label2");
    expect(outputCall).toContain("(unnamed) (green) - ID: label3");
    expect(outputCall).toContain("Priority (none) - ID: label4");
  });

  it("handles empty label list", async () => {
    getBoardLabels.mockResolvedValueOnce([]);

    await run(["--board", "MyBoard"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    expect(outputCall).toBe("No labels found on this board");
  });

  it("outputs CSV format correctly", async () => {
    await run(["--board", "MyBoard", "--format", "csv"]);

    const outputCall = stdoutSpy.mock.calls[0][0];

    expect(outputCall).toContain('"id","name","color"');
    expect(outputCall).toContain('"label1","Bug","red"');
    expect(outputCall).toContain('"label2","Feature","blue"');
  });
});
