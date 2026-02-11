import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const deleteCardComment = jest.fn().mockResolvedValue({});
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { deleteCardComment },
    lists: { getListCards },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockGetListIdByBoardAndName = jest.fn().mockResolvedValue("list123");

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
      getListIdByBoardAndName: mockGetListIdByBoardAndName,
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

  deleteCardComment.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function run(args: string[]) {
  const result = await runCommand(["card:comment:delete", ...args]);
  if (result.error) {
    throw result.error;
  }
  return result;
}

describe("card:comment:delete", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:comment:delete"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("deletes a comment from a card", async () => {
    await run([
      "--board",
      "MyBoard",
      "--list",
      "ToDo",
      "--card",
      "TestCard",
      "--comment",
      "action123",
      "--format",
      "json",
    ]);

    expect(deleteCardComment).toHaveBeenCalledTimes(1);
    expect(deleteCardComment).toHaveBeenCalledWith({
      id: "card123",
      idAction: "action123",
    });
  });

  it("resolves card name to ID via board and list lookups", async () => {
    await run([
      "--board",
      "MyBoard",
      "--list",
      "ToDo",
      "--card",
      "TestCard",
      "--comment",
      "action123",
      "--format",
      "json",
    ]);

    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith(
      "board123",
      "ToDo"
    );
    expect(getListCards).toHaveBeenCalledWith({ id: "list123" });
  });

  it("uses comment ID directly without lookup", async () => {
    await run([
      "--board",
      "MyBoard",
      "--list",
      "ToDo",
      "--card",
      "TestCard",
      "--comment",
      "action456",
      "--format",
      "json",
    ]);

    expect(deleteCardComment).toHaveBeenCalledWith({
      id: "card123",
      idAction: "action456",
    });
  });

  it("completes successfully with no output for default format", async () => {
    await run([
      "--board",
      "MyBoard",
      "--list",
      "ToDo",
      "--card",
      "TestCard",
      "--comment",
      "action123",
    ]);

    expect(deleteCardComment).toHaveBeenCalledTimes(1);
    // Default output is silent, so no stdout should be called
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it("handles card ID directly", async () => {
    getListCards.mockResolvedValueOnce([
      { id: "card123", name: "TestCard" },
      { id: "card789", name: "AnotherCard" },
    ]);

    await run([
      "--board",
      "board123",
      "--list",
      "list123",
      "--card",
      "AnotherCard",
      "--comment",
      "action123",
      "--format",
      "json",
    ]);

    expect(deleteCardComment).toHaveBeenCalledWith({
      id: "card789",
      idAction: "action123",
    });
  });
});
