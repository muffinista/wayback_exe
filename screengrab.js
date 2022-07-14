const puppeteer = require('puppeteer')

// const argv = require('yargs')
// .example('$0 --url=https://example.com')
// .option('url')
// .option('width', {
//   describe: 'Width of viewport'
// })
// .option('height', {
//   describe: 'Height of viewport'
// })
// .option('out', {
//   default: '-',
//   describe: 'File path to save. If `-` specified, outputs to console in base64-encoded'
// })
// .option('delay', {
//   describe: 'Delay to save screenshot after loading CSS. Milliseconds'
// })
// .option('css', {
//   describe: 'Additional CSS URL to load'
// })
// .option('style', {
//   describe: 'Additional style to apply to body'
// })
// .demandOption(['url'])
// .argv


const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports.render = async function(args) {
  const { url, out, delay, css, style, width, height } = args;
  console.log("hey", args);

  let valid = true;
  const browser = await puppeteer.launch({args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]})
  const page = await browser.newPage()
  if (width && height) {
    await page.setViewport({ width, height })
  }
  try {
    await page.goto(url);
  }
  catch(err) {
    console.log(err);
  }
  if (css || style) {
    await page.evaluate((css, style) => {
      if (css) {
        const head = document.head
        const link = document.createElement('link')
        link.href = css
        link.rel = 'stylesheet'
        head.appendChild(link)
      }
      if (style) {
        document.body.setAttribute('style', style)
      }
    }, css, style)
  }
  
  if (delay) {
    await sleep(delay)
  }
  
  
  var text = await page.evaluate(() => document.querySelector('body').textContent);
  if ( text === null || text === undefined || text === "" ) {
    console.log("no text!!!!");
    valid = false;
  }
  
  if ( text.toLowerCase().lastIndexOf("504 Gateway") !== -1 ) {
    console.log("timeout!!!");
    valid = false;
  }
  
  if ( valid === true ) {
    var l = await page.$('#wm-tb-close');
    if ( l !== undefined && l !== null ) {
      l.click();
    }

      await sleep(2500);
    await page.evaluate(async() => {
      var f = document.querySelector('#donato');
      if ( f !== undefined && f !== null ) {
        f.parentNode.removeChild(f);
      }
    });
      

    await page.evaluate(async() => {
      var f = document.querySelector('#wm-ipp-base');
      if ( f !== undefined && f !== null ) {
        f.parentNode.removeChild(f);
      }
    });
    
    await page.evaluate(async() => {
      // WM sets 'min-width:800px !important;' on the body, let's try and remove it
      // http://stackoverflow.com/questions/33135966/phantomjs-remove-script-tags-from-html-snapshot-except-jsonld
      Array.prototype.slice.call(document.getElementsByTagName("style")).filter(function(style) {
        style.innerHTML.lastIndexOf("min-width:800px !important;") !== -1
      }).forEach(function(style) {
        console.log("remove", style);
        style.parentNode.removeChild(style);
      });
      
      // try and close WM js on any frames
      var list = Array.prototype.slice.call( document.getElementsByTagName("frame") );
      list.forEach(function(f) {
        if ( f && f.contentWindow && f.contentWindow.__wm ) {
          f.contentWindow.__wm.h();
        }
        
        if ( f && f.contentWindow && f.contentWindow.document ) {
          Array.prototype.slice.call(f.contentWindow.document.getElementsByTagName("style")).filter(function(style) {
            style.innerHTML.lastIndexOf("min-width:800px !important;") !== -1
          }).forEach(function(style) {
            style.parentNode.removeChild(style);
          });
        }
      });
      
      
      //
      // inject a function to iterate through all text nodes in the body, so we can clean them up a bit
      //
      function nativeSelector() {
        var walker = document.createTreeWalker(
          document.body, 
          NodeFilter.SHOW_TEXT, 
          null, 
          false
          );
          
          var node;
          var textNodes = [];
          
          // this is silly because there's no logic here, so we could just 
          // pass in a function to run against the node, but leaving for now
          while((node = walker.nextNode())) {
            textNodes.push(node);
          }
          
          return textNodes;
        }
        
        var textnodes = nativeSelector(),
        _nv;
        for (var i = 0, len = textnodes.length; i<len; i++){
          _nv = textnodes[i].textContent;
          
          // attempt to strip email addresses and phone numbers from output
          _nv = _nv.replace(/[A-Za-z0-9_\-\.]+\@/g, '░░░░░@').
          replace(/[\(\+]?\b[ 0-9\-\(\)+^'^"^<^>]{10,14}\b/g, function(m) { return m.replace(/[0-9]/g, "x"); });
          
          textnodes[i].textContent = _nv;
        }
      });
    }
    
    if ( valid ) {
      if (out === '-') {
        const screenshot = await page.screenshot()
        console.log(screenshot.toString('base64'))
      }
      else {
        console.log("write to " + out);
        await page.screenshot({path: out})
      }
    }
    else {
      
    }
    
    console.log("BROWSER CLOSED");
    browser.close();    
}
