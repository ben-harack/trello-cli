import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class GetLabels extends BaseCommand<typeof GetLabels> {
  static description = "Get all labels for a board";

  protected defaultOutput = "fancy" as const;

  static flags = {
    board: Flags.string({
      required: true,
      description: "Board name or ID",
    }),
  };

  async run(): Promise<void> {
    const labels = await this.client.boards.getBoardLabels({
      id: this.lookups.board,
    });
    this.output(labels);
  }

  protected toData(data: any) {
    return data.map((label: any) => ({
      id: label.id,
      name: label.name || "(unnamed)",
      color: label.color || "none",
    }));
  }

  protected async format(data: any): Promise<string> {
    if (data.length === 0) {
      return "No labels found on this board";
    }

    return data
      .map((label: any) => {
        const name = label.name || "(unnamed)";
        const color = label.color || "none";
        return `${name} (${color}) - ID: ${label.id}`;
      })
      .join("\n");
  }
}
