const config = require('./config');
const { 
    serverConfig, 
    imageDir
} = config;
const io = require('socket.io-client');
const ss = require('socket.io-stream');
const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const sizeOf = require('image-size');
const glob = require('glob');

const infoFile = serverConfig.infoFile;
const runData = serverConfig.runData;
let socket = '';
// 目录的id
let categoryId = config.categoryId;
// 用户的id
let userId = serverConfig.userId;
// 准备发送的文件队列
let fileQueue = [];
let filePath = '';
let sendNum = 0;
let coverImg = null;
let symbolImgs = null;

const startTime = Date.now();

exports.mod = () => {
    // options is optional
    glob(`${imageDir}/*`, null, (err, files) => {
        if (err) {
            console.log(imageDir, ' directory read error, ', err);
            return;
        }
        // 记录info.json 文件
        const info = {
            categoryId,
            userId,
            files: files
        };
        const ws = fs.createWriteStream(infoFile);
        ws.write(JSON.stringify(info, null, 4));
        ws.end();
        handleFiles(config.files);
    })
};
exports.resume = (config, files) => {
    categoryId = config.categoryId;
    userId = config.userId;
    handleFiles(files);
};
// options is optional
function handleFiles(files) {
    fileQueue = files.map(item => {
        // 生成对应的uuid
        return {
            filePath: item,
            uuid: uuid.v1()
        }
    });
    console.log('files number: ', fileQueue.length)
    socket = io.connect(serverConfig.host);

    const fileToSend = getFile();
    if(!fileToSend) {
        // 如果没有图片需要发送，返回退出
        return;
    } 
    socket.emit('pictureMod_start');
    socket.on('addCategoryImages_ret', (data) => {
        if (data.error) {
            console.log('addCategoryImages return error ', data)
            return;
        } 
        console.log('addCategoryImages return ', sendNum, data)
        fs.appendFile(runData, filePath + '\n');
        const fileToSend = getFile();
        if(fileToSend) {
            sendImage(fileToSend);
        } else {
            socket.emit('pictureMod_end');
            console.log('pictureMod_end');
            const endTime = Date.now();
            console.log(`upload images take times: ${(endTime-startTime)/ 1000}s`);
            console.log(Date.now());
            // 关闭链接
            socket.close();
            // 上传成功，上传log的内容
            clearLog();
        }
    })
    socket.on('disconnect', () => {
        console.log('disconnect, ', Date.now());
    });
    sendImage(fileToSend);
}

function sendImage(opt) {
    filePath = opt.filePath;
    if (!filePath) {
        console.log('error, no file in the queue');
        return;
    }
    // 读取图片准备上传
    const stream = ss.createStream();
    const info = sizeOf(filePath);
    data = {
        userId,
        categoryId,
        uuid: opt.uuid,
        width: info.width,
        height: info.height 
    };
    ss(socket).emit('addCategoryImages', stream, data);
    fs.createReadStream(filePath).pipe(stream);
    console.log('addCategoryImages emit, ', sendNum, data.uuid);
}
function getFile() {
    if (sendNum === fileQueue.length) {
        return;
    }
    return fileQueue[sendNum++];
}
function clearLog() {
    const files = fs.readdirSync(serverConfig.logDir);
    files.forEach(function(file, index){
        const curPath = serverConfig.logDir + "/" + file;
        fs.unlinkSync(curPath);
    });
}
