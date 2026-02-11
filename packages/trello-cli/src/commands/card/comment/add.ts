import { BaseCommand } from "../../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Add extends BaseCommand<typeof Add> {
  static description = "Add a comment to a card";

  protected defaultOutput = "fancy" as const;

  static flags = {
    card: Flags.string({ required: true, description: "Card name or ID" }),
    board: Flags.string({ required: true, description: "Board name or ID" }),
    list: Flags.string({ required: true, description: "List name or ID" }),
    text: Flags.string({
      required: true,
      char: "t",
      description: "Comment text",
    }),
  };

  async run(): Promise<void> {
    const comment = await this.client.cards.addCardComment({
      id: this.lookups.card,
      text: this.flags.text,
    });
    this.output(comment);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      text: data.data?.text || "",
      date: data.date,
      idMemberCreator: data.idMemberCreator,
      type: data.type,
    };
  }

  protected async format(data: any): Promise<string> {
    return [
      `Comment ID: ${data.id}`,
      `Text: ${data.text}`,
      `Date: ${data.date}`,
      `Creator: ${data.idMemberCreator}`,
    ].join("\n");
  }
}
