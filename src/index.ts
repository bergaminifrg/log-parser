import { LogParser } from './services/LogParser';

const logParser = new LogParser();
logParser.parse('./data/qgames.log');