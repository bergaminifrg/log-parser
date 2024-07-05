import fs from 'fs';
import readline from 'readline';
import { GameData } from '../models/GameData';
import { ProcessedGame } from '../models/ProcessedGame';
import { LineHandler } from '../handlers/LineHandler';
import { LineType } from '../utils/LineType';
import { MeansOfDeath } from '../utils/MeansOfDeath';

interface PlayerStats {
    nickname: string;
    kills: number;
    deaths: number;
}

export class LogParser {
    private gameData: GameData = { kills: [], userInfoChanged: [] };
    private gameId = 1;
    private processedData: Map<string, ProcessedGame> = new Map();
    private lineHandler = new LineHandler();

    public parse(filePath: string): void {
        const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: stream });

        rl.on('line', (line) => this.handleLine(line));
        rl.on('close', () => this.handleClose());
    }

    private handleLine(line: string): void {
        if (line.includes(LineType.InitGame)) {
            if (this.gameData.kills.length > 0 || this.gameData.userInfoChanged.length > 0) {
                this.processedData.set(`game_${this.gameId}`, this.processGame(this.gameId, this.gameData));
                this.gameData = { kills: [], userInfoChanged: [] };
                this.gameId++;
            }
        } else if (line.includes(LineType.ShutdownGame)) {
            this.processedData.set(`game_${this.gameId}`, this.processGame(this.gameId, this.gameData));
            this.gameData = { kills: [], userInfoChanged: [] };
            this.gameId++;
        } else {
            this.lineHandler.handleLine(line, this.gameData);
        }
    }

    private handleClose(): void {
        const end = process.hrtime();
        console.log(Object.fromEntries(this.processedData));
        console.log(`${end[0] * 1e9 + end[1]} nanoseconds`);
    }

    public processGame(gameId: number, gameData: GameData): ProcessedGame {
        const totalKills = gameData.kills.length;
        const killMeansSet = new Set<string>();
        const kills: Record<string, number> = {};
        const deaths: Record<string, number> = {};
        const killsByMeans: Record<string, number> = {};

        const playerList = this.getPlayerList(gameData.userInfoChanged);
        const playersSet = new Set(playerList.values());

        gameData.kills.forEach((line: any) => {
            const regex = /Kill: (\d+) (\d+) (\d+)/;
            const matches = line.match(regex);

            if (matches) {
                const killerId = parseInt(matches[1], 10);
                const victimId = parseInt(matches[2], 10);
                const mean = parseInt(matches[3], 10);
                const killer = playerList.get(killerId) || 'unknown';
                const victim = playerList.get(victimId) || 'unknown';

                this.updateKillsAndDeaths(kills, deaths, killer, victim);
                const meanName = MeansOfDeath[mean];
                killsByMeans[meanName] = (killsByMeans[meanName] || 0) + 1;
            }
        });

        const scoreboard: PlayerStats[] = Array.from(playersSet).map(player => ({
            nickname: player,
            kills: kills[player] || 0,
            deaths: deaths[player] || 0
        }));

        scoreboard.sort((a, b) => b.kills - a.kills);

        return {
            players: Array.from(playersSet),
            kills,
            total_kills: totalKills,
            kills_by_means: killsByMeans,
            scoreboard: this.formatScoreboard(scoreboard),
        };
    }

    private getPlayerList(userInfoList: string[]): Map<number, string> {
        const regex = /ClientUserinfoChanged: (\d+) n\\([^\t\\]+)/;
        const players = new Map<number, string>();

        userInfoList.forEach((line) => {
            const matches = line.match(regex);
            if (matches) {
                players.set(parseInt(matches[1], 10), matches[2]);
            }
        });

        return players;
    }

    private updateKillsAndDeaths(kills: Record<string, number>, deaths: Record<string, number>, killer: string, victim: string): void {
        if (killer === 'unknown' || killer === victim) {
            deaths[victim] = (deaths[victim] || 0) + 1;
        } else {
            kills[killer] = (kills[killer] || 0) + 1;
            deaths[victim] = (deaths[victim] || 0) + 1;
        }
    }

    private formatScoreboard(scoreboard: PlayerStats[]): string[] {
        return ["Nickname | Kills | Deaths", ...scoreboard.map((player) => `${player.nickname} | ${player.kills} | ${player.deaths}`)]
    }
}
