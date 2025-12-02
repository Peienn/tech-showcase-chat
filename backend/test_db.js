const Messages = require('./models/message');
const Users = require('./models/user');



async function runTest() {

  const messatge = await Messages.insertMessage(1,'brent', 'regrere');
  const user = await Users.getUserIDByName('brent')
  console.log('查到使用者：', user);
  process.exit();
}

runTest();

