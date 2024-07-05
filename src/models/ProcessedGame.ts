export interface ProcessedGame {
    players: string[];
    kills: Record<string, number>;
    total_kills: number;
    kills_by_means: Record<string, number>;
    scoreboard: string[];
}