import { BaseCommand } from "../../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Delete extends BaseCommand<typeof Delete> {
  static description = "Delete a comment from a card";

  static flags = {
    card: Flags.string({ required: true, description: "Card name or ID" }),
    board: Flags.string({ required: true, description: "Board name or ID" }),
    list: Flags.string({ required: true, description: "List name or ID" }),
    comment: Flags.string({
      required: true,
      char: "c",
      description: "Comment action ID",
    }),
  };

  async run(): Promise<void> {
    await this.client.cards.deleteCardComment({
      id: this.lookups.card,
      idAction: this.flags.comment,
    });

    this.output({});
  }
}
