import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockComment = {
  id: "action123",
  idMemberCreator: "member123",
  data: {
    text: "TestComment",
    card: { id: "card123", name: "TestCard" },
    board: { id: "board123", name: "TestBoard" },
  },
  type: "commentCard",
  date: "2026-02-10T12:00:00.000Z",
};

const addCardComment = jest.fn().mockResolvedValue(mockComment);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { addCardComment },
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

  addCardComment.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function run(args: string[]) {
  const result = await runCommand(["card:comment:add", ...args]);
  if (result.error) {
    throw result.error;
  }
  return result;
}

describe("card:comment:add", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:comment:add"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("adds a comment to a card", async () => {
    await run([
      "--board",
      "MyBoard",
      "--list",
      "ToDo",
      "--card",
      "TestCard",
      "--text",
      "TestComment",
      "--format",
      "json",
    ]);

    expect(addCardComment).toHaveBeenCalledTimes(1);
    expect(addCardComment).toHaveBeenCalledWith({
      id: "card123",
      text: "TestComment",
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
      "--text",
      "CommentText",
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

  it("outputs correct JSON shape", async () => {
    await run([
      "--board",
      "MyBoard",
      "--list",
      "ToDo",
      "--card",
      "TestCard",
      "--text",
      "TestComment",
      "--format",
      "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("action123");
    expect(output.text).toBe("TestComment");
    expect(output.date).toBe("2026-02-10T12:00:00.000Z");
    expect(output.idMemberCreator).toBe("member123");
    expect(output.type).toBe("commentCard");
  });

  it("outputs fancy format correctly", async () => {
    await run([
      "--board",
      "MyBoard",
      "--list",
      "ToDo",
      "--card",
      "TestCard",
      "--text",
      "TestComment",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    expect(outputCall).toContain("Comment ID: action123");
    expect(outputCall).toContain("Text: TestComment");
    expect(outputCall).toContain("Date: 2026-02-10T12:00:00.000Z");
    expect(outputCall).toContain("Creator: member123");
  });

  it("handles comments with multiline text", async () => {
    const multilineComment = {
      ...mockComment,
      data: { ...mockComment.data, text: "MultilineText" },
    };
    addCardComment.mockResolvedValueOnce(multilineComment);

    await run([
      "--board",
      "MyBoard",
      "--list",
      "ToDo",
      "--card",
      "TestCard",
      "--text",
      "MultilineText",
      "--format",
      "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.text).toBe("MultilineText");
  });
});
