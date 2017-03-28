

var all = {};

// Set to 'dev', 'prod', or 'test'

all.mode = process.env.NODE_ENV || 'dev';

// http or https
all.protocol = 'https';

// Server host
all.host = 'localhost';

// Server port
all.port = 10101;

all.apiServer = 'https://localhostj0.myrollcall.com:10101';
all.uiServer  = 'file:///Users/mkm/www/panode/cli/index.html';

//var docRoot = "/home/mkm/virtuals/mike/httpdocs/photo/album/1977/";
//var docRoot = "/Users/mkm/www/panode/srv/albums";

all.apiDocroot = '/Users/mkm/www/panode/srv/albums';

module.exports = all;
