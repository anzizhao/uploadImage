// upload config 
exports.mode = 'mod'; // 'add' or 'mod'
exports.imageDir = '/media/anzi/虚拟机/图片/惠州'; 
// 客户端的配置
exports.serverConfig = {
    host: 'http://www.anzizhao.com',
    userId: '5718487a86d9aa500fc696e5'
};

// use just in add mode
exports.categoryData = {
    name: '部门组织惠东游玩',
    inShort: '一次难得的经历',
    describe: '不知不觉，跟自媒体经历了这么多事情',
    coverImg: 'IMG_2576.JPG',
    symbolImgs: [
        'IMG_2536.JPG', 
        'IMG_2559.JPG', 
        'IMG_2592.JPG'
    ] 
};
// use just in mod mode
exports.categoryId = '';


// for test
// exports.serverConfig = {
//     host: 'http://localhost:3001',
//     userId: '5750cbc575a3ef200a96cb16'
// };
