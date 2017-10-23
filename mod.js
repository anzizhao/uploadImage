const config = require('./config');
const { 
    serverConfig, 
    imageDir,
    infoFile
} = config;
const io = require('socket.io-client');
const ss = require('socket.io-stream');
const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const sizeOf = require('image-size');
const glob = require('glob');


let socket = '';
// 目录的id
let categoryId = config.categoryId;
// 用户的id
let userId = serverConfig.userId;
// 准备发送的文件队列
let fileQueue = [];
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
        handleFile(config.files);
    })
};
exports.resume = (config) => {
    categoryId = config.categoryId;
    userId = config.userId;
    handleFile(config.files);
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
        }
    })
    socket.on('disconnect', () => {
        console.log('disconnect, ', Date.now());
    });
    sendImage(fileToSend);
}

function sendImage(opt) {
    const filePath = opt.filePath;
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