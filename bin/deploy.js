const { readFileSync } = require('fs');
const path = require('path');

const { Client } = require('ssh2');
const inquirer = require('inquirer');

const conn = new Client();

const cdDir = 'cd /var/www/html/vue-magento';
const install = 'yarn install'
const buildJeedaB = 'yarn build:jeeda-b'
const pm2Start = 'pm2 delete ecosystem.config.js && cross-env APP_ENV=jeeda-b pm2 start ecosystem.config.js';

const questions = [
  {
    type: 'input',
    name: 'branch',
    message: "请输入要构建的分支?",
  },
];

// ssh 命令执行
function executeCommand(command, callback) {
  conn.exec(command, function(err, stream) {
      if (err) throw err;
      stream.on('close', function(code, signal) {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          callback();
      }).on('data', function(data) {
          console.log('STDOUT: ' + data);
      }).stderr.on('data', function(data) {
          console.log('STDERR: ' + data);
      });
  });
}

conn.on('ready', async () => {
  const answers = await inquirer.prompt(questions)
  if (!answers.branch) throw new Error('构建分支不能为空！');
  console.log(`Hi,开始构建${answers.branch}分支!`);
  executeCommand(`${cdDir} && git checkout ${answers.branch} && git pull origin ${answers.branch} && ${install} && ${buildJeedaB} && ${pm2Start}`, () => {
    conn.end();
  })
}).connect({
  host: '18.236.135.174',
  port: 22,
  username: 'ubuntu',
  privateKey: readFileSync(path.join(__dirname, './key.txt'))
});

conn.on('error', function(err) {
  console.error('连接出错: ' + err);
  conn.end();
});