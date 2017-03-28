var _ = require('lodash');

var all  = loadSettings('./all');
var mode = loadSettings('./' + all.mode); // all.mode is 'dev', 'test', or 'prod'

all = _.merge(all, mode);

// Build the server URL, like http://localhost:8080
all.serverUrl = all.protocol + '://' + all.host;
if (80 !== all.port) {
    all.serverUrl += ':' + all.port;
}

module.exports = all;

// Loads the settings from a config file. Will fail silently if the file does not exist.
function loadSettings(path) {

    var pathFound = false;

    try {
        require.resolve(path);
        pathFound = true;
    } catch (error) {
        // silently ignore
    }

    var settings = {};
    if (pathFound) {
        settings = require(path);
    }

    return settings;
}
