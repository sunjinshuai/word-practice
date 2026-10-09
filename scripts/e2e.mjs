import {spawn} from 'node:child_process';
import {setTimeout} from 'node:timers/promises';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','8771','--strictPort'],{stdio:'ignore'});
const url='http://127.0.0.1:8771';
try{
 let ready=false;
 for(let i=0;i<50;i++){try{ready=(await fetch(url)).ok;if(ready)break}catch{}await setTimeout(100)}
 if(!ready)throw new Error('Preview server did not start');
 for(const test of ['success','sessions','react']){const child=spawn(process.execPath,[`tests/${test}.cjs`],{stdio:'inherit',env:{...process.env,TEST_URL:url}});const code=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject)});if(code)throw new Error(`${test} failed (${code})`)}
}finally{server.kill()}
