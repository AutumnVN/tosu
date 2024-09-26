import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { getProgramPath } from './directories';
import { checkGameOverlayConfig } from './gosu';
import { wLogger } from './logger';

const configPath = path.join(getProgramPath(), 'tsosu.env');

const createConfig = () => {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(
            configPath,
            `# The config implies a set of key-values to enable/disable tosu functionality
# Below you can see that there is EVERY_THE_FUNCTION=true/false,
# true = on
# false = off

# Turns PP counting on/off. Very useful for tournament client, when you only care about scoring and map stats for example
CALCULATE_PP=true
# Enables/disables reading K1/K2/M1/M2 keys on the keyboard
ENABLE_KEY_OVERLAY=true
ENABLE_AUTOUPDATE=true

# Reference: 1 second = 1000 milliseconds
# Once in what value, the programme should read the game values (in milliseconds)
POLL_RATE=100
# Once per value, the programme should read the values of keys K1/K2/M1/M2 (in milliseconds)
PRECISE_DATA_POLL_RATE=100

# Shows !mp commands (messages starting with '!mp') in tournament manager chat (hidden by default)
SHOW_MP_COMMANDS=false

# Enables/disables the in-game gosumemory overlay (!!!I AM NOT RESPONSIBLE FOR USING IT!!!).
ENABLE_GOSU_OVERLAY=false

# WARNING: EVERYTHING BELOW IS NOT TO BE TOUCHED UNNECESSARILY.

# Enables logs for tosu developers, not very intuitive for you, the end user.
# best not to include without developer's request.
DEBUG_LOG=false
OPEN_DASHBOARD_ON_STARTUP=true

# IP address where the websocket api server will be registered
# 127.0.0.1 = localhost
# 0.0.0.0.0 = all addresses
SERVER_IP=127.0.0.1
# The port on which the websocket api server will run
SERVER_PORT=24050
# The folder from which the overlays will be taken.
STATIC_FOLDER_PATH=./static`,
            'utf8'
        );
    }
};

dotenv.config({ path: configPath });

export const config = {
    enableAutoUpdate: (process.env.ENABLE_AUTOUPDATE || 'true') === 'true',
    openDashboardOnStartup:
        (process.env.OPEN_DASHBOARD_ON_STARTUP || 'true') === 'true',
    debugLogging: (process.env.DEBUG_LOG || '') === 'true',
    calculatePP: (process.env.CALCULATE_PP || '') === 'true',
    enableKeyOverlay: (process.env.ENABLE_KEY_OVERLAY || '') === 'true',
    pollRate: Number(process.env.POLL_RATE || '500'),
    preciseDataPollRate: Number(
        process.env.PRECISE_DATA_POLL_RATE ||
            process.env.KEYOVERLAY_POLL_RATE ||
            '100'
    ),
    showMpCommands: (process.env.SHOW_MP_COMMANDS || '') === 'true',
    serverIP: process.env.SERVER_IP || '127.0.0.1',
    serverPort: Number(process.env.SERVER_PORT || '24050'),
    staticFolderPath: process.env.STATIC_FOLDER_PATH || './static',
    enableGosuOverlay: (process.env.ENABLE_GOSU_OVERLAY || '') === 'true',
    timestamp: 0,
    currentVersion: '',
    updateVersion: '',
    logsPath: ''
};

export const updateConfigFile = () => {
    let newOptions = '';

    if (!process.env.DEBUG_LOG) {
        newOptions += 'DEBUG_LOG, ';
        fs.appendFileSync(configPath, '\nDEBUG_LOG=false', 'utf8');
    }

    if (!process.env.CALCULATE_PP) {
        newOptions += 'CALCULATE_PP, ';
        fs.appendFileSync(configPath, '\nCALCULATE_PP=true', 'utf8');
    }

    if (!process.env.ENABLE_KEY_OVERLAY) {
        newOptions += 'ENABLE_KEY_OVERLAY, ';
        fs.appendFileSync(configPath, '\nENABLE_KEY_OVERLAY=true', 'utf8');
    }

    if (!process.env.POLL_RATE) {
        newOptions += 'POLL_RATE, ';
        fs.appendFileSync(configPath, '\nPOLL_RATE=100', 'utf8');
    }

    if (!process.env.PRECISE_DATA_POLL_RATE) {
        newOptions += 'PRECISE_DATA_POLL_RATE, ';
        fs.appendFileSync(configPath, '\n\nPRECISE_DATA_POLL_RATE=100', 'utf8');
    }

    if (!process.env.SHOW_MP_COMMANDS) {
        newOptions += 'SHOW_MP_COMMANDS, ';
        fs.appendFileSync(configPath, '\nSHOW_MP_COMMANDS=false', 'utf8');
    }

    if (!process.env.SERVER_IP) {
        newOptions += 'SERVER_IP, ';
        fs.appendFileSync(configPath, '\nSERVER_IP=127.0.0.1', 'utf8');
    }

    if (!process.env.SERVER_PORT) {
        newOptions += 'SERVER_PORT, ';
        fs.appendFileSync(configPath, '\nSERVER_PORT=24050', 'utf8');
    }

    if (!process.env.STATIC_FOLDER_PATH) {
        newOptions += 'STATIC_FOLDER_PATH, ';
        fs.appendFileSync(configPath, '\nSTATIC_FOLDER_PATH=./static', 'utf8');
    }

    if (!process.env.ENABLE_GOSU_OVERLAY) {
        newOptions += 'ENABLE_GOSU_OVERLAY, ';
        fs.appendFileSync(configPath, '\nENABLE_GOSU_OVERLAY=false', 'utf8');
    }

    if (!process.env.ENABLE_AUTOUPDATE) {
        newOptions += 'ENABLE_AUTOUPDATE, ';
        fs.appendFileSync(configPath, '\nENABLE_AUTOUPDATE=true', 'utf8');
    }

    if (!process.env.OPEN_DASHBOARD_ON_STARTUP) {
        newOptions += 'OPEN_DASHBOARD_ON_STARTUP, ';
        fs.appendFileSync(
            configPath,
            '\nOPEN_DASHBOARD_ON_STARTUP=true',
            'utf8'
        );
    }

    if (newOptions !== '') {
        wLogger.warn(`New options available in config: ${newOptions}\n`);
    }
};

export const watchConfigFile = ({
    httpServer,
    initial
}: {
    httpServer: any;
    initial?: boolean;
}) => {
    if (initial === true) {
        createConfig();
        refreshConfig(httpServer, false);
        updateConfigFile();
    }

    if (!fs.existsSync(configPath)) {
        createConfig();
    }

    const stat = fs.statSync(configPath);
    if (config.timestamp !== stat.mtimeMs) {
        refreshConfig(httpServer, true);
        config.timestamp = stat.mtimeMs;
    }

    setTimeout(() => {
        watchConfigFile({ httpServer });
    }, 1000);
};

export const refreshConfig = (httpServer: any, refresh: boolean) => {
    let updated = false;
    const status = refresh === true ? 'reload' : 'load';

    const { parsed, error } = dotenv.config({ path: configPath });
    if (error != null || parsed == null) {
        wLogger.error(`Config ${status} failed`);
        return;
    }

    const enableAutoUpdate = (parsed.ENABLE_AUTOUPDATE || '') === 'true';
    const openDashboard = (parsed.OPEN_DASHBOARD || '') === 'true';
    const debugLogging = (parsed.DEBUG_LOG || '') === 'true';
    const serverIP = parsed.SERVER_IP || '127.0.0.1';
    const serverPort = Number(parsed.SERVER_PORT || '24050');
    const calculatePP = (parsed.CALCULATE_PP || '') === 'true';
    const enableKeyOverlay = (parsed.ENABLE_KEY_OVERLAY || '') === 'true';
    const pollRate = Number(parsed.POLL_RATE || '100');
    const preciseDataPollRate = Number(
        parsed.PRECISE_DATA_POLL_RATE || parsed.KEYOVERLAY_POLL_RATE || '100'
    );
    const showMpCommands = (parsed.SHOW_MP_COMMANDS || '') === 'true';
    const staticFolderPath = parsed.STATIC_FOLDER_PATH || './static';
    const enableGosuOverlay = (parsed.ENABLE_GOSU_OVERLAY || '') === 'true';

    // determine whether config actually was updated or not
    updated =
        config.enableAutoUpdate !== enableAutoUpdate ||
        config.openDashboardOnStartup !== openDashboard ||
        config.debugLogging !== debugLogging ||
        config.calculatePP !== calculatePP ||
        config.enableKeyOverlay !== enableKeyOverlay ||
        config.pollRate !== pollRate ||
        config.preciseDataPollRate !== preciseDataPollRate ||
        config.showMpCommands !== showMpCommands ||
        config.staticFolderPath !== staticFolderPath ||
        config.enableGosuOverlay !== enableGosuOverlay ||
        config.serverIP !== serverIP ||
        config.serverPort !== serverPort;

    if (config.serverIP !== serverIP || config.serverPort !== serverPort) {
        config.serverIP = serverIP;
        config.serverPort = serverPort;

        httpServer.restart();
    }

    if (
        config.pollRate !== pollRate ||
        config.preciseDataPollRate !== preciseDataPollRate
    ) {
        config.pollRate = pollRate >= 0 ? pollRate : 100;
        config.preciseDataPollRate =
            preciseDataPollRate >= 0 ? preciseDataPollRate : 100;
        httpServer.restartWS();
    }

    checkGameOverlayConfig();

    const osuInstances: any = Object.values(
        httpServer.instanceManager.osuInstances || {}
    );
    if (
        osuInstances.length === 1 &&
        enableGosuOverlay === true &&
        updated === true
    ) {
        osuInstances[0].injectGameOverlay();
    }

    config.enableGosuOverlay = enableGosuOverlay;

    config.debugLogging = debugLogging;
    config.calculatePP = calculatePP;
    config.enableKeyOverlay = enableKeyOverlay;
    config.showMpCommands = showMpCommands;
    config.staticFolderPath = staticFolderPath;

    const staticPath = path.join(getProgramPath(), 'static');
    if (config.staticFolderPath === './static' && !fs.existsSync(staticPath)) {
        fs.mkdirSync(staticPath);
    }

    if (updated) wLogger.info(`Config ${status}ed`);
};

export const writeConfig = (httpServer: any, options: any) => {
    let text = '';

    text += `DEBUG_LOG=${options.DEBUG_LOG ?? config.debugLogging}\n\n`;
    text += `CALCULATE_PP=${options.CALCULATE_PP ?? config.calculatePP}\n\n`;
    text += `ENABLE_AUTOUPDATE=${options.ENABLE_AUTOUPDATE ?? config.enableAutoUpdate}\n`;
    text += `OPEN_DASHBOARD_ON_STARTUP=${options.OPEN_DASHBOARD_ON_STARTUP ?? config.openDashboardOnStartup}\n\n`;
    text += `ENABLE_GOSU_OVERLAY=${options.ENABLE_GOSU_OVERLAY ?? config.enableGosuOverlay}\n`;
    text += `ENABLE_KEY_OVERLAY=${options.ENABLE_KEY_OVERLAY ?? config.enableKeyOverlay}\n\n`;
    text += `POLL_RATE=${options.POLL_RATE ?? config.pollRate}\n`;
    text += `PRECISE_DATA_POLL_RATE=${options.PRECISE_DATA_POLL_RATE ?? config.preciseDataPollRate}\n\n`;
    text += `SHOW_MP_COMMANDS=${options.SHOW_MP_COMMANDS ?? config.showMpCommands}\n\n`;
    text += `SERVER_IP=${options.SERVER_IP ?? config.serverIP}\n`;
    text += `SERVER_PORT=${options.SERVER_PORT ?? config.serverPort}\n\n`;
    text += `STATIC_FOLDER_PATH=${options.STATIC_FOLDER_PATH ?? config.staticFolderPath}\n`;

    fs.writeFile(configPath, text, 'utf8', () => {
        refreshConfig(httpServer, true);
    });
};
