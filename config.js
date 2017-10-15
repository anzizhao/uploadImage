// upload config 
exports.mode = 'mod'; // 'add' or 'mod'
exports.imageDir = './test'; 
// 客户端的配置
//exports.serverConfig = {
    //host: 'http://www.anzizhao.com',
    //userId: '5718487a86d9aa500fc696e5'
//};
// for test
 exports.serverConfig = {
     host: 'http://localhost:3001',
     userId: '5750cbc575a3ef200a96cb16'
 };

// use just in add mode
exports.categoryData = {
    name: 'test',
    inShort: 'test in short',
    describe: 'test describe',
    coverImg: 'test3.jpg',
    symbolImgs: [
        'test.jpg', 
        'test2.jpg', 
        'test3.jpg'
    ] 
};
// use just in mod mode
exports.categoryId = '59e2d2c4db37ea1b8875bfc3';


