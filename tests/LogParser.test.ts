import {LogParser} from '../src/services/LogParser';

describe('LogParser Unit Tests', () => {
    let logParser: LogParser;

    beforeEach(() => {
        logParser = new LogParser();
    });

    it('should correctly update kills and deaths', () => {
        const kills: Record<string, number> = {};
        const deaths: Record<string, number> = {};

        logParser['updateKillsAndDeaths'](kills, deaths, 'player1', 'player2');
        logParser['updateKillsAndDeaths'](kills, deaths, 'player1', 'player2');
        logParser['updateKillsAndDeaths'](kills, deaths, 'player2', 'player2');

        expect(kills['player1']).toBe(2);
        expect(deaths['player2']).toBe(3);
    });

    it('should correctly format scoreboard', () => {
        const scoreboard = [
            {nickname: 'player1', kills: 2, deaths: 1},
            {nickname: 'player2', kills: 1, deaths: 2}
        ];

        const formattedScoreboard = logParser['formatScoreboard'](scoreboard);
        expect(formattedScoreboard).toEqual([
            'Nickname | Kills | Deaths',
            'player1 | 2 | 1',
            'player2 | 1 | 2'
        ]);
    });

    it('should get player list correctly', () => {
        const userInfoList = [
            '1:47 ClientUserinfoChanged: 2 n\\Dono da Bola\\t\\0\\model\\sarge\\hmodel\\sarge\\g_redteam\\\\g_blueteam\\\\c1\\4\\c2\\5\\hc\\95\\w\\0\\l\\0\\tt\\0\\tl\\0',
            '1:47 ClientUserinfoChanged: 3 n\\Isgalamido\\t\\0\\model\\uriel/zael\\hmodel\\uriel/zael\\g_redteam\\\\g_blueteam\\\\c1\\5\\c2\\5\\hc\\100\\w\\0\\l\\0\\tt\\0\\tl\\0'
        ];

        const playerList = logParser['getPlayerList'](userInfoList);

        expect(playerList.get(2)).toBe('Dono da Bola');
        expect(playerList.get(3)).toBe('Isgalamido');
    });

    it('should process game data correctly', () => {
        const gameData = {
            kills: [
                '2:22 Kill: 3 2 10: Isgalamido killed Dono da Bola by MOD_RAILGUN',
                '2:22 Kill: 1022 2 22: <world> killed Dono da Bola by MOD_TRIGGER_HURT'
            ],
            userInfoChanged: [
                '1:47 ClientUserinfoChanged: 2 n\\Dono da Bola\\t\\0\\model\\sarge\\hmodel\\sarge\\g_redteam\\\\g_blueteam\\\\c1\\4\\c2\\5\\hc\\95\\w\\0\\l\\0\\tt\\0\\tl\\0',
                '1:47 ClientUserinfoChanged: 3 n\\Isgalamido\\t\\0\\model\\uriel/zael\\hmodel\\uriel/zael\\g_redteam\\\\g_blueteam\\\\c1\\5\\c2\\5\\hc\\100\\w\\0\\l\\0\\tt\\0\\tl\\0',
                '1:47 ClientUserinfoChanged: 4 n\\Zeh\\t\\0\\model\\sarge/default\\hmodel\\sarge/default\\g_redteam\\\\g_blueteam\\\\c1\\1\\c2\\5\\hc\\100\\w\\0\\l\\0\\tt\\0\\tl\\0'
            ]
        };

        const result = logParser.processGame(1, gameData);

        expect(result).toBeDefined();
        expect(result.total_kills).toBe(2);
        expect(result.players).toEqual(['Dono da Bola', 'Isgalamido', 'Zeh']);
        expect(result.kills).toEqual({
            'Isgalamido': 1,
            'Dono da Bola': -1
        });
        expect(result.kills_by_means).toEqual({
            MOD_RAILGUN: 1,
            MOD_TRIGGER_HURT: 1
        });
        expect(result.scoreboard).toEqual([
            'Nickname | Kills | Deaths',
            'Isgalamido | 1 | 0',
            'Zeh | 0 | 0',
            'Dono da Bola | -1 | 2'
        ]);
    });

    it('should handle empty game data', () => {
        const gameData = {
            kills: [],
            userInfoChanged: []
        };

        const result = logParser.processGame(1, gameData);

        expect(result).toBeDefined();
        expect(result.total_kills).toBe(0);
        expect(result.players).toEqual([]);
        expect(result.kills).toEqual({});
        expect(result.kills_by_means).toEqual({});
        expect(result.scoreboard).toEqual(['Nickname | Kills | Deaths']);
    });

    it('should handle line processing correctly', () => {
        logParser['handleLine']('1:47 InitGame: \\');
        logParser['handleLine']('1:47 ClientUserinfoChanged: 3 n\\Isgalamido\\t\\0\\model\\sarge\\hmodel\\sarge\\g_redteam\\\\g_blueteam\\\\c1\\4\\c2\\5\\hc\\95\\w\\0\\l\\0\\tt\\0\\tl\\0');
        logParser['handleLine']('1:47 ClientUserinfoChanged: 2 n\\Dono da Bola\\t\\0\\model\\sarge\\hmodel\\sarge\\g_redteam\\\\g_blueteam\\\\c1\\4\\c2\\5\\hc\\95\\w\\0\\l\\0\\tt\\0\\tl\\0');
        logParser['handleLine']('2:22 Kill: 3 2 10: Isgalamido killed Dono da Bola by MOD_RAILGUN');
        logParser['handleLine']('1:47 ShutdownGame:');

        const result = logParser.processedData.get('game_1');

        expect(result).toBeDefined();
        expect(result?.total_kills).toBe(1);
        expect(result?.players).toEqual(['Isgalamido', 'Dono da Bola']);
        expect(result?.kills).toEqual({
            'Isgalamido': 1
        });
        expect(result?.kills_by_means).toEqual({
            MOD_RAILGUN: 1
        });
        expect(result?.scoreboard).toEqual([
            'Nickname | Kills | Deaths',
            'Isgalamido | 1 | 0',
            'Dono da Bola | 0 | 1'
        ]);
    });
    it('should handle InitGame and ShutdownGame lines correctly', () => {
        logParser['handleLine']('1:47 InitGame: \\');
        expect(logParser['gameId']).toBe(1);

        logParser['handleLine']('1:47 ClientUserinfoChanged: 2 n\\Dono da Bola\\t\\0\\model\\sarge\\hmodel\\sarge\\g_redteam\\\\g_blueteam\\\\c1\\4\\c2\\5\\hc\\95\\w\\0\\l\\0\\tt\\0\\tl\\0');
        logParser['handleLine']('2:22 Kill: 3 2 10: Isgalamido killed Dono da Bola by MOD_RAILGUN');
        logParser['handleLine']('1:47 ShutdownGame:');
        expect(logParser['gameId']).toBe(2);
        expect(logParser.processedData.size).toBe(1);
    });

    it('should handle stream close correctly', () => {
        const consoleSpy = jest.spyOn(console, 'log');
        logParser['handleClose']();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should handle lightly broken log', () => {
        logParser['handleLine']('1:47 InitGame: \\');
        expect(logParser['gameId']).toBe(1);

        logParser['handleLine']('1:47 ClientUserinfoChanged: 2 n\\Dono da Bola\\t\\0\\model\\sarge\\hmodel\\sarge\\g_redteam\\\\g_blueteam\\\\c1\\4\\c2\\5\\hc\\95\\w\\0\\l\\0\\tt\\0\\tl\\0');
        logParser['handleLine']('2:22 Kill: 3 2 10: Isgalamido killed Dono da Bola by MOD_RAILGUN');
        logParser['handleLine']('13:47 InitGame: \\');
        expect(logParser['gameId']).toBe(2);
        expect(logParser.processedData.size).toBe(1);
    });
});
