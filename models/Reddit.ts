import { DataTypes, Model } from "sequelize";

export class Reddit extends Model {
	declare subreddit: string;
	declare interval: number;
	declare guildId: string;
	declare channelId: string;
	declare posted: string;
	declare lastRan: Date;

	static configuration = {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		subreddit: {
			type: DataTypes.STRING,
		},
		interval: {
			type: DataTypes.INTEGER,
		},
		guildId: {
			type: DataTypes.STRING,
		},
		channelId: {
			type: DataTypes.STRING,
		},
		posted: {
			type: DataTypes.TEXT,
		},
		lastRan: {
			type: DataTypes.DATE,
		},
	};
}
