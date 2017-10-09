const config = require('./config');
const { 
    categoryData, 
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

let socket = '';
// 目录的id
let categoryId = '';
// 准备发送的文件队列
let fileQueue = [];
let sendNum = 0;
let coverImg = null;
let symbolImgs = null;

const startTime = Date.now();
// options is optional
glob(`${imageDir}/*`, null, function (err, files) {
    if (err) {
        console.log(imageDir, ' directory read error, ', err);
        return;
    }
    fileQueue = files.map(item => {
        // 生成对应的uuid
        return {
            filePath: item,
            uuid: uuid.v1()
        }
    });
    // 如果有设置目录和首三张，替换对应uuid
    if (categoryData.coverImg) {
        const result = fileQueue.find(item => path.basename(item.filePath) === categoryData.coverImg)
        if (result) {
            coverImg = {
                uuid: result.uuid    
            } 
        }
    }
    if (categoryData.symbolImgs) {
        symbolImgs = categoryData.symbolImgs.map(sItem => {
            const result = fileQueue.find(item => path.basename(item.filePath) === sItem )
            const id = !!result ? result.uuid : '';
            return {
                uuid: id
            }
        }).filter(item => !!item.uuid ); 
    }
    console.log(coverImg)
    console.log(symbolImgs)
    console.log('files number: ', fileQueue.length)
    // return;
    //
    console.log('success to read image dir');
    socket = io.connect(serverConfig.host);
 
    socket.emit('pictureAdd_start');

    let data = {
        userId: serverConfig.userId,
        name: categoryData.name || 'client upload image',
        inShort: categoryData.inShort || 'just a test',
        describe: categoryData.describe || 'describe, just a test',
        coverImg,
        symbolImgs
    };

    socket.emit('addCategory', data);
    socket.on('addCategory_ret', (ret) => {
        console.log('addCategory_ret: ', ret);
        categoryId = ret.id;
        const fileToSend = getFile();
        if(fileToSend) {
            sendImage(fileToSend);
        }
    })
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
            socket.emit('pictureAdd_end');
            console.log('pictureAdd_end');
            const endTime = Date.now();
            console.log(`upload images take times: ${(endTime-startTime)/ 1000}s`);
            // 关闭链接
            socket.close();
        }
    })

    socket.on('disconnect', () => {
        console.log('disconnect');
    });
})

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
        userId: serverConfig.userId,
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
