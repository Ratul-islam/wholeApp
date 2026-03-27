let config = null;
export const setConfig = (c) => { config = c; };
export const getConfig = () => {
    if (!config)
        throw new Error('Config not initialized');
    return config;
};
