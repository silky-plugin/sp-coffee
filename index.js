'use strict';
const _url = require('url');
const _path = require('path');
const _fs = require('fs');
const _coffee = require('coffee-script');

//根据实际路径获取文件内容
const getCompileContent = (cli, realFilePath, data, cb)=>{
  if(!_fs.existsSync(realFilePath)){
    data.status = 404
    return cb(null, null)
  }
  let fileContent = _fs.readFileSync(realFilePath, {encoding: 'utf8'})
  try{
    let source = _coffee.compile(fileContent)
    data.status = 200
    cb(null, source)
  }catch(e){
    cb(e)
  }
}

exports.registerPlugin = function(cli, options){


  cli.registerHook('route:didRequest', (req, data, content, cb)=>{

    //如果不需要编译
    if(!/\.js$/.test(req.path)){
      return cb(null, content)
    }
    let fakeFilePath = _path.join(cli.cwd(), req.path);
    //替换路径为less
    let realFilePath = fakeFilePath.replace(/(js)$/,'coffee')

    getCompileContent(cli, realFilePath, data, (error, content)=>{
      if(error){return cb(error)};
      //交给下一个处理器
      cb(null, content)
    })
  })

  cli.registerHook('build:doCompile', (buildConfig, data, content, cb)=>{
    let inputFilePath = data.inputFilePath;
    if(!/(\.coffee)$/.test(inputFilePath)){
      return cb(null, content)
    }

    getCompileContent(cli, inputFilePath, data, (error, content)=>{
      if(error){return cb(error)};
      if(data.status == 200){
        data.outputFilePath = data.outputFilePath.replace(/(\coffee)$/, "js");
        data.outputFileRelativePath = data.outputFileRelativePath.replace(/(\coffee)$/, "js")
      }
      cb(null, content);
    })
  })
}