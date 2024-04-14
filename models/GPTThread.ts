import { DataTypes, Model } from "sequelize";

export class GPTThread extends Model {
    declare threadId: string;
    declare messageId: string;

    static configuration = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        threadId: {
            type: DataTypes.STRING,
        },
        messageId: {
            type: DataTypes.STRING,
        }
    };
}
