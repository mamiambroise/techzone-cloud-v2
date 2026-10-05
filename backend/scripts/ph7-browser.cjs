const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
module.exports=async function browserRecipe(fixtures){
  const {createServer}=await import(pathToFileURL(path.resolve('../frontend/node_modules/vite/dist/node/index.js')).href);
  const server=await createServer({root:path.resolve('../frontend'),configFile:path.resolve('../frontend/vite.config.ts'),server:{host:'127.0.0.1',port:3108,strictPort:true,proxy:{'/api/iam':{target:'http://127.0.0.1:3107',changeOrigin:true},'/api':{target:'http://127.0.0.1:3107',changeOrigin:true}}}});
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'techzone-ph7-browser-'));
  const artifacts=path.join(os.tmpdir(),'techzone-phase7-safety');
  let browser,socket;
  try{
    await server.listen();
    browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9317','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
    let target;
    for(let i=0;i<80;i++){try{target=(await(await fetch('http://127.0.0.1:9317/json/list')).json()).find(t=>t.type==='page');if(target)break;}catch{}await new Promise(r=>setTimeout(r,250));}
    assert(target,'Owned browser did not start');
    socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
    let sequence=0;const pending=new Map(),errors=[];
    socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const task=pending.get(message.id);if(task){pending.delete(message.id);message.error?task.reject(new Error(message.error.message)):task.resolve(message.result);}}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);};
    const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
    const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
    await call('Runtime.enable');await call('Network.enable');
    for(const f of fixtures){
      await call('Network.clearBrowserCookies');
      for(const pair of f.cookie.split('; ')){const index=pair.indexOf('=');await call('Network.setCookie',{name:pair.slice(0,index),value:pair.slice(index+1),domain:'127.0.0.1',path:'/',httpOnly:true});}
      await call('Page.navigate',{url:`http://127.0.0.1:3108/tests/phase7-browser.html?pack=${f.code.toLowerCase()}&tenant=${f.app.tenantId}`});
      let ready=false;
      for(let i=0;i<100;i++){ready=await evaluate("Boolean(document.querySelector('[aria-label=\"Pages de l’application\"]'))");if(ready)break;await new Promise(r=>setTimeout(r,250));}
      assert(ready,'Published browser UI did not load');
      const label=f.code==='WIFI_SERVICES'?'Customer — list':'Product — list';
      await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(label)}).click()`);
      for(const width of [320,768,1024,1440]){
        await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
        await new Promise(r=>setTimeout(r,400));
        const dimensions=await evaluate('({viewport:innerWidth,document:document.documentElement.scrollWidth,table:!!document.querySelector("table")})');
        assert(dimensions.table);assert(dimensions.document<=dimensions.viewport+1,JSON.stringify({width,...dimensions}));
        const screenshot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(artifacts,`${f.code}-${width}.png`),Buffer.from(screenshot.data,'base64'));
      }
      await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
      assert(await evaluate("['BUTTON','INPUT','SELECT','A'].includes(document.activeElement.tagName)"),'Keyboard focus unavailable');
    }
    assert.deepEqual(errors,[],'Browser runtime exceptions');
    console.log('PASS browser: 2 applications × 4 viewports, keyboard focus, zero runtime exceptions');
    await call('Browser.close').catch(()=>{});
  }finally{if(socket)socket.close();if(browser)browser.kill();await server.close();}
};
