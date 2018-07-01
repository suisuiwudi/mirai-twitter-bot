import * as fs from 'fs';
import * as path from 'path';

function sub(chat: IChat, args: string[], lock: ILock, lockfile: string): string {
  if (args.length === 0) {
    return '找不到要订阅的链接。';
  }
  const link = args[0];
  let flag = false;
  let match = link.match(/https:\/\/twitter.com\/([^\/]+)\/lists\/([^\/]+)/);
  if (match) flag = true;
  else {
    match = link.match(/https:\/\/twitter.com\/([^\/]+)/);
    if (match) flag = true;
  }
  if (!flag) {
    return `订阅链接格式错误：
示例：
https://twitter.com/Saito_Shuka
https://twitter.com/rikakomoe/lists/lovelive`;
  }
  flag = false;
  lock.feed.forEach(fl => {
    if (fl === link) flag = true;
  });
  if (!flag) lock.feed.push(link);
  if (!lock.threads[link]) {
    lock.threads[link] = {
      offset: 0,
      subscribers: [],
    };
  }
  flag = false;
  lock.threads[link].subscribers.forEach(c => {
    if (c.chatID === chat.chatID && c.chatType === chat.chatType) flag = true;
  });
  if (!flag) lock.threads[link].subscribers.push(chat);
  fs.writeFileSync(path.resolve(lockfile), JSON.stringify(lock));
  return `已为此聊天订阅 ${link}`;
}

function unsub(chat: IChat, args: string[], lock: ILock, lockfile: string): string {
  if (args.length === 0) {
    return '找不到要退订的链接。';
  }
  const link = args[0];
  if (!lock.threads[link]) {
    return '您没有订阅此链接。\n' + list(chat, args, lock);
  }
  let flag = false;
  lock.threads[link].subscribers.forEach((c, index) => {
    if (c.chatID === chat.chatID && c.chatType === chat.chatType) {
      flag = true;
      lock.threads[link].subscribers.splice(index, 1);
    }
  });
  if (flag) {
    fs.writeFileSync(path.resolve(lockfile), JSON.stringify(lock));
    return `已为此聊天退订 ${link}`;
  }
  return '您没有订阅此链接。\n' + list(chat, args, lock);
}

function list(chat: IChat, args: string[], lock: ILock): string {
  const links = [];
  Object.keys(lock.threads).forEach(key => {
    lock.threads[key].subscribers.forEach(c => {
      if (c.chatID === chat.chatID && c.chatType === chat.chatType) links.push(key);
    });
  });
  return '此聊天中订阅的链接：\n' + links.join('\n');
}

export { sub, list, unsub };
