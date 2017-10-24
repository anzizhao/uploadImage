// upload config 
exports.mode = 'add'; // 'add' or 'mod'
exports.imageDir = '/home/share/workplace/tmpdir/docker'; 
// 客户端的配置
exports.serverConfig = {
    host: 'http://www.anzizhao.com',
    userId: '5718487a86d9aa500fc696e5',
    logDir: './log',
    infoFile: './log/info.json',
    runData: './log/run.data'
};
// for test
 // exports.serverConfig = {
 //     host: 'http://localhost:3001',
 //     userId: '5750cbc575a3ef200a96cb16',
 //     logDir: './log',
 //     infoFile: './log/info.json',
 //     runData: './log/run.data'
 // };

// use just in add mode
exports.categoryData = {
    name: 'test',
    inShort: 'test in short',
    describe: 'test describe',
    coverImg: 'bash_shell.png',
    symbolImgs: [
        'bash_shell.png', 
        'install.png', 
        'runner_docker.png'
    ] 
};
// use just in mod mode
exports.categoryId = '59e2d2c4db37ea1b8875bfc3';


