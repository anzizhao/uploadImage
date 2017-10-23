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

const infoFile = serverConfig.infoFile;
const runData = serverConfig.runData;

exports.add = () => {
    let socket = '';
    // 目录的id
    let categoryId = '';
    // 用户的id
    let userId = serverConfig.userId;
    // 准备发送的文件队列
    let fileQueue = [];
    let filePath = '';
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
        if (!files.length) {
            console.error(`${imageDir} directory is empty`);
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
        console.log('coverImg: ', coverImg)
        console.log('symbolImgs: ', symbolImgs)
        console.log('files number: ', fileQueue.length)
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
            fs.appendFile(runData, filePath + '\n', function(error) {
                if (error){
                    console.log('error: ', error);
                }
            });
            const fileToSend = getFile();
            if(fileToSend) {
                sendImage(fileToSend);
            } else {
                socket.emit('pictureAdd_end');
                console.log('pictureAdd_end');
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
    })

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
    function clearLog() {
        const files = fs.readdirSync(serverConfig.logDir);
        files.forEach(function(file, index){
            const curPath = serverConfig.logDir + "/" + file;
            fs.unlinkSync(curPath);
        });
    }
};


