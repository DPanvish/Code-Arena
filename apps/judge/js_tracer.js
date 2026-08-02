const inspector = require('inspector');
const fs = require('fs');

const code = fs.readFileSync(0, 'utf-8');
const snapshots = [];

const session = new inspector.Session();
session.connect();

session.post('Debugger.enable', () => {
  session.post('Runtime.enable', () => {
    
    session.on('Debugger.paused', async (message) => {
      try {
        const callFrames = message.params.callFrames;
        if (!callFrames || callFrames.length === 0) {
          session.post('Debugger.stepInto');
          return;
        }

        const topFrame = callFrames[0];
        // Only trace our script
        if (!topFrame.url.includes('arena_script.js')) {
          session.post('Debugger.stepInto');
          return;
        }

        const line = topFrame.location.lineNumber + 1; // 0-indexed in CDP
        
        // Extract variables from the local scope
        let variables = {};
        const localScope = topFrame.scopeChain.find(s => s.type === 'local' || s.type === 'closure');
        
        if (localScope) {
          const props = await new Promise(resolve => {
            session.post('Runtime.getProperties', {
              objectId: localScope.object.objectId,
              ownProperties: true
            }, (err, res) => resolve(res));
          });
          
          if (props && props.result) {
            for (const prop of props.result) {
              if (prop.name === 'exports' || prop.name === 'require' || prop.name === 'module' || prop.name === '__filename' || prop.name === '__dirname') continue;
              
              let valStr = "undefined";
              let typeStr = "undefined";
              if (prop.value) {
                typeStr = prop.value.type;
                if (prop.value.type === 'object') {
                  if (prop.value.subtype === 'array') {
                    // Try to resolve the array elements
                    const arrayProps = await new Promise(res => {
                        session.post('Runtime.getProperties', {
                            objectId: prop.value.objectId,
                            ownProperties: true
                        }, (e, r) => res(r));
                    });
                    if (arrayProps && arrayProps.result) {
                        const elements = arrayProps.result
                            .filter(p => !isNaN(parseInt(p.name)))
                            .sort((a,b) => parseInt(a.name) - parseInt(b.name))
                            .map(p => p.value ? p.value.value : null);
                        valStr = JSON.stringify(elements);
                    } else {
                        valStr = "[]";
                    }
                    typeStr = 'list';
                  } else if (prop.value.subtype === 'null') {
                    valStr = "null";
                  } else {
                    valStr = prop.value.description || "{Object}";
                  }
                } else if (prop.value.type === 'function') {
                  valStr = "[Function]";
                } else if (prop.value.type === 'string') {
                  valStr = JSON.stringify(prop.value.value);
                } else {
                  valStr = String(prop.value.value);
                }
              }
              variables[prop.name] = { type: typeStr, value: valStr };
            }
          }
        }
        
        // Extract call stack
        const stack = callFrames.filter(f => f.url.includes('arena_script.js')).map(f => ({
          function: f.functionName || '<anonymous>',
          line: f.location.lineNumber + 1
        }));
        
        snapshots.push({
          line,
          variables,
          stack
        });
        
        session.post('Debugger.stepInto');
      } catch (e) {
        snapshots.push({ error: String(e), type: 'TracerError', line: -1 });
        session.post('Debugger.stepInto');
      }
    });

    // Write code to a temp file and require it to start execution
    const path = require('path');
    const tempFile = path.resolve('./arena_script.js');
    fs.writeFileSync(tempFile, code);
    
    // We break on the first line
    session.post('Debugger.setBreakpointByUrl', {
      lineNumber: 0,
      url: 'file:///' + tempFile.replace(/\\/g, '/')
    }, () => {
      try {
        require(tempFile);
      } catch (e) {
        // Find line number from stack
        const match = e.stack.match(/arena_script\.js:(\d+)/);
        const errLine = match ? parseInt(match[1]) : null;
        snapshots.push({
          error: e.message,
          type: e.name,
          line: errLine
        });
      } finally {
        fs.unlinkSync(tempFile);
        console.log(JSON.stringify(snapshots));
        process.exit(0);
      }
    });
  });
});
