const config = require('./config');
const { add } = require('./add');
const { mod } = require('./mod');
if (config.mode === 'mod') {
    mod();
} else {
    add();
}
