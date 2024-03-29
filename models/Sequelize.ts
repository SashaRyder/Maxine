import { Options } from "sequelize";

export class Sequelize {
	static configuration: Options = {
		dialect: "sqlite",
		storage: "/data/database.sqlite",
	};
}
