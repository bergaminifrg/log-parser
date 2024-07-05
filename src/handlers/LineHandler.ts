import { GameData } from '../models/GameData';
import { LineType } from '../utils/LineType';

export class LineHandler {
    handleLine(line: string, gameData: GameData): void {
        if (line.includes(LineType.Kill)) {
            gameData.kills.push(line);
        } else if (line.includes(LineType.ClientUserinfoChanged)) {
            gameData.userInfoChanged.push(line);
        }
    }
}
