const config = require('./config');
const { add } = require('./add');
const { mod, resume } = require('./mod');
// 如果有日志文件，说明上一次没有上传完成，接着上传
const fs = require('fs');
const infoFile = config.serverConfig.infoFile;
const runDataFile = config.serverConfig.runData;
// info.json 文件是否存在， 存在说明上次上传没有完成
if (fs.existsSync(infoFile)) {
  // 文件存在，走续传逻辑
  const resumeConf = require(infoFile);
  // 读取日志文件，得到上传文件
  fs.readFileSync(filePath);
  const runData = fs.readFileSync(runDataFile);
  const files = [];
  // 将文件按行拆成数组
  const uploadedFiles = runData.split(/\r?\n/);
  // 过滤获取没有上传的文件
  files = infoFile.files.filter(file => {
    return !uploadedFiles.find(uFile => uFile === file);
  })
  return resume(resumeConf, files);
} 

if (config.mode === 'mod') {
    mod();
} else {
    add();
}
