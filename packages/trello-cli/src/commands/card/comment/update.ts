import { BaseCommand } from "../../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Update extends BaseCommand<typeof Update> {
  static description = "Update a comment on a card";

  protected defaultOutput = "fancy" as const;

  static flags = {
    card: Flags.string({ required: true, description: "Card name or ID" }),
    board: Flags.string({ required: true, description: "Board name or ID" }),
    list: Flags.string({ required: true, description: "List name or ID" }),
    comment: Flags.string({
      required: true,
      char: "c",
      description: "Comment action ID",
    }),
    text: Flags.string({
      required: true,
      char: "t",
      description: "New comment text",
    }),
  };

  async run(): Promise<void> {
    const comment = await this.client.cards.updateCardComment({
      id: this.lookups.card,
      idAction: this.flags.comment,
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
